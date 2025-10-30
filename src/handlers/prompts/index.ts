/**
 * Prompt handlers for MCP server
 * Provides guided workflow templates and conversational interfaces
 */

import { GetPromptRequest, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Handle analyze-metric prompt
 */
export function handleAnalyzeMetricPrompt(args: Record<string, any> = {}) {
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

/**
 * Handle find-and-explore prompt
 */
export function handleFindAndExplorePrompt(args: Record<string, any> = {}) {
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

/**
 * Handle dashboard-deep-dive prompt
 */
export function handleDashboardDeepDivePrompt(args: Record<string, any> = {}) {
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

/**
 * Handle chart-performance-optimizer prompt
 */
export function handleChartPerformanceOptimizerPrompt(args: Record<string, any> = {}) {
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

/**
 * Handle intelligent-chart-advisor prompt
 */
export function handleIntelligentChartAdvisorPrompt(args: Record<string, any> = {}) {
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

/**
 * Main prompt handler function
 * Routes prompt requests to appropriate handlers
 */
export async function handlePromptRequest(request: GetPromptRequest) {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'analyze-metric':
        return handleAnalyzeMetricPrompt(args);
        
      case 'find-and-explore':
        return handleFindAndExplorePrompt(args);
        
      case 'dashboard-deep-dive':
        return handleDashboardDeepDivePrompt(args);
        
      case 'chart-performance-optimizer':
        return handleChartPerformanceOptimizerPrompt(args);
        
      case 'intelligent-chart-advisor':
        return handleIntelligentChartAdvisorPrompt(args);
        
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
}

/**
 * Prompt definitions for the MCP server
 */
export const promptDefinitions = [
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
];