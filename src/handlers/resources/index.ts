/**
 * Resource handlers for MCP server
 * Handles URI-based read-only access to Lightdash data
 */

import { ReadResourceRequest, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { lightdashClient } from '../../client/lightdash-client.js';
import { withRetry } from '../../utils/retry.js';
import { getCachedResult, setCachedResult } from '../../utils/cache.js';
import { generateOptimizationSuggestions } from '../../utils/optimization.js';
import { calculateQueryComplexityScore } from '../../utils/performance.js';

/**
 * Handle project catalog resource
 */
export async function handleProjectCatalogResource(
  projectUuid: string,
  queryParams: URLSearchParams,
  uri: string
) {
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

/**
 * Handle explore schema resource
 */
export async function handleExploreSchemaResource(
  projectUuid: string,
  exploreId: string,
  uri: string
) {
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

/**
 * Handle dashboard resource
 */
export async function handleDashboardResource(
  dashboardUuid: string,
  uri: string
) {
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

/**
 * Handle chart resource with optional analysis
 */
export async function handleChartResource(
  chartUuid: string,
  queryParams: URLSearchParams,
  uri: string
) {
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

/**
 * Handle project chart analytics resource
 */
export async function handleProjectChartAnalyticsResource(
  projectUuid: string,
  queryParams: URLSearchParams,
  uri: string
) {
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

/**
 * Handle explore optimization suggestions resource
 */
export async function handleExploreOptimizationSuggestionsResource(
  exploreId: string,
  queryParams: URLSearchParams,
  uri: string
) {
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

/**
 * Main resource handler function
 * Routes resource requests to appropriate handlers
 */
export async function handleResourceRequest(request: ReadResourceRequest) {
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
      return await handleProjectCatalogResource(projectUuid, queryParams, uri);
    }
    
    if (pathParts[0] === 'projects' && pathParts.length >= 5 && pathParts[2] === 'explores' && pathParts[4] === 'schema') {
      // lightdash://projects/{projectUuid}/explores/{exploreId}/schema
      const projectUuid = pathParts[1];
      const exploreId = pathParts[3];
      return await handleExploreSchemaResource(projectUuid, exploreId, uri);
    }
    
    if (pathParts[0] === 'dashboards' && pathParts.length >= 2) {
      // lightdash://dashboards/{dashboardUuid}
      const dashboardUuid = pathParts[1];
      return await handleDashboardResource(dashboardUuid, uri);
    }
    
    if (pathParts[0] === 'charts' && pathParts.length >= 2) {
      // lightdash://charts/{chartUuid}
      const chartUuid = pathParts[1];
      return await handleChartResource(chartUuid, queryParams, uri);
    }
    
    if (pathParts[0] === 'projects' && pathParts.length >= 3 && pathParts[2] === 'chart-analytics') {
      // lightdash://projects/{projectUuid}/chart-analytics
      const projectUuid = pathParts[1];
      return await handleProjectChartAnalyticsResource(projectUuid, queryParams, uri);
    }
    
    if (pathParts[0] === 'explores' && pathParts.length >= 3 && pathParts[2] === 'optimization-suggestions') {
      // lightdash://explores/{exploreId}/optimization-suggestions
      const exploreId = pathParts[1];
      return await handleExploreOptimizationSuggestionsResource(exploreId, queryParams, uri);
    }
    
    throw new McpError(ErrorCode.InvalidParams, `Unsupported resource path: ${pathWithQuery}`);
    
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${errorMessage}`);
  }
}

/**
 * Resource definitions for the MCP server
 */
export const resourceDefinitions = [
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
];