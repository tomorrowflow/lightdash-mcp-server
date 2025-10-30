/**
 * Tool handlers index
 * Centralized imports and registry for all tool handler functions
 */

// Import all tool handlers
import * as basicTools from './basic-tools.js';
import * as queryTools from './query-tools.js';
import * as chartIntelligenceTools from './chart-intelligence-tools.js';
import * as optimizationTools from './optimization-tools.js';
import * as aiRecommendationTools from './ai-recommendation-tools.js';

// Re-export all handlers for direct access
export * from './basic-tools.js';
export * from './query-tools.js';
export * from './chart-intelligence-tools.js';
export * from './optimization-tools.js';
export * from './ai-recommendation-tools.js';

/**
 * Tool handler registry
 * Maps tool names to their handler functions
 */
export const toolHandlers = {
  // Basic API tools
  'lightdash_list_projects': basicTools.handleListProjects,
  'lightdash_get_project': basicTools.handleGetProject,
  'lightdash_list_spaces': basicTools.handleListSpaces,
  'lightdash_list_charts': basicTools.handleListCharts,
  'lightdash_list_dashboards': basicTools.handleListDashboards,
  'lightdash_get_custom_metrics': basicTools.handleGetCustomMetrics,
  'lightdash_get_catalog': basicTools.handleGetCatalog,
  'lightdash_get_metrics_catalog': basicTools.handleGetMetricsCatalog,
  'lightdash_get_charts_as_code': basicTools.handleGetChartsAsCode,
  'lightdash_get_dashboards_as_code': basicTools.handleGetDashboardsAsCode,
  'lightdash_get_metadata': basicTools.handleGetMetadata,
  'lightdash_get_analytics': basicTools.handleGetAnalytics,
  'lightdash_get_user_attributes': basicTools.handleGetUserAttributes,

  // Query tools
  'lightdash_run_underlying_data_query': queryTools.handleRunUnderlyingDataQuery,
  'lightdash_get_catalog_search': queryTools.handleGetCatalogSearch,
  'lightdash_get_explore_with_full_schema': queryTools.handleGetExploreWithFullSchema,
  'lightdash_get_explores_summary': queryTools.handleGetExploresSummary,
  'lightdash_get_saved_chart_results': queryTools.handleGetSavedChartResults,
  'lightdash_get_dashboard_by_uuid': queryTools.handleGetDashboardByUuid,

  // Chart intelligence tools
  'lightdash_analyze_chart_performance': chartIntelligenceTools.handleAnalyzeChartPerformance,
  'lightdash_extract_chart_patterns': chartIntelligenceTools.handleExtractChartPatterns,
  'lightdash_discover_chart_relationships': chartIntelligenceTools.handleDiscoverChartRelationships,

  // Optimization tools
  'lightdash_optimize_chart_query': optimizationTools.handleOptimizeChartQuery,
  'lightdash_benchmark_chart_variations': optimizationTools.handleBenchmarkChartVariations,

  // AI recommendation tools
  'lightdash_generate_chart_recommendations': aiRecommendationTools.handleGenerateChartRecommendations,
  'lightdash_auto_optimize_dashboard': aiRecommendationTools.handleAutoOptimizeDashboard,
  'lightdash_create_smart_templates': aiRecommendationTools.handleCreateSmartTemplates,
} as const;

/**
 * Get tool handler by name
 */
export function getToolHandler(toolName: string) {
  return toolHandlers[toolName as keyof typeof toolHandlers];
}

/**
 * Check if tool handler exists
 */
export function hasToolHandler(toolName: string): boolean {
  return toolName in toolHandlers;
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(): string[] {
  return Object.keys(toolHandlers);
}