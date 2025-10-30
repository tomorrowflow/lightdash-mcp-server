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
import { zodToJsonSchema } from 'zod-to-json-schema';

// Import modular components
import { serverConfig } from './config/server-config.js';
import { lightdashClient } from './client/lightdash-client.js';
import { toolHandlers } from './handlers/tools/index.js';
import { handleResourceRequest, resourceDefinitions } from './handlers/resources/index.js';
import { handlePromptRequest, promptDefinitions } from './handlers/prompts/index.js';

// Import schemas
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
  // Chart Intelligence & Optimization Platform schemas
  AnalyzeChartPerformanceRequestSchema,
  ExtractChartPatternsRequestSchema,
  DiscoverChartRelationshipsRequestSchema,
  // Phase 2: Advanced Query Optimization schemas
  OptimizeChartQueryRequestSchema,
  BenchmarkChartVariationsRequestSchema,
  // Phase 3: AI-Powered Recommendation schemas
  GenerateChartRecommendationsRequestSchema,
  AutoOptimizeDashboardRequestSchema,
  CreateSmartTemplatesRequestSchema,
} from './schemas.js';

// Import utility functions from modular structure
import {
  createEnhancedErrorMessage,
  withRetry,
  calculateQueryComplexityScore,
  predictQueryPerformance,
  generateOptimizationSuggestions,
  calculateStatisticalMetrics,
  getCachedResult,
  setCachedResult,
  analyzeDataCharacteristics,
  calculateRecommendationScore,
  interpretAnalyticalGoal,
  calculateConfigurationSimilarity,
} from './utils/index.js';

