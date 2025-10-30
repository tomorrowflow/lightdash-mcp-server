/**
 * Chart Intelligence and Optimization tool handlers
 * Handles advanced chart analysis, optimization, and AI-powered recommendations
 */

import { lightdashClient } from '../../client/lightdash-client.js';
import { withRetry } from '../../utils/retry.js';
import {
  calculateQueryComplexityScore,
  predictQueryPerformance,
  calculateStatisticalMetrics
} from '../../utils/performance.js';
import { generateOptimizationSuggestions } from '../../utils/optimization.js';
import {
  analyzeDataCharacteristics,
  calculateRecommendationScore,
  interpretAnalyticalGoal
} from '../../utils/ai-algorithms.js';
import { getCachedResult, setCachedResult } from '../../utils/cache.js';
import {
  AnalyzeChartPerformanceRequestSchema,
  ExtractChartPatternsRequestSchema,
  DiscoverChartRelationshipsRequestSchema,
  OptimizeChartQueryRequestSchema,
  BenchmarkChartVariationsRequestSchema,
  GenerateChartRecommendationsRequestSchema,
  AutoOptimizeDashboardRequestSchema,
  CreateSmartTemplatesRequestSchema,
} from '../../schemas.js';

/**
 * Handle lightdash_analyze_chart_performance tool
 */
export async function handleAnalyzeChartPerformance(args: any) {
  const parsedArgs = AnalyzeChartPerformanceRequestSchema.parse(args);
  
  const result = await withRetry(async () => {
    // Get chart configuration
    const chartResponse = await fetch(
      `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${parsedArgs.chartUuid}`,
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
      `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${parsedArgs.chartUuid}/results`,
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
      chartUuid: parsedArgs.chartUuid,
      chartName: chart.name,
      chartType: chart.chartConfig?.type || 'table',
      exploreId: chart.tableName,
      performance: {
        chartUuid: parsedArgs.chartUuid,
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
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_extract_chart_patterns tool
 */
export async function handleExtractChartPatterns(args: any) {
  const parsedArgs = ExtractChartPatternsRequestSchema.parse(args);
  
  const result = await withRetry(async () => {
    const patterns: any[] = [];
    const chartConfigs: any[] = [];

    // Fetch all chart configurations
    for (const chartUuid of parsedArgs.chartUuids) {
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
        if (parsedArgs.patternType && patternType !== parsedArgs.patternType) {
          return;
        }

        // Calculate confidence based on how many charts share the pattern
        const confidence = charts.length / parsedArgs.chartUuids.length;

        if (confidence >= (parsedArgs.minConfidence || 0.7)) {
          // Get most common chart type for this pattern
          const patternChartTypes = charts.map(c => c.config.chartConfig?.type || 'table');
          const mostCommonChartType = patternChartTypes.reduce((a, b, _, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          );

          // Create example charts
          const examples = parsedArgs.includeExamples ? charts.slice(0, 3).map(chart => ({
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
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_discover_chart_relationships tool
 */
export async function handleDiscoverChartRelationships(args: any) {
  const parsedArgs = DiscoverChartRelationshipsRequestSchema.parse(args);
  
  const result = await withRetry(async () => {
    // Get source chart configuration
    const sourceChartResponse = await fetch(
      `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/saved/${parsedArgs.chartUuid}`,
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
      if (chart.uuid === parsedArgs.chartUuid) continue; // Skip self

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
        if (parsedArgs.relationshipType !== 'all' && !relationshipTypes.includes(parsedArgs.relationshipType)) {
          continue;
        }

        // Filter by minimum strength
        if (relationshipStrength < (parsedArgs.minStrength || 0.3)) {
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
    const limitedRelationships = relationships.slice(0, parsedArgs.maxResults || 25);

    // Calculate summary statistics
    const strongRelationships = limitedRelationships.filter(r => r.strength > 0.6).length;
    const weakRelationships = limitedRelationships.filter(r => r.strength <= 0.4).length;
    const criticalDependencies = limitedRelationships.filter(r => r.impactAnalysis.changeRisk === 'high').length;

    return {
      sourceChartUuid: parsedArgs.chartUuid,
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
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// Additional optimization and AI recommendation tools are handled in separate files
// These will be imported in the main tool handler index