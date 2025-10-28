import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolRequest,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type ReadResourceRequest,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type GetPromptRequest,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createLightdashClient } from 'lightdash-client-typescript-fetch';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  ListProjectsRequestSchema,
  GetProjectRequestSchema,
  ListSpacesRequestSchema,
  ListChartsRequestSchema,
  ListDashboardsRequestSchema,
  GetCustomMetricsRequestSchema,
  GetCatalogRequestSchema,
  GetMetricsCatalogRequestSchema,
  GetChartsAsCodeRequestSchema,
  GetDashboardsAsCodeRequestSchema,
  GetMetadataRequestSchema,
  GetAnalyticsRequestSchema,
  GetUserAttributesRequestSchema,
  RunUnderlyingDataQueryRequestSchema,
  GetCatalogSearchRequestSchema,
  GetExploreWithFullSchemaRequestSchema,
  GetExploresSummaryRequestSchema,
  GetSavedChartResultsRequestSchema,
  GetDashboardByUuidRequestSchema,
} from './schemas.js';

// Get package.json version for fallback
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');

let packageVersion = '0.0.1'; // Default fallback
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageVersion = packageJson.version || '0.0.1';
} catch {
  console.warn(
    'Could not read package.json version, using default:',
    packageVersion
  );
}

// Configuration with environment variable support
const serverName = process.env.MCP_SERVER_NAME || 'lightdash-mcp-server';
const serverVersion = process.env.MCP_SERVER_VERSION || packageVersion;

// Retry configuration
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '1000', 10);

// Enhanced error message helper function
function createEnhancedErrorMessage(error: any): string {
  let errorMessage = `Lightdash API error: ${error.error.name}`;
  
  if (error.error.message) {
    errorMessage += `, ${error.error.message}`;
  }
  
  // Include detailed validation errors from error.error.data
  if (error.error.data && typeof error.error.data === 'object') {
    const validationDetails = [];
    
    // Extract field-specific validation errors
    for (const [field, fieldError] of Object.entries(error.error.data)) {
      if (fieldError && typeof fieldError === 'object' && 'message' in fieldError) {
        validationDetails.push(`${field}: ${(fieldError as any).message}`);
      } else if (typeof fieldError === 'string') {
        validationDetails.push(`${field}: ${fieldError}`);
      }
    }
    
    if (validationDetails.length > 0) {
      errorMessage += `. Validation errors: ${validationDetails.join(', ')}`;
      
      // Add actionable suggestions for common errors
      if (validationDetails.some(detail => detail.includes('filters') && detail.includes('required'))) {
        errorMessage += '. Suggestion: Ensure filters object is provided, even if empty ({}).';
      }
      if (validationDetails.some(detail => detail.includes('dimensions') || detail.includes('metrics'))) {
        errorMessage += '. Suggestion: Check that field IDs exist in the explore schema.';
      }
      if (validationDetails.some(detail => detail.includes('exploreId') || detail.includes('explore'))) {
        errorMessage += '. Suggestion: Verify the explore/table name exists in the project.';
      }
    }
  }
  
  return errorMessage;
}

// Retry helper function
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on authentication errors or client errors (4xx)
      if (lastError.message.includes('401') || lastError.message.includes('403') ||
          lastError.message.includes('400') || lastError.message.includes('404')) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, lastError.message);
        throw lastError;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
  
  throw lastError!;
}