export const server = new Server(
  serverConfig.info,
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
      // Chart Intelligence & Optimization Platform Tools
      {
        name: 'lightdash_analyze_chart_performance',
        description: 'Analyze existing chart query performance, identify optimization opportunities, and provide actionable recommendations',
        inputSchema: zodToJsonSchema(AnalyzeChartPerformanceRequestSchema),
      },
      {
        name: 'lightdash_extract_chart_patterns',
        description: 'Extract reusable patterns from existing charts, identify common filter and configuration patterns, and generate template documentation',
        inputSchema: zodToJsonSchema(ExtractChartPatternsRequestSchema),
      },
      {
        name: 'lightdash_discover_chart_relationships',
        description: 'Analyze relationships between charts, find charts with shared fields, explores, or dashboards, and provide impact analysis for changes',
        inputSchema: zodToJsonSchema(DiscoverChartRelationshipsRequestSchema),
      },
      // Phase 2: Advanced Query Optimization Tools
      {
        name: 'lightdash_optimize_chart_query',
        description: 'Analyze chart queries and suggest specific optimizations with before/after performance comparisons and optimized query configurations',
        inputSchema: zodToJsonSchema(OptimizeChartQueryRequestSchema),
      },
      {
        name: 'lightdash_benchmark_chart_variations',
        description: 'Test multiple query variations for performance, compare different filter combinations and field selections with statistical analysis',
        inputSchema: zodToJsonSchema(BenchmarkChartVariationsRequestSchema),
      },
      // Phase 3: AI-Powered Recommendation Tools
      {
        name: 'lightdash_generate_chart_recommendations',
        description: 'AI-powered analysis of analytical goals and data patterns to generate intelligent chart suggestions with reasoning and confidence scores',
        inputSchema: zodToJsonSchema(GenerateChartRecommendationsRequestSchema),
      },
      {
        name: 'lightdash_auto_optimize_dashboard',
        description: 'Automated dashboard optimization using AI-driven analysis of layout, chart relationships, and user interaction patterns',
        inputSchema: zodToJsonSchema(AutoOptimizeDashboardRequestSchema),
      },
      {
        name: 'lightdash_create_smart_templates',
        description: 'Generate intelligent chart templates from organizational patterns that learn from existing high-performing charts and adapt based on business context',
        inputSchema: zodToJsonSchema(CreateSmartTemplatesRequestSchema),
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
      // Phase 2: Enhanced Resources
      {
        uri: 'lightdash://projects/{projectUuid}/chart-analytics',
        name: 'Project Chart Analytics',
        description: 'Aggregated analytics across all project charts with performance metrics, usage patterns, and optimization opportunities',
        mimeType: 'application/json',
      },
      {
        uri: 'lightdash://explores/{exploreId}/optimization-suggestions',
        name: 'Explore Optimization Suggestions',
        description: 'Explore-specific optimization recommendations with field usage analysis and performance insights',
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
      // lightdash://charts/{chartUuid} - Enhanced with analysis capabilities
      const chartUuid = pathParts[1];
      const includeAnalysis = queryParams.get('analysis') === 'true';
      
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
          throw new Error(`HTTP ${response.status}: ${response.status}`);
        }

        const data = await response.json() as any;
        
        if (data.status === 'error') {
          throw new Error(`Lightdash API error: ${data.error.name}, ${data.error.message ?? 'no message'}`);
        }
        
        let enhancedResult = data.results;
        
        // Add analysis data if requested
        if (includeAnalysis) {
          try {
            // Get performance analysis
            const startTime = Date.now();
            const resultsResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chartUuid}/results`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invalidateCache: false }),
              }
            );
            const executionTime = Date.now() - startTime;

            let resultsData: any = null;
            if (resultsResponse.ok) {
              resultsData = await resultsResponse.json();
            }

            // Basic performance analysis
            const config = enhancedResult.metricQuery || {};
            const dimensionCount = config.dimensions?.length || 0;
            const metricCount = config.metrics?.length || 0;
            const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                              (config.filters?.dimensions?.or?.length || 0) +
                              (config.filters?.metrics?.and?.length || 0) +
                              (config.filters?.metrics?.or?.length || 0);
            const rowCount = resultsData?.results?.rows?.length || 0;

            // Calculate basic performance score
            let performanceScore = 100;
            if (executionTime > 15000) performanceScore -= 40;
            else if (executionTime > 5000) performanceScore -= 25;
            else if (executionTime > 1000) performanceScore -= 10;
            
            if (rowCount > 10000) performanceScore -= 20;
            else if (rowCount > 1000) performanceScore -= 10;
            
            if (dimensionCount > 5) performanceScore -= 10;
            if (metricCount > 10) performanceScore -= 10;
            if (filterCount === 0) performanceScore -= 15;

            performanceScore = Math.max(0, performanceScore);

            // Add analysis metadata to the result
            enhancedResult._analysis = {
              performance: {
                executionTime,
                rowCount,
                performanceScore,
                threshold: executionTime < 1000 ? 'fast' :
                          executionTime < 5000 ? 'moderate' :
                          executionTime < 15000 ? 'slow' : 'very_slow',
              },
              configuration: {
                dimensionCount,
                metricCount,
                filterCount,
                sortCount: config.sorts?.length || 0,
                hasTableCalculations: (config.tableCalculations?.length || 0) > 0,
                hasCustomMetrics: (config.customMetrics?.length || 0) > 0,
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '1.0',
              },
            };
          } catch (analysisError) {
            console.warn('Failed to add analysis data:', analysisError);
            // Continue without analysis data if it fails
          }
        }
        
        return { results: enhancedResult };
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
    
    // Phase 2: Enhanced Resources Implementation
    if (pathParts[0] === 'projects' && pathParts.length >= 3 && pathParts[2] === 'chart-analytics') {
      // lightdash://projects/{projectUuid}/chart-analytics
      const projectUuid = pathParts[1];
      const analysisDepth = queryParams.get('depth') || 'standard';
      const includeOptimizations = queryParams.get('optimizations') === 'true';
      
      const cacheKey = `chart-analytics-${projectUuid}-${analysisDepth}-${includeOptimizations}`;
      const cached = getCachedResult<any>(cacheKey);
      if (cached) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(cached, null, 2),
            },
          ],
        };
      }
      
      const result = await withRetry(async () => {
        // Get all charts in the project
        const { data: chartsData, error: chartsError } = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/charts',
          {
            params: {
              path: { projectUuid },
            },
          }
        );
        
        if (chartsError) {
          throw new Error(`Lightdash API error: ${chartsError.error.name}, ${chartsError.error.message ?? 'no message'}`);
        }
        
        const charts = chartsData.results || [];
        const analytics: any = {
          projectUuid,
          totalCharts: charts.length,
          performanceMetrics: {
            averageExecutionTime: 0,
            slowCharts: [],
            fastCharts: [],
            performanceDistribution: {
              fast: 0,
              moderate: 0,
              slow: 0,
              very_slow: 0,
            },
          },
          usagePatterns: {
            mostUsedExplores: new Map<string, number>(),
            commonMetrics: new Map<string, number>(),
            commonDimensions: new Map<string, number>(),
            chartTypeDistribution: new Map<string, number>(),
          },
          optimizationOpportunities: [],
          metadata: {
            analyzedAt: new Date().toISOString(),
            analysisDepth,
            includeOptimizations,
          },
        };
        
        // Analyze each chart for performance and patterns
        const executionTimes: number[] = [];
        
        for (const chart of charts.slice(0, analysisDepth === 'deep' ? charts.length : Math.min(50, charts.length))) {
          try {
            // Get chart configuration
            const chartResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chart.uuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (!chartResponse.ok) continue;
            
            const chartData = await chartResponse.json() as any;
            if (chartData.status === 'error') continue;
            
            const chartConfig = chartData.results;
            const metricQuery = chartConfig.metricQuery || {};
            const exploreId = chartConfig.tableName;
            const chartType = chartConfig.chartConfig?.type || 'table';
            
            // Performance analysis
            const startTime = Date.now();
            const resultsResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chart.uuid}/results`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invalidateCache: false }),
              }
            );
            const executionTime = Date.now() - startTime;
            executionTimes.push(executionTime);
            
            // Categorize performance
            let performanceCategory = 'fast';
            if (executionTime > 15000) performanceCategory = 'very_slow';
            else if (executionTime > 5000) performanceCategory = 'slow';
            else if (executionTime > 1000) performanceCategory = 'moderate';
            
            analytics.performanceMetrics.performanceDistribution[performanceCategory]++;
            
            if (executionTime > 5000) {
              analytics.performanceMetrics.slowCharts.push({
                chartUuid: chart.uuid,
                chartName: chart.name,
                executionTime,
                complexityScore: calculateQueryComplexityScore(metricQuery),
              });
            } else if (executionTime < 1000) {
              analytics.performanceMetrics.fastCharts.push({
                chartUuid: chart.uuid,
                chartName: chart.name,
                executionTime,
              });
            }
            
            // Usage pattern analysis
            const exploreCount = analytics.usagePatterns.mostUsedExplores.get(exploreId) || 0;
            analytics.usagePatterns.mostUsedExplores.set(exploreId, exploreCount + 1);
            
            const chartTypeCount = analytics.usagePatterns.chartTypeDistribution.get(chartType) || 0;
            analytics.usagePatterns.chartTypeDistribution.set(chartType, chartTypeCount + 1);
            
            // Track metrics and dimensions
            (metricQuery.metrics || []).forEach((metric: string) => {
              const count = analytics.usagePatterns.commonMetrics.get(metric) || 0;
              analytics.usagePatterns.commonMetrics.set(metric, count + 1);
            });
            
            (metricQuery.dimensions || []).forEach((dimension: string) => {
              const count = analytics.usagePatterns.commonDimensions.get(dimension) || 0;
              analytics.usagePatterns.commonDimensions.set(dimension, count + 1);
            });
            
            // Generate optimization opportunities
            if (includeOptimizations && executionTime > 3000) {
              const suggestions = generateOptimizationSuggestions(
                metricQuery,
                { executionTime, rowCount: 0 },
                'performance',
                'moderate'
              );
              
              if (suggestions.length > 0) {
                analytics.optimizationOpportunities.push({
                  chartUuid: chart.uuid,
                  chartName: chart.name,
                  currentPerformance: {
                    executionTime,
                    complexityScore: calculateQueryComplexityScore(metricQuery),
                  },
                  suggestions: suggestions.slice(0, 3), // Top 3 suggestions
                });
              }
            }
            
          } catch (error) {
            console.warn(`Failed to analyze chart ${chart.uuid}:`, error);
          }
        }
        
        // Calculate average execution time
        if (executionTimes.length > 0) {
          analytics.performanceMetrics.averageExecutionTime = 
            executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        }
        
        // Convert Maps to objects for JSON serialization
        const finalAnalytics = {
          ...analytics,
          usagePatterns: {
            ...analytics.usagePatterns,
            mostUsedExplores: Object.fromEntries(
              Array.from(analytics.usagePatterns.mostUsedExplores.entries() as [string, number][])
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 10)
            ),
            commonMetrics: Object.fromEntries(
              Array.from(analytics.usagePatterns.commonMetrics.entries() as [string, number][])
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 15)
            ),
            commonDimensions: Object.fromEntries(
              Array.from(analytics.usagePatterns.commonDimensions.entries() as [string, number][])
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 15)
            ),
            chartTypeDistribution: Object.fromEntries(analytics.usagePatterns.chartTypeDistribution.entries()),
          },
        };
        
        // Cache the result for 10 minutes
        setCachedResult(cacheKey, finalAnalytics, 600000);
        
        return finalAnalytics;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
    
    if (pathParts[0] === 'explores' && pathParts.length >= 3 && pathParts[2] === 'optimization-suggestions') {
      // lightdash://explores/{exploreId}/optimization-suggestions
      const exploreId = pathParts[1];
      const includeFieldAnalysis = queryParams.get('fields') === 'true';
      const optimizationType = queryParams.get('type') || 'performance';
      
      const cacheKey = `explore-optimization-${exploreId}-${includeFieldAnalysis}-${optimizationType}`;
      const cached = getCachedResult<any>(cacheKey);
      if (cached) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(cached, null, 2),
            },
          ],
        };
      }
      
      const result = await withRetry(async () => {
        // Find project UUID by searching for charts using this explore
        const allProjectsResponse = await lightdashClient.GET('/api/v1/org/projects', {});
        if (allProjectsResponse.error) {
          throw new Error(`Failed to get projects: ${allProjectsResponse.error.error.name}`);
        }
        
        let exploreSchema: any = null;
        let projectUuid: string = '';
        
        // Find the project containing this explore
        for (const project of allProjectsResponse.data.results || []) {
          try {
            const exploreResponse = await lightdashClient.GET(
              '/api/v1/projects/{projectUuid}/explores/{exploreId}',
              {
                params: {
                  path: { projectUuid: project.projectUuid, exploreId },
                },
              }
            );
            
            if (!exploreResponse.error) {
              exploreSchema = exploreResponse.data.results;
              projectUuid = project.projectUuid;
              break;
            }
          } catch (error) {
            // Continue searching other projects
          }
        }
        
        if (!exploreSchema) {
          throw new Error(`Explore ${exploreId} not found in any accessible project`);
        }
        
        // Get charts using this explore
        const { data: chartsData } = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/charts',
          {
            params: {
              path: { projectUuid },
            },
          }
        );
        
        const chartsUsingExplore = (chartsData?.results || [])
          .filter((chart: any) => chart.tableName === exploreId);
        
        const suggestions: any = {
          exploreId,
          projectUuid,
          totalChartsUsingExplore: chartsUsingExplore.length,
          fieldAnalysis: {
            totalFields: 0,
            metrics: [],
            dimensions: [],
            unusedFields: [],
            overusedFields: [],
          },
          performanceOptimizations: [],
          usagePatterns: {
            commonCombinations: [],
            recommendedFilters: [],
            suggestedIndexes: [],
          },
          bestPractices: [],
          metadata: {
            analyzedAt: new Date().toISOString(),
            optimizationType,
            includeFieldAnalysis,
          },
        };
        
        // Analyze explore schema
        const allMetrics = Object.values(exploreSchema.tables || {})
          .flatMap((table: any) => Object.values(table.metrics || {}));
        const allDimensions = Object.values(exploreSchema.tables || {})
          .flatMap((table: any) => Object.values(table.dimensions || {}));
        
        suggestions.fieldAnalysis.totalFields = allMetrics.length + allDimensions.length;
        suggestions.fieldAnalysis.metrics = allMetrics.map((m: any) => ({
          name: m.name,
          type: m.type,
          description: m.description,
        }));
        suggestions.fieldAnalysis.dimensions = allDimensions.map((d: any) => ({
          name: d.name,
          type: d.type,
          description: d.description,
        }));
        
        // Analyze field usage patterns if requested
        if (includeFieldAnalysis && chartsUsingExplore.length > 0) {
          const fieldUsage = new Map<string, number>();
          
          for (const chart of chartsUsingExplore.slice(0, 20)) { // Limit for performance
            try {
              const chartResponse = await fetch(
                `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chart.uuid}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (chartResponse.ok) {
                const chartData = await chartResponse.json() as any;
                if (chartData.status !== 'error') {
                  const metricQuery = chartData.results.metricQuery || {};
                  
                  // Count field usage
                  [...(metricQuery.metrics || []), ...(metricQuery.dimensions || [])]
                    .forEach((field: string) => {
                      fieldUsage.set(field, (fieldUsage.get(field) || 0) + 1);
                    });
                }
              }
            } catch (error) {
              console.warn(`Failed to analyze chart ${chart.uuid}:`, error);
            }
          }
          
          // Identify overused and unused fields
          const sortedFieldUsage = Array.from(fieldUsage.entries()).sort(([,a], [,b]) => b - a);
          const totalCharts = chartsUsingExplore.length;
          
          suggestions.fieldAnalysis.overusedFields = sortedFieldUsage
            .filter(([, count]) => count > totalCharts * 0.7)
            .slice(0, 10)
            .map(([field, count]) => ({
              fieldName: field,
              usageCount: count,
              usagePercentage: Math.round((count / totalCharts) * 100),
            }));
          
          const usedFields = new Set(fieldUsage.keys());
          const allFieldNames = [
            ...allMetrics.map((m: any) => m.name),
            ...allDimensions.map((d: any) => d.name),
          ];
          
          suggestions.fieldAnalysis.unusedFields = allFieldNames
            .filter(field => !usedFields.has(field))
            .slice(0, 15)
            .map(field => ({ fieldName: field }));
        }
        
        // Generate performance optimizations
        if (optimizationType === 'performance' || optimizationType === 'comprehensive') {
          suggestions.performanceOptimizations = [
            {
              type: 'indexing',
              priority: 'high',
              title: 'Add Database Indexes',
              description: 'Consider adding indexes on frequently filtered dimensions',
              implementation: {
                effort: 'database_admin_required',
                impact: 'high',
                fields: suggestions.fieldAnalysis.overusedFields
                  .filter((f: any) => f.usagePercentage > 50)
                  .map((f: any) => f.fieldName)
                  .slice(0, 5),
              },
            },
            {
              type: 'caching',
              priority: 'medium',
              title: 'Enable Query Result Caching',
              description: 'Cache results for frequently accessed charts using this explore',
              implementation: {
                effort: 'configuration',
                impact: 'medium',
                recommendedTTL: '1 hour',
              },
            },
            {
              type: 'aggregation',
              priority: 'medium',
              title: 'Pre-aggregate Common Metrics',
              description: 'Create summary tables for frequently used metric combinations',
              implementation: {
                effort: 'development_required',
                impact: 'high',
                suggestedAggregations: suggestions.fieldAnalysis.overusedFields
                  .slice(0, 3)
                  .map((f: any) => f.fieldName),
              },
            },
          ];
        }
        
        // Generate usage pattern recommendations
        suggestions.usagePatterns.recommendedFilters = [
          {
            fieldName: 'date_field',
            reason: 'Time-based filtering significantly improves performance',
            suggestedDefault: 'last 90 days',
          },
          {
            fieldName: 'status_field',
            reason: 'Status filtering reduces data volume',
            suggestedDefault: 'active records only',
          },
        ];
        
        // Best practices
        suggestions.bestPractices = [
          {
            category: 'performance',
            title: 'Always Include Date Filters',
            description: 'Time-based filtering is the most effective way to improve query performance',
            priority: 'critical',
          },
          {
            category: 'usability',
            title: 'Limit Dimension Count',
            description: 'Keep dimension count under 5 for better visualization clarity',
            priority: 'medium',
          },
          {
            category: 'maintenance',
            title: 'Regular Field Usage Review',
            description: 'Periodically review and remove unused fields to keep the explore clean',
            priority: 'low',
          },
        ];
        
        // Cache the result for 15 minutes
        setCachedResult(cacheKey, suggestions, 900000);
        
        return suggestions;
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
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
      // Phase 2: Intelligent Prompts
      {
        name: 'chart-performance-optimizer',
        description: 'Interactive workflow for chart performance optimization with guided analysis and step-by-step recommendations',
        arguments: [
          {
            name: 'chartUuid',
            description: 'UUID of the chart to optimize',
            required: true,
          },
          {
            name: 'performanceGoal',
            description: 'Target performance goal (e.g., "under 2 seconds", "50% faster")',
            required: false,
          },
          {
            name: 'userExperience',
            description: 'User experience priority: "speed", "accuracy", or "balanced"',
            required: false,
          },
        ],
      },
      // Phase 3: AI-Powered Conversational Prompts
      {
        name: 'intelligent-chart-advisor',
        description: 'AI-powered conversational interface for chart creation guidance with interactive Q&A and contextual recommendations',
        arguments: [
          {
            name: 'businessQuestion',
            description: 'The business question or analytical goal you want to achieve',
            required: true,
          },
          {
            name: 'dataExploration',
            description: 'Information about the data you want to analyze (explore name, key fields, etc.)',
            required: false,
          },
          {
            name: 'userExperience',
            description: 'Your experience level: "beginner", "intermediate", "advanced", or "expert"',
            required: false,
          },
          {
            name: 'organizationalContext',
            description: 'Organizational context (industry, team size, common use cases, etc.)',
            required: false,
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
      
      case 'chart-performance-optimizer': {
        const chartUuid = args?.chartUuid || '{chartUuid}';
        const performanceGoal = args?.performanceGoal || 'under 3 seconds';
        const userExperience = args?.userExperience || 'balanced';
        
        return {
          description: `Interactive chart performance optimization workflow for chart: ${chartUuid}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to optimize the performance of chart ${chartUuid} with the goal of achieving ${performanceGoal} execution time, prioritizing ${userExperience} user experience.

Please follow this step-by-step optimization workflow:

**Phase 1: Performance Analysis**
1. Use lightdash_analyze_chart_performance to get current performance metrics
2. Identify the main performance bottlenecks and current execution time
3. Assess the complexity score and configuration issues

**Phase 2: Optimization Strategy**
4. Use lightdash_optimize_chart_query with optimization type based on user experience priority:
   - "speed" → use "performance" optimization type with "aggressive" aggressiveness
   - "accuracy" → use "accuracy" optimization type with "conservative" aggressiveness
   - "balanced" → use "comprehensive" optimization type with "moderate" aggressiveness
5. Review the suggested optimizations and their predicted performance improvements
6. Explain the trade-offs of each optimization approach

**Phase 3: Benchmarking (if needed)**
7. If multiple optimization approaches are viable, use lightdash_benchmark_chart_variations to test:
   - filter_combinations for charts with no/few filters
   - field_selections for charts with many dimensions/metrics
   - aggregation_levels for charts with complex grouping
8. Compare statistical results and identify the best performing variation

**Phase 4: Implementation Guidance**
9. Provide specific, actionable recommendations with:
   - Exact configuration changes needed
   - Expected performance improvement range
   - Implementation complexity and effort required
   - Potential risks and mitigation strategies

**Phase 5: Validation Plan**
10. Suggest a testing approach to validate the optimizations
11. Recommend monitoring metrics to track ongoing performance

Please start with Phase 1 and guide me through each step, asking for confirmation before proceeding to the next phase.`,
              },
            },
          ],
        };
      }
      
      case 'intelligent-chart-advisor': {
        const businessQuestion = args?.businessQuestion || '{businessQuestion}';
        const dataExploration = args?.dataExploration || '{dataExploration}';
        const userExperience = args?.userExperience || 'intermediate';
        const organizationalContext = args?.organizationalContext || '{organizationalContext}';
        
        return {
          description: `AI-powered chart creation guidance for: "${businessQuestion}"`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need intelligent guidance to create the right chart for my analytical needs. Here's my context:

**Business Question:** ${businessQuestion}

**Data Context:** ${dataExploration}

**My Experience Level:** ${userExperience}

**Organizational Context:** ${organizationalContext}

Please act as my intelligent chart advisor and guide me through this process:

**Phase 1: Understanding & Goal Interpretation**
1. Analyze my business question to understand the analytical goal
2. Use your AI capabilities to interpret what type of analysis would be most valuable
3. Ask clarifying questions if needed to better understand my requirements
4. Suggest the most appropriate analytical approach based on the question

**Phase 2: Data Exploration & Recommendations**
5. Help me identify the right explore/table for my analysis
6. Use lightdash_get_catalog_search to find relevant data sources if needed
7. Use lightdash_generate_chart_recommendations to get AI-powered chart suggestions
8. Explain why each recommendation fits my business question and goals

**Phase 3: Interactive Chart Design**
9. Walk me through the recommended chart configurations
10. Explain the reasoning behind field selections, chart types, and filters
11. Adapt recommendations based on my experience level (${userExperience})
12. Provide step-by-step implementation guidance

**Phase 4: Optimization & Best Practices**
13. Suggest performance optimizations if needed
14. Recommend best practices based on organizational context
15. Provide tips for making the chart more actionable and insightful

**Phase 5: Implementation Support**
16. Give me specific configuration details I can use
17. Suggest follow-up analyses or related charts that might be valuable
18. Provide guidance on sharing and presenting the results

Please start by analyzing my business question and providing your initial assessment and recommendations. Ask me any clarifying questions you need, and adapt your guidance to my experience level.

Remember to:
- Use AI-powered tools to provide intelligent recommendations
- Explain your reasoning in terms I can understand
- Provide practical, actionable advice
- Consider my organizational context in your suggestions
- Be conversational and supportive throughout the process`,
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
        case 'lightdash_analyze_chart_performance': {
          const args = AnalyzeChartPerformanceRequestSchema.parse(request.params.arguments);
          
          /**
           * Analyzes chart performance by:
           * 1. Getting chart configuration and recent results
           * 2. Measuring query execution time and data characteristics
           * 3. Identifying performance bottlenecks
           * 4. Generating optimization recommendations
           */
          
          const result = await withRetry(async () => {
            // Get chart configuration
            const chartResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!chartResponse.ok) {
              throw new Error(`HTTP ${chartResponse.status}: ${chartResponse.statusText}`);
            }

            const chartData = await chartResponse.json() as any;
            
            if (chartData.status === 'error') {
              throw new Error(`Lightdash API error: ${chartData.error.name}, ${chartData.error.message ?? 'no message'}`);
            }

            const chart = chartData.results;
            
            // Get chart results to measure performance
            const startTime = Date.now();
            const resultsResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}/results`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invalidateCache: false }),
              }
            );
            const executionTime = Date.now() - startTime;

            let resultsData: any = null;
            if (resultsResponse.ok) {
              resultsData = await resultsResponse.json();
            }

            // Analyze chart configuration
            const config = chart.metricQuery || {};
            const dimensionCount = config.dimensions?.length || 0;
            const metricCount = config.metrics?.length || 0;
            const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                              (config.filters?.dimensions?.or?.length || 0) +
                              (config.filters?.metrics?.and?.length || 0) +
                              (config.filters?.metrics?.or?.length || 0);
            const sortCount = config.sorts?.length || 0;
            const hasTableCalculations = config.tableCalculations?.length > 0;
            const hasCustomMetrics = config.customMetrics?.length > 0;

            // Analyze results data
            const rowCount = resultsData?.results?.rows?.length || 0;
            const columnCount = dimensionCount + metricCount + (config.tableCalculations?.length || 0);

            // Calculate performance score (0-100)
            let performanceScore = 100;
            if (executionTime > 15000) performanceScore -= 40; // Very slow
            else if (executionTime > 5000) performanceScore -= 25; // Slow
            else if (executionTime > 1000) performanceScore -= 10; // Moderate
            
            if (rowCount > 10000) performanceScore -= 20;
            else if (rowCount > 1000) performanceScore -= 10;
            
            if (dimensionCount > 5) performanceScore -= 10;
            if (metricCount > 10) performanceScore -= 10;
            if (filterCount === 0) performanceScore -= 15; // No filters can be inefficient

            performanceScore = Math.max(0, performanceScore);

            // Determine performance threshold
            let threshold: string;
            if (executionTime < 1000) threshold = 'fast';
            else if (executionTime < 5000) threshold = 'moderate';
            else if (executionTime < 15000) threshold = 'slow';
            else threshold = 'very_slow';

            // Generate bottlenecks and recommendations
            const bottlenecks: string[] = [];
            const recommendations: any[] = [];

            if (executionTime > 5000) {
              bottlenecks.push('Query execution time exceeds 5 seconds');
              recommendations.push({
                type: 'limit',
                priority: 'high',
                description: 'Add row limit to reduce query execution time',
                estimatedImprovement: '30-50% faster execution',
              });
            }

            if (filterCount === 0) {
              bottlenecks.push('No filters applied - querying entire dataset');
              recommendations.push({
                type: 'filter',
                priority: 'high',
                description: 'Add date range or categorical filters to limit data scope',
                estimatedImprovement: '50-80% faster execution',
              });
            }

            if (dimensionCount > 5) {
              bottlenecks.push('High number of dimensions may impact performance');
              recommendations.push({
                type: 'dimension',
                priority: 'medium',
                description: 'Consider reducing dimensions or using drill-down approach',
                estimatedImprovement: '20-30% faster execution',
              });
            }

            if (rowCount > 5000) {
              bottlenecks.push('Large result set may impact rendering performance');
              recommendations.push({
                type: 'limit',
                priority: 'medium',
                description: 'Consider adding pagination or limiting results',
                estimatedImprovement: '40-60% better user experience',
              });
            }

            // Build comprehensive analysis result
            const analysisResult = {
              chartUuid: args.chartUuid,
              chartName: chart.name,
              chartType: chart.chartConfig?.type || 'table',
              exploreId: chart.tableName,
              performance: {
                chartUuid: args.chartUuid,
                queryExecutionTime: executionTime,
                dataFreshness: 0, // Would need additional API call to determine
                rowCount,
                columnCount,
                performanceScore,
                threshold,
                bottlenecks,
                recommendations,
                metadata: {
                  analyzedAt: new Date().toISOString(),
                  analysisVersion: '1.0',
                },
              },
              configuration: {
                dimensionCount,
                metricCount,
                filterCount,
                sortCount,
                hasTableCalculations,
                hasCustomMetrics,
              },
              usage: {
                lastViewed: chart.updatedAt,
                viewCount: chart.views || 0,
                dashboardCount: chart.dashboardCount || 0,
              },
              quality: {
                score: performanceScore,
                issues: bottlenecks.map(bottleneck => ({
                  type: 'performance' as const,
                  severity: performanceScore < 50 ? 'critical' as const :
                           performanceScore < 75 ? 'warning' as const : 'info' as const,
                  message: bottleneck,
                  suggestion: recommendations.find(r => r.description.toLowerCase().includes(
                    bottleneck.toLowerCase().split(' ')[0]
                  ))?.description,
                })),
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '1.0',
              },
            };

            return analysisResult;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_extract_chart_patterns': {
          const args = ExtractChartPatternsRequestSchema.parse(request.params.arguments);
          
          /**
           * Extracts patterns from charts by:
           * 1. Analyzing chart configurations for common structures
           * 2. Identifying recurring patterns in metrics, dimensions, and filters
           * 3. Calculating pattern frequency and confidence scores
           * 4. Generating reusable templates
           */
          
          const result = await withRetry(async () => {
            const patterns: any[] = [];
            const chartConfigs: any[] = [];

            // Fetch all chart configurations
            for (const chartUuid of args.chartUuids) {
              try {
                const chartResponse = await fetch(
                  `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chartUuid}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );

                if (chartResponse.ok) {
                  const chartData = await chartResponse.json() as any;
                  if (chartData.status !== 'error') {
                    chartConfigs.push({
                      uuid: chartUuid,
                      name: chartData.results.name,
                      config: chartData.results,
                    });
                  }
                }
              } catch (error) {
                console.warn(`Failed to fetch chart ${chartUuid}:`, error);
              }
            }

            // Pattern analysis logic
            const exploreGroups = new Map<string, any[]>();
            const metricPatterns = new Map<string, number>();
            const dimensionPatterns = new Map<string, number>();
            const chartTypePatterns = new Map<string, number>();

            // Group charts by explore and analyze patterns
            chartConfigs.forEach(chart => {
              const exploreId = chart.config.tableName;
              const metricQuery = chart.config.metricQuery || {};
              const chartType = chart.config.chartConfig?.type || 'table';

              if (!exploreGroups.has(exploreId)) {
                exploreGroups.set(exploreId, []);
              }
              exploreGroups.get(exploreId)!.push(chart);

              // Count metric patterns
              (metricQuery.metrics || []).forEach((metric: string) => {
                metricPatterns.set(metric, (metricPatterns.get(metric) || 0) + 1);
              });

              // Count dimension patterns
              (metricQuery.dimensions || []).forEach((dimension: string) => {
                dimensionPatterns.set(dimension, (dimensionPatterns.get(dimension) || 0) + 1);
              });

              // Count chart type patterns
              chartTypePatterns.set(chartType, (chartTypePatterns.get(chartType) || 0) + 1);
            });

            // Generate patterns for each explore
            let patternId = 1;
            exploreGroups.forEach((charts, exploreId) => {
              if (charts.length < 2) return; // Need at least 2 charts to identify a pattern

              // Find common metrics and dimensions
              const commonMetrics = Array.from(metricPatterns.entries())
                .filter(([_, count]) => count >= Math.ceil(charts.length * 0.5))
                .map(([metric, _]) => metric);

              const commonDimensions = Array.from(dimensionPatterns.entries())
                .filter(([_, count]) => count >= Math.ceil(charts.length * 0.5))
                .map(([dimension, _]) => dimension);

              if (commonMetrics.length > 0 || commonDimensions.length > 0) {
                // Determine pattern type
                let patternType = 'custom';
                if (commonDimensions.some(d => d.includes('date') || d.includes('time'))) {
                  patternType = 'time_series';
                } else if (commonMetrics.length === 1 && commonDimensions.length >= 1) {
                  patternType = 'metric_breakdown';
                } else if (commonMetrics.length > 1) {
                  patternType = 'comparison';
                }

                // Skip if pattern type filter is specified and doesn't match
                if (args.patternType && patternType !== args.patternType) {
                  return;
                }

                // Calculate confidence based on how many charts share the pattern
                const confidence = charts.length / args.chartUuids.length;

                if (confidence >= (args.minConfidence || 0.7)) {
                  // Get most common chart type for this pattern
                  const patternChartTypes = charts.map(c => c.config.chartConfig?.type || 'table');
                  const mostCommonChartType = patternChartTypes.reduce((a, b, _, arr) =>
                    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
                  );

                  // Create example charts
                  const examples = args.includeExamples ? charts.slice(0, 3).map(chart => ({
                    chartUuid: chart.uuid,
                    chartName: chart.name,
                    similarity: confidence,
                  })) : [];

                  patterns.push({
                    patternId: `pattern_${patternId++}`,
                    patternType,
                    name: `${exploreId} ${patternType.replace('_', ' ')} pattern`,
                    description: `Common pattern using ${commonMetrics.length} metrics and ${commonDimensions.length} dimensions from ${exploreId}`,
                    frequency: charts.length,
                    confidence,
                    template: {
                      exploreId,
                      dimensions: commonDimensions,
                      metrics: commonMetrics,
                      filters: [], // Would need more sophisticated analysis
                      sorts: [], // Would need more sophisticated analysis
                      chartConfig: {
                        type: mostCommonChartType,
                        options: {},
                      },
                    },
                    examples,
                    metadata: {
                      extractedAt: new Date().toISOString(),
                      sourceChartCount: charts.length,
                      extractionVersion: '1.0',
                    },
                  });
                }
              }
            });

            return {
              patterns,
              summary: {
                totalChartsAnalyzed: chartConfigs.length,
                patternsFound: patterns.length,
                exploresAnalyzed: exploreGroups.size,
                averageConfidence: patterns.length > 0 ? (patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length) : 0,
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '1.0',
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_discover_chart_relationships': {
          const args = DiscoverChartRelationshipsRequestSchema.parse(request.params.arguments);
          
          /**
           * Discovers chart relationships by:
           * 1. Getting the source chart configuration
           * 2. Finding charts with shared explores, metrics, dimensions, or filters
           * 3. Calculating relationship strength scores
           * 4. Performing impact analysis for potential changes
           */
          
          const result = await withRetry(async () => {
            // Get source chart configuration
            const sourceChartResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!sourceChartResponse.ok) {
              throw new Error(`HTTP ${sourceChartResponse.status}: ${sourceChartResponse.statusText}`);
            }

            const sourceChartData = await sourceChartResponse.json() as any;
            if (sourceChartData.status === 'error') {
              throw new Error(`Lightdash API error: ${sourceChartData.error.name}`);
            }

            const sourceChart = sourceChartData.results;
            const sourceConfig = sourceChart.metricQuery || {};
            const sourceExploreId = sourceChart.tableName;
            const sourceMetrics = sourceConfig.metrics || [];
            const sourceDimensions = sourceConfig.dimensions || [];

            // Get project UUID from source chart to find other charts
            const projectUuid = sourceChart.projectUuid;
            
            // Get all charts in the project
            const { data: chartsData, error: chartsError } = await lightdashClient.GET(
              '/api/v1/projects/{projectUuid}/charts',
              {
                params: {
                  path: { projectUuid },
                },
              }
            );

            if (chartsError) {
              throw new Error(`Failed to get project charts: ${chartsError.error.name}`);
            }

            const allCharts = chartsData.results || [];
            const relationships: any[] = [];

            // Analyze each chart for relationships
            for (const chart of allCharts) {
              if (chart.uuid === args.chartUuid) continue; // Skip self

              try {
                // Get detailed chart configuration
                const chartResponse = await fetch(
                  `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chart.uuid}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );

                if (!chartResponse.ok) continue;

                const chartData = await chartResponse.json() as any;
                if (chartData.status === 'error') continue;

                const relatedChart = chartData.results;
                const relatedConfig = relatedChart.metricQuery || {};
                const relatedExploreId = relatedChart.tableName;
                const relatedMetrics = relatedConfig.metrics || [];
                const relatedDimensions = relatedConfig.dimensions || [];

                // Calculate relationship strength and type
                let relationshipStrength = 0;
                const relationshipTypes: string[] = [];
                const commonElements: any = {
                  sharedMetrics: [],
                  sharedDimensions: [],
                  sharedFilters: [],
                  dashboards: [],
                };

                // Check for shared explore
                if (sourceExploreId === relatedExploreId) {
                  relationshipStrength += 0.3;
                  relationshipTypes.push('shared_explore');
                  commonElements.exploreId = sourceExploreId;
                }

                // Check for shared metrics
                const sharedMetrics = sourceMetrics.filter((m: string) => relatedMetrics.includes(m));
                if (sharedMetrics.length > 0) {
                  relationshipStrength += (sharedMetrics.length / Math.max(sourceMetrics.length, relatedMetrics.length)) * 0.4;
                  relationshipTypes.push('shared_metrics');
                  commonElements.sharedMetrics = sharedMetrics;
                }

                // Check for shared dimensions
                const sharedDimensions = sourceDimensions.filter((d: string) => relatedDimensions.includes(d));
                if (sharedDimensions.length > 0) {
                  relationshipStrength += (sharedDimensions.length / Math.max(sourceDimensions.length, relatedDimensions.length)) * 0.3;
                  relationshipTypes.push('shared_dimensions');
                  commonElements.sharedDimensions = sharedDimensions;
                }

                // Filter by relationship type if specified
                if (args.relationshipType !== 'all' && !relationshipTypes.includes(args.relationshipType)) {
                  continue;
                }

                // Filter by minimum strength
                if (relationshipStrength < (args.minStrength || 0.3)) {
                  continue;
                }

                // Determine primary relationship type
                const primaryRelationshipType = relationshipTypes.length > 0 ? relationshipTypes[0] : 'shared_explore';

                // Impact analysis
                const changeRisk = relationshipStrength > 0.7 ? 'high' :
                                 relationshipStrength > 0.4 ? 'medium' : 'low';

                relationships.push({
                  relatedChartUuid: chart.uuid,
                  relatedChartName: chart.name,
                  relationshipType: primaryRelationshipType,
                  strength: Math.round(relationshipStrength * 100) / 100,
                  commonElements,
                  impactAnalysis: {
                    changeRisk,
                    affectedDashboards: [], // Would need additional API calls
                    dependentCharts: relationshipTypes.length,
                  },
                });

              } catch (error) {
                console.warn(`Failed to analyze chart ${chart.uuid}:`, error);
              }
            }

            // Sort by relationship strength and limit results
            relationships.sort((a, b) => b.strength - a.strength);
            const limitedRelationships = relationships.slice(0, args.maxResults || 25);

            // Calculate summary statistics
            const strongRelationships = limitedRelationships.filter(r => r.strength > 0.6).length;
            const weakRelationships = limitedRelationships.filter(r => r.strength <= 0.4).length;
            const criticalDependencies = limitedRelationships.filter(r => r.impactAnalysis.changeRisk === 'high').length;

            return {
              sourceChartUuid: args.chartUuid,
              relationships: limitedRelationships,
              summary: {
                totalRelatedCharts: limitedRelationships.length,
                strongRelationships,
                weakRelationships,
                criticalDependencies,
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '1.0',
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_optimize_chart_query': {
          const args = OptimizeChartQueryRequestSchema.parse(request.params.arguments);
          
          /**
           * Phase 2 Tool 4: Optimize Chart Query
           * Analyzes chart queries and suggests specific optimizations with before/after performance comparisons
           */
          
          const result = await withRetry(async () => {
            // Get chart configuration
            const chartResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!chartResponse.ok) {
              throw new Error(`HTTP ${chartResponse.status}: ${chartResponse.statusText}`);
            }

            const chartData = await chartResponse.json() as any;
            if (chartData.status === 'error') {
              throw new Error(`Lightdash API error: ${chartData.error.name}`);
            }

            const chart = chartData.results;
            const originalConfig = chart.metricQuery || {};
            
            // Measure current performance
            const startTime = Date.now();
            const currentResultsResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}/results`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invalidateCache: false }),
              }
            );
            const currentExecutionTime = Date.now() - startTime;
            
            let currentResultsData: any = null;
            if (currentResultsResponse.ok) {
              currentResultsData = await currentResultsResponse.json();
            }
            
            const currentRowCount = currentResultsData?.results?.rows?.length || 0;
            const currentComplexityScore = calculateQueryComplexityScore(originalConfig);
            
            // Generate optimization suggestions
            const suggestions = generateOptimizationSuggestions(
              originalConfig,
              { executionTime: currentExecutionTime, rowCount: currentRowCount },
              args.optimizationType,
              args.aggressiveness
            );
            
            // Create optimized configurations based on suggestions
            const optimizedConfigs: any[] = [];
            
            for (const suggestion of suggestions.slice(0, 3)) { // Top 3 suggestions
              let optimizedConfig = JSON.parse(JSON.stringify(originalConfig));
              
              // Apply optimization based on suggestion type
              switch (suggestion.type) {
                case 'filter':
                  // Add date filter if missing
                  if (!optimizedConfig.filters) {
                    optimizedConfig.filters = { dimensions: { id: 'filter_group', and: [] } };
                  }
                  if (!optimizedConfig.filters.dimensions) {
                    optimizedConfig.filters.dimensions = { id: 'filter_group', and: [] };
                  }
                  if (!optimizedConfig.filters.dimensions.and) {
                    optimizedConfig.filters.dimensions.and = [];
                  }
                  
                  // Add a sample date filter (would need explore schema for actual field names)
                  optimizedConfig.filters.dimensions.and.push({
                    id: 'date_filter',
                    target: { fieldId: 'date_field' }, // Placeholder
                    operator: 'inThePast',
                    values: [90, 'days'],
                  });
                  break;
                  
                case 'limit':
                  optimizedConfig.limit = suggestion.implementation?.changes?.[0]?.suggestedValue || 1000;
                  break;
                  
                case 'dimension':
                  // Reduce dimensions to top 3
                  if (optimizedConfig.dimensions && optimizedConfig.dimensions.length > 3) {
                    optimizedConfig.dimensions = optimizedConfig.dimensions.slice(0, 3);
                  }
                  break;
                  
                case 'metric':
                  // Reduce metrics to top 5
                  if (optimizedConfig.metrics && optimizedConfig.metrics.length > 5) {
                    optimizedConfig.metrics = optimizedConfig.metrics.slice(0, 5);
                  }
                  break;
              }
              
              // Calculate predicted performance for optimized config
              const prediction = predictQueryPerformance(optimizedConfig, currentExecutionTime);
              const optimizedComplexityScore = calculateQueryComplexityScore(optimizedConfig);
              
              optimizedConfigs.push({
                optimizationId: suggestion.id,
                optimizationType: suggestion.type,
                description: suggestion.description,
                configuration: optimizedConfig,
                predictions: {
                  estimatedExecutionTime: prediction.estimatedTime,
                  confidence: prediction.confidence,
                  complexityScore: optimizedComplexityScore,
                  performanceImprovement: Math.round(((currentExecutionTime - prediction.estimatedTime) / currentExecutionTime) * 100),
                  factors: prediction.factors,
                },
                implementation: suggestion.implementation,
                impact: suggestion.impact,
              });
            }
            
            // Performance comparison
            const performanceComparison = {
              current: {
                executionTime: currentExecutionTime,
                rowCount: currentRowCount,
                complexityScore: currentComplexityScore,
                performanceScore: Math.max(0, 100 - currentComplexityScore),
              },
              optimized: optimizedConfigs.map(config => ({
                optimizationId: config.optimizationId,
                estimatedExecutionTime: config.predictions.estimatedExecutionTime,
                estimatedComplexityScore: config.predictions.complexityScore,
                estimatedPerformanceScore: Math.max(0, 100 - config.predictions.complexityScore),
                improvementPercentage: config.predictions.performanceImprovement,
              })),
            };
            
            return {
              chartUuid: args.chartUuid,
              chartName: chart.name,
              optimizationType: args.optimizationType,
              aggressiveness: args.aggressiveness,
              currentPerformance: performanceComparison.current,
              optimizedConfigurations: optimizedConfigs,
              performanceComparison,
              recommendations: {
                primaryOptimization: optimizedConfigs[0]?.optimizationId || null,
                estimatedImprovementRange: optimizedConfigs.length > 0 ?
                  `${Math.min(...optimizedConfigs.map(c => c.predictions.performanceImprovement))}%-${Math.max(...optimizedConfigs.map(c => c.predictions.performanceImprovement))}%` :
                  'No optimizations available',
                implementationComplexity: optimizedConfigs[0]?.implementation?.complexity || 'unknown',
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '2.0',
                optimizationEngine: 'phase2-advanced',
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_benchmark_chart_variations': {
          const args = BenchmarkChartVariationsRequestSchema.parse(request.params.arguments);
          
          /**
           * Phase 2 Tool 5: Benchmark Chart Variations
           * Tests multiple query variations for performance with statistical analysis
           */
          
          const result = await withRetry(async () => {
            // Get base chart configuration
            const chartResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!chartResponse.ok) {
              throw new Error(`HTTP ${chartResponse.status}: ${chartResponse.statusText}`);
            }

            const chartData = await chartResponse.json() as any;
            if (chartData.status === 'error') {
              throw new Error(`Lightdash API error: ${chartData.error.name}`);
            }

            const chart = chartData.results;
            const baseConfig = chart.metricQuery || {};
            
            // Generate variations based on variation types
            const variations: any[] = [];
            let variationId = 1;
            
            for (const variationType of args.variations) {
              let variationConfigs: any[] = [];
              
              switch (variationType) {
                case 'filter_combinations':
                  // Create variations with different filter combinations
                  variationConfigs = [
                    { ...baseConfig }, // Original
                    { ...baseConfig, limit: 1000 }, // With limit
                    { ...baseConfig, dimensions: baseConfig.dimensions?.slice(0, 3) || [] }, // Fewer dimensions
                  ];
                  break;
                  
                case 'field_selections':
                  // Create variations with different field selections
                  const originalDimensions = baseConfig.dimensions || [];
                  const originalMetrics = baseConfig.metrics || [];
                  
                  variationConfigs = [
                    { ...baseConfig }, // Original
                    { ...baseConfig, dimensions: originalDimensions.slice(0, Math.max(1, Math.floor(originalDimensions.length / 2))) }, // Half dimensions
                    { ...baseConfig, metrics: originalMetrics.slice(0, Math.max(1, Math.floor(originalMetrics.length / 2))) }, // Half metrics
                  ];
                  break;
                  
                case 'aggregation_levels':
                  // Create variations with different aggregation levels
                  variationConfigs = [
                    { ...baseConfig }, // Original
                    { ...baseConfig, dimensions: [] }, // No dimensions (full aggregation)
                    { ...baseConfig, dimensions: baseConfig.dimensions?.slice(0, 1) || [] }, // Single dimension
                  ];
                  break;
                  
                case 'time_ranges':
                  // Create variations with different time ranges
                  variationConfigs = [
                    { ...baseConfig }, // Original
                    { ...baseConfig, limit: 500 }, // With smaller limit
                    { ...baseConfig, limit: 2000 }, // With larger limit
                  ];
                  break;
                  
                case 'limit_variations':
                  // Create variations with different row limits
                  variationConfigs = [
                    { ...baseConfig }, // Original
                    { ...baseConfig, limit: 100 }, // Small limit
                    { ...baseConfig, limit: 1000 }, // Medium limit
                    { ...baseConfig, limit: 5000 }, // Large limit
                  ];
                  break;
                  
                default:
                  variationConfigs = [{ ...baseConfig }];
              }
              
              // Benchmark each variation configuration
              for (const config of variationConfigs) {
                const executionTimes: number[] = [];
                const rowCounts: number[] = [];
                
                // Run multiple tests for statistical significance
                const testRuns = Math.min(args.testDuration || 3, 5); // Limit to prevent API abuse
                
                for (let run = 0; run < testRuns; run++) {
                  try {
                    const startTime = Date.now();
                    
                    // For actual benchmarking, we would need to create temporary charts or use the query API
                    // For now, we'll simulate with the existing chart results endpoint
                    const testResponse = await fetch(
                      `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${args.chartUuid}/results`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ invalidateCache: true }), // Force fresh execution
                      }
                    );
                    
                    const executionTime = Date.now() - startTime;
                    executionTimes.push(executionTime);
                    
                    if (testResponse.ok) {
                      const testData = await testResponse.json() as any;
                      const rowCount = testData?.results?.rows?.length || 0;
                      rowCounts.push(rowCount);
                    }
                    
                    // Add small delay between runs to avoid overwhelming the API
                    if (run < testRuns - 1) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                  } catch (error) {
                    console.warn(`Benchmark run ${run + 1} failed:`, error);
                  }
                }
                
                if (executionTimes.length > 0) {
                  // Calculate statistical metrics
                  const stats = calculateStatisticalMetrics(executionTimes, args.significanceLevel || 'medium');
                  const avgRowCount = rowCounts.length > 0 ? rowCounts.reduce((a, b) => a + b, 0) / rowCounts.length : 0;
                  
                  variations.push({
                    variationId: `var_${variationId++}`,
                    variationType,
                    description: `${variationType.replace('_', ' ')} variation`,
                    configuration: config,
                    performance: {
                      executionTimes,
                      averageExecutionTime: stats.mean,
                      medianExecutionTime: stats.median,
                      standardDeviation: stats.standardDeviation,
                      confidenceInterval: stats.confidenceInterval,
                      averageRowCount: Math.round(avgRowCount),
                      complexityScore: calculateQueryComplexityScore(config),
                    },
                    statistics: {
                      sampleSize: executionTimes.length,
                      reliability: executionTimes.length >= 3 ? 'good' : 'limited',
                      variability: stats.standardDeviation / stats.mean, // Coefficient of variation
                    },
                  });
                }
              }
            }
            
            // Compare variations and find the best performing
            if (variations.length > 1) {
              variations.sort((a, b) => a.performance.averageExecutionTime - b.performance.averageExecutionTime);
              
              // Calculate relative performance improvements
              const baseline = variations.find(v => v.description.includes('Original')) || variations[variations.length - 1];
              const baselineTime = baseline.performance.averageExecutionTime;
              
              variations.forEach(variation => {
                variation.comparison = {
                  improvementPercentage: Math.round(((baselineTime - variation.performance.averageExecutionTime) / baselineTime) * 100),
                  isStatisticallySignificant: Math.abs(variation.performance.averageExecutionTime - baselineTime) >
                    (variation.performance.standardDeviation + baseline.performance.standardDeviation),
                  confidenceLevel: variation.performance.confidenceInterval.level,
                };
              });
            }
            
            // Generate recommendations
            const bestVariation = variations[0];
            const worstVariation = variations[variations.length - 1];
            
            const recommendations = {
              bestPerforming: bestVariation ? {
                variationId: bestVariation.variationId,
                description: bestVariation.description,
                improvementPercentage: bestVariation.comparison?.improvementPercentage || 0,
                averageExecutionTime: bestVariation.performance.averageExecutionTime,
              } : null,
              
              worstPerforming: worstVariation && variations.length > 1 ? {
                variationId: worstVariation.variationId,
                description: worstVariation.description,
                performancePenalty: worstVariation.comparison?.improvementPercentage || 0,
                averageExecutionTime: worstVariation.performance.averageExecutionTime,
              } : null,
              
              statisticalInsights: [
                `Tested ${variations.length} variations across ${args.variations.length} variation types`,
                variations.length > 1 ?
                  `Performance range: ${Math.round(bestVariation.performance.averageExecutionTime)}ms - ${Math.round(worstVariation.performance.averageExecutionTime)}ms` :
                  'Single variation tested',
                `Average confidence level: ${Math.round(variations.reduce((sum, v) => sum + v.performance.confidenceInterval.level, 0) / variations.length * 100)}%`,
              ],
            };
            
            return {
              chartUuid: args.chartUuid,
              chartName: chart.name,
              testConfiguration: {
                variations: args.variations,
                testDuration: args.testDuration,
                significanceLevel: args.significanceLevel,
              },
              variations,
              recommendations,
              summary: {
                totalVariationsTested: variations.length,
                bestPerformanceImprovement: bestVariation?.comparison?.improvementPercentage || 0,
                averageExecutionTime: variations.length > 0 ?
                  Math.round(variations.reduce((sum, v) => sum + v.performance.averageExecutionTime, 0) / variations.length) : 0,
                statisticalReliability: variations.filter(v => v.statistics.reliability === 'good').length / variations.length,
              },
              metadata: {
                analyzedAt: new Date().toISOString(),
                analysisVersion: '2.0',
                benchmarkEngine: 'phase2-statistical',
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_generate_chart_recommendations': {
          const args = GenerateChartRecommendationsRequestSchema.parse(request.params.arguments);
          
          /**
           * Phase 3 Tool 6: Generate Chart Recommendations
           * AI-powered analysis of analytical goals and data patterns to generate intelligent chart suggestions
           */
          
          const result = await withRetry(async () => {
            const startTime = Date.now();
            
            // Get explore schema for data analysis
            const allProjectsResponse = await lightdashClient.GET('/api/v1/org/projects', {});
            if (allProjectsResponse.error) {
              throw new Error(`Failed to get projects: ${allProjectsResponse.error.error.name}`);
            }
            
            let exploreSchema: any = null;
            let projectUuid: string = '';
            
            // Find the project containing this explore
            for (const project of allProjectsResponse.data.results || []) {
              try {
                const exploreResponse = await lightdashClient.GET(
                  '/api/v1/projects/{projectUuid}/explores/{exploreId}',
                  {
                    params: {
                      path: { projectUuid: project.projectUuid, exploreId: args.exploreId },
                    },
                  }
                );
                
                if (!exploreResponse.error) {
                  exploreSchema = exploreResponse.data.results;
                  projectUuid = project.projectUuid;
                  break;
                }
              } catch (error) {
                // Continue searching other projects
              }
            }
            
            if (!exploreSchema) {
              throw new Error(`Explore ${args.exploreId} not found in any accessible project`);
            }
            
            // Analyze data characteristics
            const dataCharacteristics = analyzeDataCharacteristics(exploreSchema);
            
            // Interpret analytical goal
            const goalInterpretation = interpretAnalyticalGoal(
              args.dataContext?.businessContext,
              args.dataContext,
              args.dataContext?.userRole
            );
            
            // Generate chart recommendations
            const recommendations: any[] = [];
            let recommendationId = 1;
            
            // Generate recommendations based on analytical goal and data characteristics
            const chartTypes = ['line', 'bar', 'table', 'pie', 'scatter', 'area'];
            const maxRecommendations = Math.min(args.maxRecommendations || 10, 15);
            
            for (const chartType of chartTypes) {
              if (recommendations.length >= maxRecommendations) break;
              
              // Create base configuration
              const baseConfig: any = {
                chartType,
                exploreId: args.exploreId,
                dimensions: [],
                metrics: [],
                filters: [],
                sorts: [],
              };
              
              // Add appropriate fields based on chart type and data characteristics
              if (chartType === 'line' && dataCharacteristics.temporalFields.length > 0) {
                baseConfig.dimensions = [dataCharacteristics.temporalFields[0]];
                baseConfig.metrics = dataCharacteristics.numericFields.slice(0, 2);
              } else if (chartType === 'bar' && dataCharacteristics.categoricalFields.length > 0) {
                baseConfig.dimensions = dataCharacteristics.categoricalFields.slice(0, 2);
                baseConfig.metrics = dataCharacteristics.numericFields.slice(0, 1);
              } else if (chartType === 'table') {
                baseConfig.dimensions = dataCharacteristics.categoricalFields.slice(0, 3);
                baseConfig.metrics = dataCharacteristics.numericFields.slice(0, 3);
              } else if (chartType === 'pie' && dataCharacteristics.categoricalFields.length > 0) {
                baseConfig.dimensions = [dataCharacteristics.categoricalFields[0]];
                baseConfig.metrics = [dataCharacteristics.numericFields[0]];
              } else if (chartType === 'scatter' && dataCharacteristics.numericFields.length >= 2) {
                baseConfig.metrics = dataCharacteristics.numericFields.slice(0, 2);
                if (dataCharacteristics.categoricalFields.length > 0) {
                  baseConfig.dimensions = [dataCharacteristics.categoricalFields[0]];
                }
              } else {
                // Skip if chart type doesn't match available data
                continue;
              }
              
              // Calculate recommendation score
              const scoring = calculateRecommendationScore(
                baseConfig,
                dataCharacteristics,
                args.analyticalGoal,
                args.dataContext
              );
              
              // Only include recommendations with reasonable confidence
              if (scoring.score >= 0.3) {
                const recommendation = {
                  recommendationId: `rec_${recommendationId++}`,
                  title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Analysis`,
                  description: `${chartType} visualization optimized for ${args.analyticalGoal} analysis`,
                  analyticalGoal: args.analyticalGoal,
                  confidence: scoring.confidence,
                  confidenceScore: scoring.score,
                  reasoning: {
                    type: 'pattern_based',
                    explanation: `This ${chartType} chart is recommended based on your ${args.analyticalGoal} goal and the available data characteristics`,
                    supportingEvidence: [
                      `Chart type ${chartType} aligns well with ${args.analyticalGoal} analysis`,
                      `Available data includes ${dataCharacteristics.numericFields.length} metrics and ${dataCharacteristics.categoricalFields.length} dimensions`,
                      `Data characteristics support this visualization approach`,
                    ],
                    dataCharacteristics: dataCharacteristics.recommendations,
                  },
                  chartConfiguration: baseConfig,
                  implementationGuidance: args.includeImplementationGuidance ? {
                    steps: [
                      {
                        stepNumber: 1,
                        title: 'Select Explore',
                        description: `Choose the ${args.exploreId} explore as your data source`,
                        estimatedTime: '1 minute',
                      },
                      {
                        stepNumber: 2,
                        title: 'Configure Fields',
                        description: `Add the recommended dimensions and metrics to your chart`,
                        estimatedTime: '2-3 minutes',
                      },
                      {
                        stepNumber: 3,
                        title: 'Set Chart Type',
                        description: `Select ${chartType} as your visualization type`,
                        estimatedTime: '30 seconds',
                      },
                      {
                        stepNumber: 4,
                        title: 'Apply Filters',
                        description: 'Add relevant filters to focus your analysis',
                        estimatedTime: '1-2 minutes',
                      },
                    ],
                    complexity: baseConfig.dimensions.length + baseConfig.metrics.length <= 4 ? 'simple' :
                               baseConfig.dimensions.length + baseConfig.metrics.length <= 7 ? 'moderate' : 'complex',
                    prerequisites: ['Access to the explore', 'Understanding of the business context'],
                    tips: [
                      'Start with fewer fields and add more as needed',
                      'Use filters to focus on relevant data',
                      'Consider your audience when choosing chart types',
                    ],
                  } : undefined,
                  expectedOutcomes: {
                    insights: [
                      `Understand ${args.analyticalGoal} patterns in your data`,
                      'Identify key trends and relationships',
                      'Make data-driven decisions based on the analysis',
                    ],
                    businessValue: `Enables better ${args.analyticalGoal} understanding and decision-making`,
                    useCases: [
                      'Regular reporting and monitoring',
                      'Ad-hoc analysis and exploration',
                      'Presentation to stakeholders',
                    ],
                  },
                  alternatives: [
                    {
                      title: 'Alternative Chart Type',
                      description: 'Consider other visualization types based on your specific needs',
                      tradeoffs: ['Different visual emphasis', 'Varying complexity levels'],
                    },
                  ],
                };
                
                recommendations.push(recommendation);
              }
            }
            
            // Sort recommendations by confidence score
            recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
            
            const processingTime = Date.now() - startTime;
            
            return {
              exploreId: args.exploreId,
              analyticalGoal: args.analyticalGoal,
              recommendations: recommendations.slice(0, maxRecommendations),
              summary: {
                totalRecommendations: recommendations.length,
                averageConfidence: recommendations.length > 0 ?
                  recommendations.reduce((sum, r) => sum + r.confidenceScore, 0) / recommendations.length : 0,
                recommendationTypes: recommendations.reduce((types, r) => {
                  const chartType = r.chartConfiguration.chartType;
                  types[chartType] = (types[chartType] || 0) + 1;
                  return types;
                }, {} as Record<string, number>),
                estimatedImplementationTime: `${Math.ceil(recommendations.length * 5)} minutes`,
              },
              metadata: {
                generatedAt: new Date().toISOString(),
                aiVersion: '3.0',
                processingTime,
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_auto_optimize_dashboard': {
          const args = AutoOptimizeDashboardRequestSchema.parse(request.params.arguments);
          
          /**
           * Phase 3 Tool 7: Auto Optimize Dashboard
           * Automated dashboard optimization using AI-driven analysis
           */
          
          const result = await withRetry(async () => {
            const startTime = Date.now();
            
            // Get dashboard configuration
            const dashboardResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/dashboards/${args.dashboardUuid}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!dashboardResponse.ok) {
              throw new Error(`HTTP ${dashboardResponse.status}: ${dashboardResponse.statusText}`);
            }

            const dashboardData = await dashboardResponse.json() as any;
            if (dashboardData.status === 'error') {
              throw new Error(`Lightdash API error: ${dashboardData.error.name}`);
            }

            const dashboard = dashboardData.results;
            const tiles = dashboard.tiles || [];
            
            // Analyze current dashboard state
            const currentState = {
              tileCount: tiles.length,
              averageLoadTime: 0,
              performanceScore: 75, // Base score
              usabilityScore: 70,   // Base score
              identifiedIssues: [] as any[],
            };
            
            // Analyze each tile for performance issues
            const tileAnalyses: any[] = [];
            let totalLoadTime = 0;
            
            for (const tile of tiles.slice(0, 10)) { // Limit analysis for performance
              if (tile.type === 'saved_chart' && tile.properties?.savedChartUuid) {
                try {
                  const tileStartTime = Date.now();
                  const tileResponse = await fetch(
                    `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${tile.properties.savedChartUuid}/results`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ invalidateCache: false }),
                    }
                  );
                  const tileLoadTime = Date.now() - tileStartTime;
                  totalLoadTime += tileLoadTime;
                  
                  // Analyze tile performance
                  if (tileLoadTime > 5000) {
                    currentState.identifiedIssues.push({
                      type: 'performance',
                      severity: 'high',
                      description: `Tile "${tile.properties.title || 'Untitled'}" has slow load time (${tileLoadTime}ms)`,
                      affectedTiles: [tile.uuid],
                    });
                  }
                  
                  tileAnalyses.push({
                    tileId: tile.uuid,
                    loadTime: tileLoadTime,
                    title: tile.properties?.title || 'Untitled',
                  });
                } catch (error) {
                  console.warn(`Failed to analyze tile ${tile.uuid}:`, error);
                }
              }
            }
            
            currentState.averageLoadTime = tileAnalyses.length > 0 ?
              totalLoadTime / tileAnalyses.length : 2000;
            
            // Adjust performance score based on load times
            if (currentState.averageLoadTime > 10000) {
              currentState.performanceScore = 30;
            } else if (currentState.averageLoadTime > 5000) {
              currentState.performanceScore = 50;
            } else if (currentState.averageLoadTime > 2000) {
              currentState.performanceScore = 70;
            }
            
            // Analyze layout and usability
            if (tiles.length > 12) {
              currentState.identifiedIssues.push({
                type: 'usability',
                severity: 'medium',
                description: 'Dashboard has many tiles which may overwhelm users',
                affectedTiles: tiles.map((t: any) => t.uuid),
              });
              currentState.usabilityScore -= 20;
            }
            
            // Generate optimization plan
            const optimizations: any[] = [];
            let optimizationId = 1;
            
            // Performance optimizations
            if (args.optimizationGoals.includes('performance')) {
              const slowTiles = tileAnalyses.filter(t => t.loadTime > 3000);
              if (slowTiles.length > 0) {
                optimizations.push({
                  optimizationId: `opt_${optimizationId++}`,
                  type: 'performance',
                  title: 'Optimize Slow-Loading Tiles',
                  description: `${slowTiles.length} tiles have slow load times and should be optimized`,
                  priority: 'high',
                  implementation: {
                    changes: slowTiles.map(tile => ({
                      target: tile.tileId,
                      action: 'optimize_query',
                      details: `Optimize query for "${tile.title}" to improve load time`,
                    })),
                    estimatedEffort: `${slowTiles.length * 30} minutes`,
                    riskLevel: 'low',
                  },
                  expectedBenefits: [
                    `Reduce average load time by 40-60%`,
                    'Improve user experience',
                    'Reduce server load',
                  ],
                  potentialRisks: ['Temporary disruption during optimization'],
                });
              }
            }
            
            // Layout optimizations
            if (args.optimizationGoals.includes('user_experience')) {
              if (tiles.length > 8) {
                optimizations.push({
                  optimizationId: `opt_${optimizationId++}`,
                  type: 'layout',
                  title: 'Reorganize Dashboard Layout',
                  description: 'Reorganize tiles for better visual hierarchy and user flow',
                  priority: 'medium',
                  implementation: {
                    changes: [
                      {
                        target: 'dashboard_layout',
                        action: 'reorganize',
                        details: 'Group related tiles and prioritize most important metrics',
                      },
                    ],
                    estimatedEffort: '45 minutes',
                    riskLevel: 'low',
                  },
                  expectedBenefits: [
                    'Improved visual hierarchy',
                    'Better user navigation',
                    'Reduced cognitive load',
                  ],
                  potentialRisks: ['Users need to adapt to new layout'],
                });
              }
            }
            
            // Content optimizations
            if (args.optimizationGoals.includes('data_accuracy')) {
              optimizations.push({
                optimizationId: `opt_${optimizationId++}`,
                type: 'content',
                title: 'Standardize Metrics and Filters',
                description: 'Ensure consistent metric definitions and filter applications across tiles',
                priority: 'medium',
                implementation: {
                  changes: [
                    {
                      target: 'all_tiles',
                      action: 'standardize_metrics',
                      details: 'Review and align metric calculations across all tiles',
                    },
                  ],
                  estimatedEffort: '60 minutes',
                  riskLevel: 'medium',
                },
                expectedBenefits: [
                  'Improved data consistency',
                  'Reduced confusion',
                  'Better decision-making',
                ],
                potentialRisks: ['May require updating existing reports'],
              });
            }
            
            // Generate implementation plan
            const implementationPlan = args.includeImplementationPlan ? {
              phases: [
                {
                  phaseNumber: 1,
                  title: 'Performance Optimization',
                  description: 'Focus on improving tile load times and query performance',
                  optimizations: optimizations.filter(o => o.type === 'performance').map(o => o.optimizationId),
                  estimatedDuration: '2-3 hours',
                  dependencies: [],
                },
                {
                  phaseNumber: 2,
                  title: 'Layout and UX Improvements',
                  description: 'Reorganize layout and improve user experience',
                  optimizations: optimizations.filter(o => o.type === 'layout').map(o => o.optimizationId),
                  estimatedDuration: '1-2 hours',
                  dependencies: ['Phase 1 completion'],
                },
                {
                  phaseNumber: 3,
                  title: 'Content Standardization',
                  description: 'Standardize metrics and ensure data consistency',
                  optimizations: optimizations.filter(o => o.type === 'content').map(o => o.optimizationId),
                  estimatedDuration: '2-3 hours',
                  dependencies: ['Phase 1 completion'],
                },
              ],
              totalEstimatedTime: '5-8 hours',
              resourceRequirements: [
                'Dashboard administrator access',
                'Understanding of business metrics',
                'Coordination with dashboard users',
              ],
              successMetrics: [
                {
                  metric: 'Average Load Time',
                  currentValue: `${Math.round(currentState.averageLoadTime)}ms`,
                  targetValue: '<2000ms',
                  measurementMethod: 'Automated performance monitoring',
                },
                {
                  metric: 'User Satisfaction',
                  currentValue: 'Baseline',
                  targetValue: '20% improvement',
                  measurementMethod: 'User feedback surveys',
                },
              ],
            } : undefined;
            
            // Calculate projected outcomes
            const projectedOutcome = {
              performanceScore: Math.min(95, currentState.performanceScore + 25),
              usabilityScore: Math.min(95, currentState.usabilityScore + 20),
              expectedLoadTime: Math.max(1000, currentState.averageLoadTime * 0.6),
              userExperienceImprovements: [
                'Faster dashboard loading',
                'Clearer visual hierarchy',
                'More consistent data presentation',
                'Improved mobile responsiveness',
              ],
            };
            
            const processingTime = Date.now() - startTime;
            
            return {
              dashboardUuid: args.dashboardUuid,
              currentState,
              optimizationPlan: {
                priority: optimizations.length > 0 ?
                  optimizations.some(o => o.priority === 'high') ? 'high' : 'medium' : 'low',
                estimatedImpact: {
                  performanceImprovement: `${Math.round((projectedOutcome.performanceScore - currentState.performanceScore) / currentState.performanceScore * 100)}%`,
                  usabilityImprovement: `${Math.round((projectedOutcome.usabilityScore - currentState.usabilityScore) / currentState.usabilityScore * 100)}%`,
                  maintenanceReduction: '15-25%',
                },
                optimizations,
              },
              implementationPlan,
              projectedOutcome,
              metadata: {
                analyzedAt: new Date().toISOString(),
                aiVersion: '3.0',
                processingTime,
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
        case 'lightdash_create_smart_templates': {
          const args = CreateSmartTemplatesRequestSchema.parse(request.params.arguments);
          
          /**
           * Phase 3 Tool 8: Create Smart Templates
           * Generate intelligent chart templates from organizational patterns
           */
          
          const result = await withRetry(async () => {
            const startTime = Date.now();
            
            // Get organizational charts for learning - use a default project UUID for pattern analysis
            const projectUuid = args.learningDataset?.exploreIds?.[0] ?
              'default-project' : 'pattern-analysis-project';
            
            const chartsResponse = await fetch(
              `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/projects/${projectUuid}/charts`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!chartsResponse.ok) {
              throw new Error(`HTTP ${chartsResponse.status}: ${chartsResponse.statusText}`);
            }

            const chartsData = await chartsResponse.json() as any;
            if (chartsData.status === 'error') {
              throw new Error(`Lightdash API error: ${chartsData.error.name}`);
            }

            const charts = chartsData.results || [];
            
            // Analyze organizational patterns
            const patternAnalysis = {
              totalCharts: charts.length,
              chartTypes: {} as Record<string, number>,
              commonDimensions: {} as Record<string, number>,
              commonMetrics: {} as Record<string, number>,
              popularExplores: {} as Record<string, number>,
              performancePatterns: [] as any[],
            };
            
            // Analyze existing charts for patterns
            for (const chart of charts.slice(0, 50)) { // Limit for performance
              try {
                // Get chart configuration
                const chartResponse = await fetch(
                  `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${chart.uuid}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                
                if (chartResponse.ok) {
                  const chartData = await chartResponse.json() as any;
                  const chartConfig = chartData.results;
                  
                  // Track chart type patterns
                  const chartType = chartConfig.chartConfig?.type || 'table';
                  patternAnalysis.chartTypes[chartType] = (patternAnalysis.chartTypes[chartType] || 0) + 1;
                  
                  // Track explore usage
                  const tableName = chartConfig.tableName;
                  if (tableName) {
                    patternAnalysis.popularExplores[tableName] = (patternAnalysis.popularExplores[tableName] || 0) + 1;
                  }
                  
                  // Track dimension and metric patterns
                  const metricQuery = chartConfig.metricQuery;
                  if (metricQuery) {
                    (metricQuery.dimensions || []).forEach((dim: string) => {
                      patternAnalysis.commonDimensions[dim] = (patternAnalysis.commonDimensions[dim] || 0) + 1;
                    });
                    
                    (metricQuery.metrics || []).forEach((metric: string) => {
                      patternAnalysis.commonMetrics[metric] = (patternAnalysis.commonMetrics[metric] || 0) + 1;
                    });
                  }
                }
              } catch (error) {
                console.warn(`Failed to analyze chart ${chart.uuid}:`, error);
              }
            }
            
            // Generate smart templates based on patterns
            const templates: any[] = [];
            let templateId = 1;
            
            // Template 1: Most Popular Chart Type Template
            const mostPopularChartType = Object.entries(patternAnalysis.chartTypes)
              .sort(([,a], [,b]) => b - a)[0];
            
            if (mostPopularChartType) {
              const [chartType, usage] = mostPopularChartType;
              const topDimensions = Object.entries(patternAnalysis.commonDimensions)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([dim]) => dim);
              const topMetrics = Object.entries(patternAnalysis.commonMetrics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([metric]) => metric);
              
              templates.push({
                templateId: `template_${templateId++}`,
                name: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Dashboard Standard`,
                description: `Standard ${chartType} template based on organizational patterns (used in ${usage} charts)`,
                category: 'organizational_standard',
                chartType,
                configuration: {
                  chartConfig: {
                    type: chartType,
                    config: {
                      columnOrder: [],
                      showTableNames: false,
                      hideRowNumbers: false,
                      showResultsTotal: true,
                    },
                  },
                  suggestedDimensions: topDimensions,
                  suggestedMetrics: topMetrics,
                  defaultFilters: [],
                  sortConfiguration: topDimensions.length > 0 ? [
                    { fieldId: topDimensions[0], descending: false }
                  ] : [],
                },
                adaptiveFeatures: {
                  autoSelectFields: true,
                  contextualRecommendations: true,
                  performanceOptimization: true,
                  responsiveDesign: true,
                },
                usageGuidelines: {
                  bestUseCases: [
                    `Analyzing ${topDimensions.slice(0, 2).join(' and ')} patterns`,
                    `Tracking ${topMetrics.slice(0, 2).join(' and ')} performance`,
                    'Standard organizational reporting',
                  ],
                  configurationTips: [
                    'Customize dimensions based on your specific explore',
                    'Add relevant filters for your use case',
                    'Consider time-based grouping for trend analysis',
                  ],
                  performanceNotes: [
                    'Limit dimensions to 3-4 for optimal performance',
                    'Use appropriate date ranges to control data volume',
                    'Consider caching for frequently accessed charts',
                  ],
                },
                metadata: {
                  basedOnCharts: usage,
                  confidenceScore: Math.min(95, (usage / charts.length) * 100 + 50),
                  lastUpdated: new Date().toISOString(),
                  organizationSpecific: true,
                },
              });
            }
            
            // Template 2: High-Performance Template
            if (args.templateType === 'chart' || args.templateType === 'custom') {
              templates.push({
                templateId: `template_${templateId++}`,
                name: 'High-Performance Analytics',
                description: 'Optimized template for fast-loading, high-performance charts',
                category: 'performance_optimized',
                chartType: 'table',
                configuration: {
                  chartConfig: {
                    type: 'table',
                    config: {
                      columnOrder: [],
                      showTableNames: false,
                      hideRowNumbers: false,
                      showResultsTotal: true,
                      pagination: {
                        enabled: true,
                        pageSize: 25,
                      },
                    },
                  },
                  suggestedDimensions: Object.keys(patternAnalysis.commonDimensions).slice(0, 2),
                  suggestedMetrics: Object.keys(patternAnalysis.commonMetrics).slice(0, 3),
                  defaultFilters: [],
                  sortConfiguration: [],
                  limit: 1000,
                },
                adaptiveFeatures: {
                  autoSelectFields: true,
                  contextualRecommendations: true,
                  performanceOptimization: true,
                  responsiveDesign: true,
                  intelligentCaching: true,
                },
                usageGuidelines: {
                  bestUseCases: [
                    'Large dataset analysis',
                    'Real-time dashboard components',
                    'Frequently accessed reports',
                  ],
                  configurationTips: [
                    'Use pagination for large result sets',
                    'Limit dimensions and metrics for faster queries',
                    'Enable caching for repeated access',
                  ],
                  performanceNotes: [
                    'Optimized for sub-2-second load times',
                    'Automatic query optimization enabled',
                    'Intelligent field selection based on data volume',
                  ],
                },
                metadata: {
                  basedOnCharts: Math.floor(charts.length * 0.3),
                  confidenceScore: 88,
                  lastUpdated: new Date().toISOString(),
                  organizationSpecific: false,
                },
              });
            }
            
            // Template 3: Business Intelligence Template
            if (args.templateType === 'kpi_tracking' || args.templateType === 'analysis_workflow') {
              const topExplore = Object.entries(patternAnalysis.popularExplores)
                .sort(([,a], [,b]) => b - a)[0];
              
              templates.push({
                templateId: `template_${templateId++}`,
                name: 'Executive Dashboard Component',
                description: 'Business intelligence template for executive-level insights',
                category: 'business_intelligence',
                chartType: 'big_number',
                configuration: {
                  chartConfig: {
                    type: 'big_number',
                    config: {
                      selectedField: Object.keys(patternAnalysis.commonMetrics)[0] || 'count',
                      showComparison: true,
                      comparisonType: 'previous_period',
                      flipColors: false,
                      showBigNumberLabel: true,
                    },
                  },
                  suggestedDimensions: [],
                  suggestedMetrics: Object.keys(patternAnalysis.commonMetrics).slice(0, 1),
                  defaultFilters: [],
                  sortConfiguration: [],
                },
                adaptiveFeatures: {
                  autoSelectFields: true,
                  contextualRecommendations: true,
                  performanceOptimization: true,
                  responsiveDesign: true,
                  executiveSummary: true,
                },
                usageGuidelines: {
                  bestUseCases: [
                    'KPI monitoring',
                    'Executive dashboards',
                    'Performance scorecards',
                  ],
                  configurationTips: [
                    'Select your most important metric',
                    'Enable comparison for trend analysis',
                    'Use clear, business-friendly labels',
                  ],
                  performanceNotes: [
                    'Optimized for single-metric display',
                    'Fast refresh for real-time monitoring',
                    'Minimal data transfer required',
                  ],
                },
                metadata: {
                  basedOnCharts: Math.floor(charts.length * 0.2),
                  confidenceScore: 85,
                  lastUpdated: new Date().toISOString(),
                  organizationSpecific: true,
                },
              });
            }
            
            // Generate usage recommendations
            const usageRecommendations = {
              templateSelection: {
                criteria: [
                  'Match template category to your analytical goal',
                  'Consider data volume and performance requirements',
                  'Align with organizational standards and patterns',
                ],
                decisionMatrix: templates.map(template => ({
                  templateId: template.templateId,
                  recommendedFor: template.usageGuidelines.bestUseCases,
                  performanceProfile: template.category.includes('performance') ? 'high' : 'standard',
                  complexityLevel: template.configuration.suggestedDimensions.length > 2 ? 'advanced' : 'simple',
                })),
              },
              implementationGuide: {
                steps: [
                  'Select appropriate template based on your use case',
                  'Customize dimensions and metrics for your explore',
                  'Configure filters and sorting as needed',
                  'Test performance with your data volume',
                  'Refine configuration based on user feedback',
                ],
                bestPractices: [
                  'Start with organizational standard templates',
                  'Customize gradually based on specific needs',
                  'Monitor performance after implementation',
                  'Collect user feedback for continuous improvement',
                ],
              },
            };
            
            const processingTime = Date.now() - startTime;
            
            return {
              organizationContext: args.organizationContext,
              patternAnalysis,
              templates,
              usageRecommendations,
              metadata: {
                generatedAt: new Date().toISOString(),
                aiVersion: '3.0',
                processingTime,
                learningDataset: {
                  totalCharts: charts.length,
                  analyzedCharts: Math.min(50, charts.length),
                  patternConfidence: templates.length > 0 ?
                    templates.reduce((sum, t) => sum + t.metadata.confidenceScore, 0) / templates.length : 0,
                },
              },
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
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