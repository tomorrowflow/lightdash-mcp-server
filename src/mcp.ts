import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolRequest,
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
      tools: {}, // Only tools capability - no resources or prompts
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
        description: 'Execute queries against explores and return actual data results - enables data analysis',
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
          
          // Build the query body
          const queryBody: any = {};
          
          if (args.dimensions && args.dimensions.length > 0) {
            queryBody.dimensions = args.dimensions;
          }
          
          if (args.metrics && args.metrics.length > 0) {
            queryBody.metrics = args.metrics;
          }
          
          if (args.filters) {
            queryBody.filters = args.filters;
          }
          
          if (args.sorts && args.sorts.length > 0) {
            queryBody.sorts = args.sorts;
          }
          
          if (args.limit) {
            queryBody.limit = args.limit;
          }
          
          if (args.tableCalculations && args.tableCalculations.length > 0) {
            queryBody.tableCalculations = args.tableCalculations;
          }

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
              throw new Error(
                `Lightdash API error: ${error.error.name}, ${
                  error.error.message ?? 'no message'
                }`
              );
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