const lightdashClient = createLightdashClient(
  process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud',
  {
    headers: {
      Authorization: `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
    },
  }
);

export const server = new Server(
  {
    name: serverName,
    version: serverVersion,
    protocolVersion: '2025-06-18',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'lightdash_list_projects',
        description: 'List all projects in the Lightdash organization',
        inputSchema: zodToJsonSchema(ListProjectsRequestSchema),
      },
      {
        name: 'lightdash_get_project',
        description: 'Get details of a specific project',
        inputSchema: zodToJsonSchema(GetProjectRequestSchema),
      },
      {
        name: 'lightdash_list_spaces',
        description: 'List all spaces in a project',
        inputSchema: zodToJsonSchema(ListSpacesRequestSchema),
      },
      {
        name: 'lightdash_list_charts',
        description: 'List all charts in a project',
        inputSchema: zodToJsonSchema(ListChartsRequestSchema),
      },
      {
        name: 'lightdash_list_dashboards',
        description: 'List all dashboards in a project',
        inputSchema: zodToJsonSchema(ListDashboardsRequestSchema),
      },
      {
        name: 'lightdash_get_custom_metrics',
        description: 'Get custom metrics for a project',
        inputSchema: zodToJsonSchema(GetCustomMetricsRequestSchema),
      },
      {
        name: 'lightdash_get_catalog',
        description: 'Get catalog for a project',
        inputSchema: zodToJsonSchema(GetCatalogRequestSchema),
      },
      {
        name: 'lightdash_get_metrics_catalog',
        description: 'Get metrics catalog for a project',
        inputSchema: zodToJsonSchema(GetMetricsCatalogRequestSchema),
      },
      {
        name: 'lightdash_get_charts_as_code',
        description: 'Get charts as code for a project',
        inputSchema: zodToJsonSchema(GetChartsAsCodeRequestSchema),
      },
      {
        name: 'lightdash_get_dashboards_as_code',
        description: 'Get dashboards as code for a project',
        inputSchema: zodToJsonSchema(GetDashboardsAsCodeRequestSchema),
      },
      {
        name: 'lightdash_get_metadata',
        description: 'Get metadata for a specific table in the data catalog',
        inputSchema: zodToJsonSchema(GetMetadataRequestSchema),
      },
      {
        name: 'lightdash_get_analytics',
        description: 'Get analytics for a specific table in the data catalog',
        inputSchema: zodToJsonSchema(GetAnalyticsRequestSchema),
      },
      {
        name: 'lightdash_get_user_attributes',
        description: 'Get organization user attributes',
        inputSchema: zodToJsonSchema(GetUserAttributesRequestSchema),
      },
      {
        name: 'lightdash_run_underlying_data_query',
        description: 'Execute underlying data queries in Lightdash with support for dimensions, metrics, filters (including boolean values), sorts, and table calculations.\n\nFilter values support strings, numbers, and boolean values (true/false). The exploreId parameter should match the table/explore name you want to query.\n\nExample with boolean filter:\n{\n  "projectUuid": "your-project-uuid",\n  "exploreId": "table_name",\n  "dimensions": ["field1", "field2"],\n  "metrics": ["metric1"],\n  "filters": {\n    "dimensions": {\n      "id": "filter_group",\n      "and": [{\n        "id": "bool_filter",\n        "target": {"fieldId": "is_active"},\n        "operator": "equals",\n        "values": [true]\n      }]\n    }\n  },\n  "sorts": [{"fieldId": "field1", "descending": false}],\n  "limit": 100\n}\n\nOptional fields (metrics, sorts, tableCalculations, filters) can be omitted or set to empty arrays. The exploreName is automatically set to match exploreId for API compatibility.',
        inputSchema: zodToJsonSchema(RunUnderlyingDataQueryRequestSchema),
      },
      {
        name: 'lightdash_get_catalog_search',
        description: 'Search across all catalog items (explores, fields, dashboards, charts) with filtering and pagination',
        inputSchema: zodToJsonSchema(GetCatalogSearchRequestSchema),
      },
      {
        name: 'lightdash_get_explore_with_full_schema',
        description: 'Get complete explore schema with all metrics and dimensions - essential for building queries',
        inputSchema: zodToJsonSchema(GetExploreWithFullSchemaRequestSchema),
      },
      {
        name: 'lightdash_get_explores_summary',
        description: 'List all available explores with basic metadata - fast way to discover data models',
        inputSchema: zodToJsonSchema(GetExploresSummaryRequestSchema),
      },
      {
        name: 'lightdash_get_saved_chart_results',
        description: 'Get results from an existing saved chart with applied filters - leverage existing analyst work',
        inputSchema: zodToJsonSchema(GetSavedChartResultsRequestSchema),
      },
      {
        name: 'lightdash_get_dashboard_by_uuid',
        description: 'Get complete dashboard details including all tiles and configuration',
        inputSchema: zodToJsonSchema(GetDashboardByUuidRequestSchema),
      },
    ],
  };
});

// Resources handler - provides URI-based read-only access to data
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'lightdash://projects/{projectUuid}/catalog',
        name: 'Project Catalog',
        description: 'Searchable catalog of all items in project (explores, fields, dashboards, charts)',
        mimeType: 'application/json',
      },
      {
        uri: 'lightdash://projects/{projectUuid}/explores/{exploreId}/schema',
        name: 'Explore Schema',
        description: 'Complete explore schema with all metrics and dimensions',
        mimeType: 'application/json',
      },
      {
        uri: 'lightdash://dashboards/{dashboardUuid}',
        name: 'Dashboard Structure',
        description: 'Dashboard structure and tiles configuration',
        mimeType: 'application/json',
      },
      {
        uri: 'lightdash://charts/{chartUuid}',
        name: 'Chart Configuration',
        description: 'Saved chart configuration and metadata',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
  const uri = request.params.uri;
  
  try {
    // Parse the URI to determine the resource type and parameters
    if (!uri.startsWith('lightdash://')) {
      throw new McpError(ErrorCode.InvalidParams, 'Only lightdash:// URIs are supported');
    }
    
    // For custom protocols like lightdash://, everything after // is the path
    const uriWithoutProtocol = uri.replace('lightdash://', '');
    const [pathWithQuery, queryString] = uriWithoutProtocol.split('?');
    const pathParts = pathWithQuery.split('/').filter(part => part.length > 0);
    
    if (pathParts.length < 2) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid resource path: ${pathWithQuery}`);
    }
    
    // Parse query parameters
    const queryParams = new URLSearchParams(queryString || '');
    
    // Handle different resource types
    if (pathParts[0] === 'projects' && pathParts.length >= 3 && pathParts[2] === 'catalog') {
      // lightdash://projects/{projectUuid}/catalog
      const projectUuid = pathParts[1];
      
      const result = await withRetry(async () => {
        const { data, error } = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/dataCatalog',
          {
            params: {
              path: { projectUuid },
              query: Object.fromEntries(queryParams.entries()),
            },
          }
        );
        if (error) {
          throw new Error(`Lightdash API error: ${error.error.name}, ${error.error.message ?? 'no message'}`);
        }
        return data;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result.results, null, 2),
          },
        ],
      };
    }
    
    if (pathParts[0] === 'projects' && pathParts.length >= 5 && pathParts[2] === 'explores' && pathParts[4] === 'schema') {
      // lightdash://projects/{projectUuid}/explores/{exploreId}/schema
      const projectUuid = pathParts[1];
      const exploreId = pathParts[3];
      
      const result = await withRetry(async () => {
        const { data, error } = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/explores/{exploreId}',
          {
            params: {
              path: { projectUuid, exploreId },
            },
          }
        );
        if (error) {
          throw new Error(`Lightdash API error: ${error.error.name}, ${error.error.message ?? 'no message'}`);
        }
        return data;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result.results, null, 2),
          },
        ],
      };
    }
    
    if (pathParts[0] === 'dashboards' && pathParts.length >= 2) {
      // lightdash://dashboards/{dashboardUuid}
      const dashboardUuid = pathParts[1];
      
      const result = await withRetry(async () => {
        const response = await fetch(
          `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/dashboards/${dashboardUuid}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as any;
        
        if (data.status === 'error') {
          throw new Error(`Lightdash API error: ${data.error.name}, ${data.error.message ?? 'no message'}`);
        }
        
        return data;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify((result as any).results, null, 2),
          },
        ],
      };
    }
    
    if (pathParts[0] === 'charts' && pathParts.length >= 2) {
      // lightdash://charts/{chartUuid}
      const chartUuid = pathParts[1];
      
      const result = await withRetry(async () => {
        const response = await fetch(
          `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chartUuid}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as any;
        
        if (data.status === 'error') {
          throw new Error(`Lightdash API error: ${data.error.name}, ${data.error.message ?? 'no message'}`);
        }
        
        return data;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify((result as any).results, null, 2),
          },
        ],
      };
    }
    
    throw new McpError(ErrorCode.InvalidParams, `Unsupported resource path: ${pathWithQuery}`);
    
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${errorMessage}`);
  }
});

// Prompts handler - provides guided workflow templates
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'analyze-metric',
        description: 'Guided metric analysis workflow - analyze a specific metric with dimensions and filters',
        arguments: [
          {
            name: 'metric_name',
            description: 'Business term for the metric to analyze',
            required: true,
          },
          {
            name: 'explore_name',
            description: 'Which explore/table to use for analysis',
            required: true,
          },
          {
            name: 'dimensions',
            description: 'Breakdown dimensions (comma-separated)',
            required: false,
          },
          {
            name: 'filters',
            description: 'Filter conditions to apply',
            required: false,
          },
          {
            name: 'date_range',
            description: 'Time period for analysis (e.g., "last 30 days")',
            required: false,
          },
          {
            name: 'sort_field',
            description: 'Field to sort results by',
            required: false,
          },
          {
            name: 'sort_direction',
            description: 'Sort direction: "asc" or "desc"',
            required: false,
          },
        ],
      },
      {
        name: 'find-and-explore',
        description: 'Discover and analyze data workflow - find relevant data and suggest analysis approach',
        arguments: [
          {
            name: 'business_question',
            description: 'The business question you want to answer',
            required: true,
          },
          {
            name: 'search_terms',
            description: 'Specific keywords to search for in the catalog',
            required: false,
          },
        ],
      },
      {
        name: 'dashboard-deep-dive',
        description: 'Comprehensive dashboard analysis workflow - analyze all tiles in a dashboard',
        arguments: [
          {
            name: 'dashboard_name',
            description: 'Dashboard name or UUID to analyze',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'analyze-metric': {
        const metric_name = args?.metric_name || '{metric_name}';
        const explore_name = args?.explore_name || '{explore_name}';
        const dimensions = args?.dimensions || '{dimensions}';
        const filters = args?.filters || '{filters}';
        const date_range = args?.date_range || '{date_range}';
        const sort_field = args?.sort_field || '{sort_field}';
        const sort_direction = args?.sort_direction || '{sort_direction}';
        
        return {
          description: `Analyze the metric "${metric_name}" from the "${explore_name}" explore`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze the metric "${metric_name}" from the "${explore_name}" explore.

1. First, search for the metric in the catalog to get its exact field ID
2. Search for relevant dimensions to break down the analysis
3. Build and execute a query with:
   - Metric: ${metric_name}
   - Dimensions: ${dimensions}
   - Filters: ${filters}
   - Date range: ${date_range}
   - Sort by: ${sort_field} ${sort_direction}
4. Interpret the results and provide insights`,
              },
            },
          ],
        };
      }
      
      case 'find-and-explore': {
        const business_question = args?.business_question || '{business_question}';
        const search_terms = args?.search_terms || '{search_terms}';
        
        return {
          description: `Discover and analyze data to answer: "${business_question}"`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I want to analyze "${business_question}".

1. Search the catalog for relevant fields related to: ${search_terms}
2. Identify the best explore (table) to use
3. Find relevant metrics and dimensions
4. Suggest a query structure to answer the question
5. Execute the query if confirmed`,
              },
            },
          ],
        };
      }
      
      case 'dashboard-deep-dive': {
        const dashboard_name = args?.dashboard_name || '{dashboard_name}';
        
        return {
          description: `Comprehensive analysis of dashboard: ${dashboard_name}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze the dashboard: ${dashboard_name}

1. Find the dashboard in the catalog
2. Get the full dashboard structure
3. For each tile:
   - Get the tile results
   - Summarize key findings
4. Provide an executive summary of all insights`,
              },
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.InvalidParams, `Unknown prompt: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(ErrorCode.InternalError, `Failed to get prompt: ${errorMessage}`);
  }
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    try {
      if (!request.params) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Request parameters are required'
        );
      }

      if (!request.params.name) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Tool name is required in request parameters'
        );
      }

      switch (request.params.name) {
        case 'lightdash_list_projects': {
          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.GET(
              '/api/v1/org/projects',
              {}
            );
            if (error) {
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
            }
            return data;
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_project': {
          const args = GetProjectRequestSchema.parse(request.params.arguments);
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_list_spaces': {
          const args = ListSpacesRequestSchema.parse(request.params.arguments);
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/spaces',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_list_charts': {
          const args = ListChartsRequestSchema.parse(request.params.arguments);
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/charts',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_list_dashboards': {
          const args = ListDashboardsRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dashboards',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_custom_metrics': {
          const args = GetCustomMetricsRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/custom-metrics',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_catalog': {
          const args = GetCatalogRequestSchema.parse(request.params.arguments);
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dataCatalog',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_metrics_catalog': {
          const args = GetMetricsCatalogRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dataCatalog/metrics',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_charts_as_code': {
          const args = GetChartsAsCodeRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/charts/code',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_dashboards_as_code': {
          const args = GetDashboardsAsCodeRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dashboards/code',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_metadata': {
          const args = GetMetadataRequestSchema.parse(request.params.arguments);
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dataCatalog/{table}/metadata',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                  table: args.table,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_analytics': {
          const args = GetAnalyticsRequestSchema.parse(
            request.params.arguments
          );
          const { data, error } = await lightdashClient.GET(
            '/api/v1/projects/{projectUuid}/dataCatalog/{table}/analytics',
            {
              params: {
                path: {
                  projectUuid: args.projectUuid,
                  table: args.table,
                },
              },
            }
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_user_attributes': {
          const { data, error } = await lightdashClient.GET(
            '/api/v1/org/attributes',
            {}
          );
          if (error) {
            throw new Error(
              `Lightdash API error: ${error.error.name}, ${
                error.error.message ?? 'no message'
              }`
            );
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_run_underlying_data_query': {
          const args = RunUnderlyingDataQueryRequestSchema.parse(request.params.arguments);
          
          // Field name transformation function
          const transformFieldName = (fieldName: string, exploreId: string): string => {
            // If field already has the explore prefix, return as-is
            if (fieldName.startsWith(exploreId + '_')) {
              console.log(`🔍 Field already prefixed: ${fieldName}`);
              return fieldName;
            }
            
            // Add explore prefix to create fully qualified field name
            const transformedName = `${exploreId}_${fieldName}`;
            console.log(`🔄 Field transformation: ${fieldName} → ${transformedName}`);
            return transformedName;
          };

          // Transform field arrays
          const transformFieldArray = (fields: string[] | undefined, exploreId: string, fieldType: string): string[] => {
            if (!fields || fields.length === 0) {
              console.log(`📝 No ${fieldType} fields to transform`);
              return [];
            }
            
            console.log(`🔄 Transforming ${fields.length} ${fieldType} field(s):`);
            const transformed = fields.map(field => transformFieldName(field, exploreId));
            console.log(`   Original: [${fields.join(', ')}]`);
            console.log(`   Transformed: [${transformed.join(', ')}]`);
            return transformed;
          };

          // Transform filter field references
          const transformFilters = (filters: any, exploreId: string): any => {
            if (!filters || typeof filters !== 'object') {
              return {};
            }

            const transformedFilters = { ...filters };

            // Transform dimension filters
            if (filters.dimensions && typeof filters.dimensions === 'object') {
              transformedFilters.dimensions = { ...filters.dimensions };
              
              if (filters.dimensions.and && Array.isArray(filters.dimensions.and)) {
                transformedFilters.dimensions.and = filters.dimensions.and.map((filter: any) => ({
                  ...filter,
                  target: {
                    ...filter.target,
                    fieldId: transformFieldName(filter.target.fieldId, exploreId)
                  }
                }));
              }
              
              if (filters.dimensions.or && Array.isArray(filters.dimensions.or)) {
                transformedFilters.dimensions.or = filters.dimensions.or.map((filter: any) => ({
                  ...filter,
                  target: {
                    ...filter.target,
                    fieldId: transformFieldName(filter.target.fieldId, exploreId)
                  }
                }));
              }
            }

            // Transform metric filters
            if (filters.metrics && typeof filters.metrics === 'object') {
              transformedFilters.metrics = { ...filters.metrics };
              
              if (filters.metrics.and && Array.isArray(filters.metrics.and)) {
                transformedFilters.metrics.and = filters.metrics.and.map((filter: any) => ({
                  ...filter,
                  target: {
                    ...filter.target,
                    fieldId: transformFieldName(filter.target.fieldId, exploreId)
                  }
                }));
              }
              
              if (filters.metrics.or && Array.isArray(filters.metrics.or)) {
                transformedFilters.metrics.or = filters.metrics.or.map((filter: any) => ({
                  ...filter,
                  target: {
                    ...filter.target,
                    fieldId: transformFieldName(filter.target.fieldId, exploreId)
                  }
                }));
              }
            }

            return transformedFilters;
          };

          // Transform sort field references
          const transformSorts = (sorts: any[] | undefined, exploreId: string): any[] => {
            if (!sorts || sorts.length === 0) {
              console.log('📝 No sort fields to transform');
              return [];
            }

            console.log(`🔄 Transforming ${sorts.length} sort field(s):`);
            const transformed = sorts.map(sort => ({
              ...sort,
              fieldId: transformFieldName(sort.fieldId, exploreId)
            }));
            
            sorts.forEach((sort, index) => {
              console.log(`   Sort ${index + 1}: ${sort.fieldId} → ${transformed[index].fieldId}`);
            });
            
            return transformed;
          };

          // Apply field transformations
          console.log('🚀 Starting field name transformations...');
          const transformedDimensions = transformFieldArray(args.dimensions, args.exploreId, 'dimension');
          const transformedMetrics = transformFieldArray(args.metrics, args.exploreId, 'metric');
          const transformedFilters = transformFilters(args.filters, args.exploreId);
          const transformedSorts = transformSorts(args.sorts, args.exploreId);

          // Build the query body with transformed field names
          const queryBody: any = {
            // Use transformed field arrays
            dimensions: transformedDimensions,
            metrics: transformedMetrics,
            sorts: transformedSorts,
            tableCalculations: args.tableCalculations || [],
            // exploreName is required and should match exploreId
            exploreName: args.exploreId,
            // Use transformed filters
            filters: transformedFilters,
          };
          
          if (args.limit) {
            queryBody.limit = args.limit;
          }

          // DEBUG: Log the exact request being sent to Lightdash API
          console.log('🔍 DEBUG: Sending request to Lightdash API:');
          console.log('  URL: /api/v1/projects/{projectUuid}/explores/{exploreId}/runUnderlyingDataQuery');
          console.log('  Project UUID:', args.projectUuid);
          console.log('  Explore ID:', args.exploreId);
          console.log('  Query Body (with transformed fields):', JSON.stringify(queryBody, null, 2));

          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.POST(
              '/api/v1/projects/{projectUuid}/explores/{exploreId}/runUnderlyingDataQuery',
              {
                params: {
                  path: {
                    projectUuid: args.projectUuid,
                    exploreId: args.exploreId,
                  },
                },
                body: queryBody,
              }
            );
            if (error) {
              // DEBUG: Log the exact error from Lightdash API
              console.log('🔍 DEBUG: Lightdash API error details:');
              console.log('  Error object:', JSON.stringify(error, null, 2));
              console.log('  Error name:', error.error?.name);
              console.log('  Error message:', error.error?.message);
              console.log('  Error data:', error.error?.data);
              
              throw new Error(createEnhancedErrorMessage(error));
            }
            return data;
          });

          // Parse the nested response format according to the roadmap
          // Response format: rows[].fieldId.value.raw
          const parsedResult = {
            ...result.results,
            rows: result.results.rows?.map((row: any) => {
              const parsedRow: any = {};
              for (const [fieldId, fieldData] of Object.entries(row)) {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const valueData = (fieldData as any).value;
                  parsedRow[fieldId] = {
                    raw: valueData?.raw,
                    formatted: valueData?.formatted,
                  };
                } else {
                  // Fallback for unexpected format
                  parsedRow[fieldId] = fieldData;
                }
              }
              return parsedRow;
            }) || [],
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(parsedResult, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_catalog_search': {
          const args = GetCatalogSearchRequestSchema.parse(request.params.arguments);
          
          // Build query parameters for catalog search
          const queryParams = new URLSearchParams();
          
          if (args.search) {
            queryParams.append('search', args.search);
          }
          
          if (args.type) {
            queryParams.append('type', args.type);
          }
          
          if (args.limit) {
            queryParams.append('limit', args.limit.toString());
          }
          
          if (args.page) {
            queryParams.append('page', args.page.toString());
          }

          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.GET(
              '/api/v1/projects/{projectUuid}/dataCatalog',
              {
                params: {
                  path: {
                    projectUuid: args.projectUuid,
                  },
                  query: Object.fromEntries(queryParams.entries()),
                },
              }
            );
            if (error) {
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
            }
            return data;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_explore_with_full_schema': {
          const args = GetExploreWithFullSchemaRequestSchema.parse(request.params.arguments);

          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.GET(
              '/api/v1/projects/{projectUuid}/explores/{exploreId}',
              {
                params: {
                  path: {
                    projectUuid: args.projectUuid,
                    exploreId: args.exploreId,
                  },
                },
              }
            );
            if (error) {
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
            }
            return data;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_explores_summary': {
          const args = GetExploresSummaryRequestSchema.parse(request.params.arguments);

          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.GET(
              '/api/v1/projects/{projectUuid}/explores',
              {
                params: {
                  path: {
                    projectUuid: args.projectUuid,
                  },
                },
              }
            );
            if (error) {
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
            }
            return data;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.results, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_saved_chart_results': {
          const args = GetSavedChartResultsRequestSchema.parse(request.params.arguments);
          
          // Build the request body with optional parameters
          const requestBody: any = {};
          
          if (args.invalidateCache !== undefined) {
            requestBody.invalidateCache = args.invalidateCache;
          }
          
          if (args.dashboardFilters) {
            requestBody.dashboardFilters = args.dashboardFilters;
          }
          
          if (args.dateZoomGranularity) {
            requestBody.dateZoomGranularity = args.dateZoomGranularity;
          }

          const result = await withRetry(async () => {
            const { data, error } = await lightdashClient.POST(
              '/api/v1/saved/{chartUuid}/results',
              {
                params: {
                  path: {
                    chartUuid: args.chartUuid,
                  },
                },
                body: Object.keys(requestBody).length > 0 ? requestBody : undefined,
              }
            );
            if (error) {
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
            }
            return data;
          });

          // Parse the nested response format according to the roadmap
          // Response format: rows[].fieldId.value.raw (same as run_underlying_data_query)
          const parsedResult = {
            ...result.results,
            rows: result.results.rows?.map((row: any) => {
              const parsedRow: any = {};
              for (const [fieldId, fieldData] of Object.entries(row)) {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const valueData = (fieldData as any).value;
                  parsedRow[fieldId] = {
                    raw: valueData?.raw,
                    formatted: valueData?.formatted,
                  };
                } else {
                  // Fallback for unexpected format
                  parsedRow[fieldId] = fieldData;
                }
              }
              return parsedRow;
            }) || [],
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(parsedResult, null, 2),
              },
            ],
          };
        }
        case 'lightdash_get_dashboard_by_uuid': {
          const args = GetDashboardByUuidRequestSchema.parse(request.params.arguments);

          const result = await withRetry(async () => {
            // Use fetch directly since this endpoint might not be in the typed client
            const response = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/dashboards/${args.dashboardUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            if (data.status === 'error') {
              throw new Error(`Lightdash API error: ${data.error.name}, ${data.error.message ?? 'no message'}`);
            }
            
            return data;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify((result as any).results, null, 2),
              },
            ],
          };
        }
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    } catch (error) {
      // Log the error for debugging
      console.error('Error handling tool request:', {
        tool: request.params?.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Re-throw MCP errors as-is
      if (error instanceof McpError) {
        throw error;
      }

      // Handle Lightdash API errors
      if (
        error instanceof Error &&
        error.message.includes('Lightdash API error')
      ) {
        throw new McpError(
          ErrorCode.InternalError,
          `Lightdash API error: ${error.message}`
        );
      }

      // Handle validation errors (from Zod schema parsing)
      if (error instanceof Error && error.message.includes('validation')) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.message}`
        );
      }

      // Handle any other errors as internal errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new McpError(
        ErrorCode.InternalError,
        `Internal server error: ${errorMessage}`
      );
    }
  }
);
