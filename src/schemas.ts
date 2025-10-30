import { z } from 'zod';

export const ListProjectsRequestSchema = z.object({});

export const GetProjectRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListSpacesRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListChartsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListDashboardsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCustomMetricsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCatalogRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetricsCatalogRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetChartsAsCodeRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetDashboardsAsCodeRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetadataRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string().min(1, 'Table name cannot be empty'),
});

export const GetAnalyticsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string(),
});

export const GetUserAttributesRequestSchema = z.object({});

export const GetCatalogSearchRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  search: z
    .string()
    .optional()
    .describe('Search term to filter catalog items by name, label, or description'),
  type: z
    .enum(['field', 'table', 'dashboard', 'space', 'chart'])
    .optional()
    .describe('Filter results by catalog item type'),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Maximum number of results to return (default: 100, max: 1000)'),
  page: z
    .number()
    .min(1)
    .optional()
    .default(1)
    .describe('Page number for pagination (default: 1)'),
});

// Filter group schema for complex filtering
const FilterGroupSchema = z.object({
  id: z.string(),
  and: z.array(z.object({
    id: z.string(),
    target: z.object({
      fieldId: z.string(),
    }),
    operator: z.string(),
    values: z.array(z.union([z.string(), z.number(), z.boolean()])),
  })).optional(),
  or: z.array(z.object({
    id: z.string(),
    target: z.object({
      fieldId: z.string(),
    }),
    operator: z.string(),
    values: z.array(z.union([z.string(), z.number(), z.boolean()])),
  })).optional(),
});

// Sort schema
const SortSchema = z.object({
  fieldId: z.string().describe('The field ID to sort by'),
  descending: z.boolean().describe('Whether to sort in descending order'),
});

export const RunUnderlyingDataQueryRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  exploreId: z
    .string()
    .min(1, 'Explore ID cannot be empty')
    .describe('The explore/table name to query'),
  dimensions: z
    .array(z.string())
    .optional()
    .describe('Array of dimension field IDs to include in the query'),
  metrics: z
    .array(z.string())
    .optional()
    .describe('Array of metric field IDs to include in the query'),
  filters: z
    .object({
      dimensions: FilterGroupSchema.optional(),
      metrics: FilterGroupSchema.optional(),
    })
    .optional()
    .describe('Filters to apply to dimensions and metrics'),
  sorts: z
    .array(SortSchema)
    .optional()
    .describe('Sort configuration for the query results'),
  limit: z
    .number()
    .min(1)
    .max(5000)
    .optional()
    .default(500)
    .describe('Maximum number of rows to return (default: 500, max: 5000)'),
  tableCalculations: z
    .array(z.any())
    .optional()
    .describe('Custom table calculations to include'),
});

export const GetExploreWithFullSchemaRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  exploreId: z
    .string()
    .min(1, 'Explore ID cannot be empty')
    .describe('The ID/name of the explore to get the full schema for'),
});

export const GetExploresSummaryRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
});

export const GetSavedChartResultsRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the saved chart to get results from'),
  invalidateCache: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to force refresh the cache (default: false)'),
  dashboardFilters: z
    .object({
      dimensions: z.array(z.any()).optional(),
      metrics: z.array(z.any()).optional(),
    })
    .optional()
    .describe('Optional dashboard filters to override'),
  dateZoomGranularity: z
    .string()
    .optional()
    .describe('Optional time granularity for date zoom'),
});

export const GetDashboardByUuidRequestSchema = z.object({
  dashboardUuid: z
    .string()
    .uuid()
    .describe('The UUID of the dashboard to retrieve'),
});

// ============================================================================
// CHART INTELLIGENCE & OPTIMIZATION PLATFORM - PHASE 1 SCHEMAS
// ============================================================================

/**
 * Filter operators supported by Lightdash for chart analysis and optimization.
 * These operators are used in filter configurations and optimization recommendations.
 *
 * @enum {string}
 * @readonly
 */
export const FilterOperator = z.enum([
  'equals',
  'notEquals',
  'lessThan',
  'lessThanOrEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'include',
  'notInclude',
  'startsWith',
  'endsWith',
  'contains',
  'doesNotContain',
  'isNull',
  'isNotNull',
  'inThePast',
  'notInThePast',
  'inTheNext',
  'notInTheNext',
  'inTheCurrent',
  'notInTheCurrent',
  'inBetween',
  'notInBetween',
]);

/**
 * Performance threshold levels for chart analysis.
 * Used to categorize query execution times and provide appropriate optimization recommendations.
 *
 * @enum {string}
 * @readonly
 * @example
 * // Usage in performance analysis
 * const threshold = executionTime < 1000 ? 'fast' :
 *                  executionTime < 5000 ? 'moderate' :
 *                  executionTime < 15000 ? 'slow' : 'very_slow';
 */
export const PerformanceThreshold = z.enum([
  'fast',      // < 1 second - Excellent performance
  'moderate',  // 1-5 seconds - Acceptable performance
  'slow',      // 5-15 seconds - Needs optimization
  'very_slow', // > 15 seconds - Critical performance issues
]);

/**
 * Chart pattern types for template extraction and classification.
 * These patterns help identify common chart structures and generate reusable templates.
 *
 * @enum {string}
 * @readonly
 * @example
 * // Pattern detection based on chart configuration
 * const patternType = hasTimeField ? 'time_series' :
 *                    singleMetric && multipleDimensions ? 'metric_breakdown' : 'custom';
 */
export const ChartPatternType = z.enum([
  'metric_breakdown',    // Single metric broken down by dimensions (most common)
  'time_series',        // Time-based analysis with date/time dimensions
  'comparison',         // Comparative analysis with multiple metrics
  'funnel',            // Funnel analysis for conversion tracking
  'cohort',            // Cohort analysis for user behavior
  'distribution',      // Distribution analysis for statistical insights
  'correlation',       // Correlation analysis between metrics
  'custom',            // Custom or unclassified patterns
]);

/**
 * Chart relationship types for dependency analysis and impact assessment.
 * Used to discover connections between charts and assess change impact.
 *
 * @enum {string}
 * @readonly
 * @example
 * // Finding charts with shared metrics
 * const relationships = await discoverChartRelationships(chartUuid, 'shared_metrics');
 */
export const ChartRelationshipType = z.enum([
  'shared_explore',     // Charts using the same explore/table (strong relationship)
  'shared_metrics',     // Charts using the same metrics (medium relationship)
  'shared_dimensions',  // Charts using the same dimensions (medium relationship)
  'shared_filters',     // Charts using similar filters (weak relationship)
  'dashboard_siblings', // Charts appearing on the same dashboard (contextual relationship)
  'all',               // All relationship types (comprehensive analysis)
]);

/**
 * Performance analysis result schema
 */
export const PerformanceAnalysisSchema = z.object({
  chartUuid: z.string().uuid(),
  queryExecutionTime: z.number().describe('Query execution time in milliseconds'),
  dataFreshness: z.number().describe('Data age in minutes'),
  rowCount: z.number().describe('Number of rows returned'),
  columnCount: z.number().describe('Number of columns in result'),
  performanceScore: z.number().min(0).max(100).describe('Performance score (0-100)'),
  threshold: PerformanceThreshold,
  bottlenecks: z.array(z.string()).describe('Identified performance bottlenecks'),
  recommendations: z.array(z.object({
    type: z.enum(['filter', 'limit', 'dimension', 'metric', 'query']),
    priority: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    estimatedImprovement: z.string().describe('Expected performance improvement'),
  })),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    analysisVersion: z.string().default('1.0'),
  }),
});

/**
 * Chart analysis comprehensive result schema
 */
export const ChartAnalysisSchema = z.object({
  chartUuid: z.string().uuid(),
  chartName: z.string(),
  chartType: z.string(),
  exploreId: z.string(),
  performance: PerformanceAnalysisSchema,
  configuration: z.object({
    dimensionCount: z.number(),
    metricCount: z.number(),
    filterCount: z.number(),
    sortCount: z.number(),
    hasTableCalculations: z.boolean(),
    hasCustomMetrics: z.boolean(),
  }),
  usage: z.object({
    lastViewed: z.string().datetime().optional(),
    viewCount: z.number().optional(),
    dashboardCount: z.number().describe('Number of dashboards containing this chart'),
  }),
  quality: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.object({
      type: z.enum(['performance', 'configuration', 'data_quality', 'best_practice']),
      severity: z.enum(['critical', 'warning', 'info']),
      message: z.string(),
      suggestion: z.string().optional(),
    })),
  }),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    analysisVersion: z.string().default('1.0'),
  }),
});

/**
 * Chart pattern extraction result schema
 */
export const ChartPatternSchema = z.object({
  patternId: z.string(),
  patternType: ChartPatternType,
  name: z.string(),
  description: z.string(),
  frequency: z.number().describe('How often this pattern appears'),
  confidence: z.number().min(0).max(1).describe('Confidence score for pattern match'),
  template: z.object({
    exploreId: z.string(),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
    filters: z.array(z.object({
      fieldId: z.string(),
      operator: FilterOperator,
      values: z.array(z.union([z.string(), z.number(), z.boolean()])),
    })),
    sorts: z.array(z.object({
      fieldId: z.string(),
      descending: z.boolean(),
    })),
    chartConfig: z.object({
      type: z.string(),
      options: z.record(z.any()).optional(),
    }),
  }),
  examples: z.array(z.object({
    chartUuid: z.string().uuid(),
    chartName: z.string(),
    similarity: z.number().min(0).max(1),
  })),
  metadata: z.object({
    extractedAt: z.string().datetime(),
    sourceChartCount: z.number(),
    extractionVersion: z.string().default('1.0'),
  }),
});

/**
 * Query optimization suggestion schema
 */
export const QueryOptimizationSchema = z.object({
  chartUuid: z.string().uuid(),
  currentPerformance: z.object({
    executionTime: z.number(),
    rowCount: z.number(),
    score: z.number().min(0).max(100),
  }),
  optimizations: z.array(z.object({
    type: z.enum(['add_filter', 'remove_dimension', 'limit_rows', 'optimize_metric', 'cache_strategy']),
    priority: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    implementation: z.string(),
    estimatedImprovement: z.object({
      timeReduction: z.string(),
      scoreIncrease: z.number(),
    }),
    tradeoffs: z.array(z.string()).optional(),
  })),
  projectedPerformance: z.object({
    executionTime: z.number(),
    score: z.number().min(0).max(100),
    improvement: z.string(),
  }),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    optimizationVersion: z.string().default('1.0'),
  }),
});

/**
 * Chart relationship analysis schema
 */
export const ChartRelationshipSchema = z.object({
  sourceChartUuid: z.string().uuid(),
  relationships: z.array(z.object({
    relatedChartUuid: z.string().uuid(),
    relatedChartName: z.string(),
    relationshipType: ChartRelationshipType,
    strength: z.number().min(0).max(1).describe('Relationship strength score'),
    commonElements: z.object({
      exploreId: z.string().optional(),
      sharedMetrics: z.array(z.string()),
      sharedDimensions: z.array(z.string()),
      sharedFilters: z.array(z.string()),
      dashboards: z.array(z.string()),
    }),
    impactAnalysis: z.object({
      changeRisk: z.enum(['low', 'medium', 'high']),
      affectedDashboards: z.array(z.string()),
      dependentCharts: z.number(),
    }),
  })),
  summary: z.object({
    totalRelatedCharts: z.number(),
    strongRelationships: z.number(),
    weakRelationships: z.number(),
    criticalDependencies: z.number(),
  }),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    analysisVersion: z.string().default('1.0'),
  }),
});

// ============================================================================
// REQUEST SCHEMAS FOR NEW CHART INTELLIGENCE TOOLS
// ============================================================================

/**
 * Request schema for chart performance analysis
 */
export const AnalyzeChartPerformanceRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the chart to analyze for performance'),
  performanceThreshold: PerformanceThreshold
    .optional()
    .default('moderate')
    .describe('Performance threshold for analysis (default: moderate)'),
  includeOptimizations: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include optimization recommendations (default: true)'),
});

/**
 * Request schema for chart pattern extraction
 */
export const ExtractChartPatternsRequestSchema = z.object({
  chartUuids: z
    .array(z.string().uuid())
    .min(1)
    .max(50)
    .describe('Array of chart UUIDs to analyze for patterns (max 50)'),
  patternType: ChartPatternType
    .optional()
    .describe('Specific pattern type to extract (optional, extracts all if not specified)'),
  minConfidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.7)
    .describe('Minimum confidence score for pattern matching (default: 0.7)'),
  includeExamples: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include example charts for each pattern (default: true)'),
});

/**
 * Request schema for chart relationship discovery
 */
export const DiscoverChartRelationshipsRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the chart to find relationships for'),
  relationshipType: ChartRelationshipType
    .optional()
    .default('all')
    .describe('Type of relationships to discover (default: all)'),
  minStrength: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.3)
    .describe('Minimum relationship strength score (default: 0.3)'),
  includeImpactAnalysis: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include impact analysis for changes (default: true)'),
  maxResults: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .describe('Maximum number of related charts to return (default: 25)'),
});

// ============================================================================
// PHASE 3: AI-POWERED RECOMMENDATION SCHEMAS
// ============================================================================

/**
 * Analytical goal types for AI-powered chart recommendations
 */
export const AnalyticalGoal = z.enum([
  'trend_analysis',        // Analyze trends over time
  'performance_tracking',  // Track KPIs and metrics
  'comparison',           // Compare different segments or periods
  'distribution',         // Understand data distribution
  'correlation',          // Find relationships between variables
  'anomaly_detection',    // Identify outliers and anomalies
  'forecasting',          // Predict future values
  'segmentation',         // Group and categorize data
  'funnel_analysis',      // Analyze conversion funnels
  'cohort_analysis',      // Analyze user behavior over time
  'custom',               // Custom analytical requirements
]);

/**
 * Chart recommendation confidence levels
 */
export const RecommendationConfidence = z.enum([
  'very_high',  // 90-100% confidence
  'high',       // 75-89% confidence
  'medium',     // 50-74% confidence
  'low',        // 25-49% confidence
  'very_low',   // 0-24% confidence
]);

/**
 * Dashboard optimization goals
 */
export const DashboardOptimizationGoal = z.enum([
  'performance',          // Optimize for speed and responsiveness
  'user_experience',      // Optimize for usability and clarity
  'data_accuracy',        // Optimize for data quality and accuracy
  'maintenance',          // Optimize for easier maintenance
  'scalability',          // Optimize for future growth
  'comprehensive',        // Balanced optimization across all areas
]);

/**
 * Template adaptation strategies
 */
export const TemplateAdaptationStrategy = z.enum([
  'conservative',         // Minimal changes, preserve structure
  'adaptive',            // Moderate changes based on context
  'innovative',          // Creative adaptations with new approaches
  'data_driven',         // Adaptations based on data characteristics
  'user_focused',        // Adaptations based on user behavior patterns
]);

/**
 * AI recommendation reasoning types
 */
export const RecommendationReasoning = z.enum([
  'pattern_based',       // Based on identified patterns
  'performance_based',   // Based on performance analysis
  'best_practice',       // Based on industry best practices
  'data_characteristics', // Based on data structure and content
  'user_behavior',       // Based on user interaction patterns
  'statistical',         // Based on statistical analysis
  'ml_prediction',       // Based on machine learning predictions
]);

/**
 * Request schema for AI-powered chart recommendations
 */
export const GenerateChartRecommendationsRequestSchema = z.object({
  exploreId: z
    .string()
    .min(1)
    .describe('The explore/table to generate recommendations for'),
  analyticalGoal: AnalyticalGoal
    .optional()
    .default('custom')
    .describe('The primary analytical goal for the recommendations'),
  dataContext: z
    .object({
      timeRange: z.string().optional().describe('Preferred time range for analysis'),
      keyMetrics: z.array(z.string()).optional().describe('Important metrics to focus on'),
      keyDimensions: z.array(z.string()).optional().describe('Important dimensions to include'),
      businessContext: z.string().optional().describe('Business context or domain'),
      userRole: z.string().optional().describe('User role or expertise level'),
    })
    .optional()
    .describe('Additional context about the data and use case'),
  preferredChartTypes: z
    .array(z.string())
    .optional()
    .describe('Preferred chart types (e.g., "line", "bar", "table")'),
  maxRecommendations: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Maximum number of recommendations to generate'),
  includeImplementationGuidance: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include step-by-step implementation guidance'),
});

/**
 * Request schema for automated dashboard optimization
 */
export const AutoOptimizeDashboardRequestSchema = z.object({
  dashboardUuid: z
    .string()
    .uuid()
    .describe('The UUID of the dashboard to optimize'),
  optimizationGoals: z
    .array(DashboardOptimizationGoal)
    .min(1)
    .describe('Primary optimization goals'),
  userBehaviorData: z
    .object({
      viewPatterns: z.array(z.object({
        tileId: z.string(),
        viewCount: z.number(),
        averageViewTime: z.number(),
        interactionRate: z.number(),
      })).optional().describe('User interaction patterns with dashboard tiles'),
      commonFilters: z.array(z.object({
        fieldId: z.string(),
        values: z.array(z.string()),
        frequency: z.number(),
      })).optional().describe('Commonly used filters'),
      performanceIssues: z.array(z.object({
        tileId: z.string(),
        issueType: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
      })).optional().describe('Known performance issues'),
    })
    .optional()
    .describe('User behavior and interaction data'),
  constraints: z
    .object({
      preserveLayout: z.boolean().optional().default(false).describe('Whether to preserve current layout'),
      maxTiles: z.number().optional().describe('Maximum number of tiles allowed'),
      requiredTiles: z.array(z.string()).optional().describe('Tile UUIDs that must be preserved'),
    })
    .optional()
    .describe('Optimization constraints'),
  includeImplementationPlan: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include detailed implementation plan'),
});

/**
 * Request schema for smart template creation
 */
export const CreateSmartTemplatesRequestSchema = z.object({
  organizationContext: z
    .object({
      industry: z.string().optional().describe('Industry or business domain'),
      teamSize: z.number().optional().describe('Size of the analytics team'),
      dataMaturity: z.enum(['basic', 'intermediate', 'advanced']).optional().describe('Data analytics maturity level'),
      commonUseCases: z.array(z.string()).optional().describe('Common analytical use cases'),
      preferredVisualizationStyle: z.string().optional().describe('Preferred visualization style or standards'),
    })
    .optional()
    .describe('Organizational context for template generation'),
  templateType: z
    .enum(['dashboard', 'chart', 'analysis_workflow', 'kpi_tracking', 'custom'])
    .optional()
    .default('chart')
    .describe('Type of template to generate'),
  learningDataset: z
    .object({
      chartUuids: z.array(z.string().uuid()).optional().describe('Chart UUIDs to learn from'),
      dashboardUuids: z.array(z.string().uuid()).optional().describe('Dashboard UUIDs to learn from'),
      exploreIds: z.array(z.string()).optional().describe('Explores to analyze for patterns'),
      timeRange: z.string().optional().describe('Time range for learning data'),
    })
    .optional()
    .describe('Dataset to learn patterns from'),
  adaptationStrategy: TemplateAdaptationStrategy
    .optional()
    .default('adaptive')
    .describe('Strategy for adapting templates to different contexts'),
  maxTemplates: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(15)
    .describe('Maximum number of templates to generate'),
  includeUsageGuidelines: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include usage guidelines and best practices'),
});

/**
 * Chart recommendation schema
 */
export const ChartRecommendationSchema = z.object({
  recommendationId: z.string(),
  title: z.string(),
  description: z.string(),
  analyticalGoal: AnalyticalGoal,
  confidence: RecommendationConfidence,
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.object({
    type: RecommendationReasoning,
    explanation: z.string(),
    supportingEvidence: z.array(z.string()),
    dataCharacteristics: z.array(z.string()),
  }),
  chartConfiguration: z.object({
    chartType: z.string(),
    exploreId: z.string(),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
    filters: z.array(z.object({
      fieldId: z.string(),
      operator: z.string(),
      values: z.array(z.union([z.string(), z.number(), z.boolean()])),
      reasoning: z.string(),
    })),
    sorts: z.array(z.object({
      fieldId: z.string(),
      descending: z.boolean(),
      reasoning: z.string(),
    })),
    chartOptions: z.record(z.any()).optional(),
  }),
  implementationGuidance: z.object({
    steps: z.array(z.object({
      stepNumber: z.number(),
      title: z.string(),
      description: z.string(),
      estimatedTime: z.string(),
    })),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    prerequisites: z.array(z.string()),
    tips: z.array(z.string()),
  }).optional(),
  expectedOutcomes: z.object({
    insights: z.array(z.string()),
    businessValue: z.string(),
    useCases: z.array(z.string()),
  }),
  alternatives: z.array(z.object({
    title: z.string(),
    description: z.string(),
    tradeoffs: z.array(z.string()),
  })),
});

/**
 * Dashboard optimization plan schema
 */
export const DashboardOptimizationPlanSchema = z.object({
  dashboardUuid: z.string().uuid(),
  currentState: z.object({
    tileCount: z.number(),
    averageLoadTime: z.number(),
    performanceScore: z.number().min(0).max(100),
    usabilityScore: z.number().min(0).max(100),
    identifiedIssues: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      affectedTiles: z.array(z.string()),
    })),
  }),
  optimizationPlan: z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedImpact: z.object({
      performanceImprovement: z.string(),
      usabilityImprovement: z.string(),
      maintenanceReduction: z.string(),
    }),
    optimizations: z.array(z.object({
      optimizationId: z.string(),
      type: z.enum(['layout', 'performance', 'content', 'interaction', 'data']),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      implementation: z.object({
        changes: z.array(z.object({
          target: z.string(),
          action: z.string(),
          details: z.string(),
        })),
        estimatedEffort: z.string(),
        riskLevel: z.enum(['low', 'medium', 'high']),
      }),
      expectedBenefits: z.array(z.string()),
      potentialRisks: z.array(z.string()),
    })),
  }),
  implementationPlan: z.object({
    phases: z.array(z.object({
      phaseNumber: z.number(),
      title: z.string(),
      description: z.string(),
      optimizations: z.array(z.string()),
      estimatedDuration: z.string(),
      dependencies: z.array(z.string()),
    })),
    totalEstimatedTime: z.string(),
    resourceRequirements: z.array(z.string()),
    successMetrics: z.array(z.object({
      metric: z.string(),
      currentValue: z.string(),
      targetValue: z.string(),
      measurementMethod: z.string(),
    })),
  }).optional(),
  projectedOutcome: z.object({
    performanceScore: z.number().min(0).max(100),
    usabilityScore: z.number().min(0).max(100),
    expectedLoadTime: z.number(),
    userExperienceImprovements: z.array(z.string()),
  }),
});

/**
 * Smart template schema
 */
export const SmartTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string(),
  templateType: z.enum(['dashboard', 'chart', 'analysis_workflow', 'kpi_tracking', 'custom']),
  category: z.string(),
  tags: z.array(z.string()),
  confidence: RecommendationConfidence,
  confidenceScore: z.number().min(0).max(1),
  learningSource: z.object({
    sourceType: z.enum(['organizational_patterns', 'industry_best_practices', 'data_characteristics', 'user_behavior']),
    sourceCount: z.number(),
    learningPeriod: z.string(),
    patternStrength: z.number().min(0).max(1),
  }),
  template: z.object({
    baseConfiguration: z.record(z.any()),
    adaptableElements: z.array(z.object({
      element: z.string(),
      adaptationType: z.enum(['field_mapping', 'filter_adjustment', 'visualization_type', 'layout', 'styling']),
      adaptationRules: z.array(z.string()),
    })),
    requiredFields: z.array(z.object({
      fieldType: z.enum(['dimension', 'metric', 'filter']),
      fieldName: z.string(),
      dataType: z.string(),
      isOptional: z.boolean(),
      defaultValue: z.any().optional(),
    })),
    optionalEnhancements: z.array(z.object({
      enhancement: z.string(),
      description: z.string(),
      implementation: z.string(),
    })),
  }),
  usageGuidelines: z.object({
    bestUseCases: z.array(z.string()),
    dataRequirements: z.array(z.string()),
    implementationSteps: z.array(z.object({
      step: z.number(),
      title: z.string(),
      description: z.string(),
      estimatedTime: z.string(),
    })),
    customizationTips: z.array(z.string()),
    commonPitfalls: z.array(z.string()),
  }).optional(),
  performanceCharacteristics: z.object({
    expectedExecutionTime: z.string(),
    scalabilityLimits: z.string(),
    resourceRequirements: z.string(),
    optimizationTips: z.array(z.string()),
  }),
  adaptationExamples: z.array(z.object({
    scenario: z.string(),
    adaptations: z.array(z.string()),
    expectedOutcome: z.string(),
  })),
});

/**
 * Response schemas for Phase 3 tools
 */
export const ChartRecommendationsResponseSchema = z.object({
  exploreId: z.string(),
  analyticalGoal: AnalyticalGoal,
  recommendations: z.array(ChartRecommendationSchema),
  summary: z.object({
    totalRecommendations: z.number(),
    averageConfidence: z.number().min(0).max(1),
    recommendationTypes: z.record(z.number()),
    estimatedImplementationTime: z.string(),
  }),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    aiVersion: z.string().default('3.0'),
    processingTime: z.number(),
  }),
});

export const SmartTemplatesResponseSchema = z.object({
  organizationContext: z.record(z.any()).optional(),
  templates: z.array(SmartTemplateSchema),
  summary: z.object({
    totalTemplates: z.number(),
    templateTypes: z.record(z.number()),
    averageConfidence: z.number().min(0).max(1),
    learningSourceDistribution: z.record(z.number()),
  }),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    aiVersion: z.string().default('3.0'),
    learningDatasetSize: z.number(),
    processingTime: z.number(),
  }),
});

// ============================================================================
// PHASE 2: ADVANCED QUERY OPTIMIZATION SCHEMAS
// ============================================================================

/**
 * Optimization types for chart query optimization
 */
export const OptimizationType = z.enum([
  'performance',     // Focus on execution speed
  'accuracy',        // Focus on data accuracy and completeness
  'resource',        // Focus on resource usage (memory, CPU)
  'user_experience', // Focus on user experience and responsiveness
  'comprehensive',   // Balanced optimization across all areas
]);

/**
 * Optimization aggressiveness levels
 */
export const OptimizationAggressiveness = z.enum([
  'conservative',    // Minimal changes, preserve existing behavior
  'moderate',        // Balanced approach with reasonable trade-offs
  'aggressive',      // Maximum optimization, may change behavior
]);

/**
 * Benchmark variation types for testing
 */
export const BenchmarkVariationType = z.enum([
  'filter_combinations',    // Test different filter combinations
  'field_selections',       // Test different field selections
  'aggregation_levels',     // Test different aggregation levels
  'time_ranges',           // Test different time ranges
  'limit_variations',      // Test different row limits
  'comprehensive',         // Test all variation types
]);

/**
 * Statistical significance levels for benchmark analysis
 */
export const StatisticalSignificance = z.enum([
  'low',      // p < 0.1 (90% confidence)
  'medium',   // p < 0.05 (95% confidence)
  'high',     // p < 0.01 (99% confidence)
  'very_high', // p < 0.001 (99.9% confidence)
]);

/**
 * Request schema for chart query optimization
 */
export const OptimizeChartQueryRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the chart to optimize'),
  optimizationType: OptimizationType
    .optional()
    .default('comprehensive')
    .describe('Type of optimization to focus on (default: comprehensive)'),
  aggressiveness: OptimizationAggressiveness
    .optional()
    .default('moderate')
    .describe('How aggressive the optimization should be (default: moderate)'),
  includePerformancePrediction: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include performance predictions (default: true)'),
  maxOptimizations: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Maximum number of optimization suggestions (default: 10)'),
});

/**
 * Request schema for chart benchmark variations
 */
export const BenchmarkChartVariationsRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the chart to benchmark'),
  variations: z
    .array(BenchmarkVariationType)
    .min(1)
    .describe('Types of variations to test'),
  testDuration: z
    .number()
    .min(30)
    .max(300)
    .optional()
    .default(60)
    .describe('Duration of each test in seconds (default: 60, max: 300)'),
  iterations: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(3)
    .describe('Number of iterations per variation (default: 3)'),
  significanceLevel: StatisticalSignificance
    .optional()
    .default('medium')
    .describe('Required statistical significance level (default: medium)'),
  includeStatisticalAnalysis: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include statistical analysis (default: true)'),
});

/**
 * Optimization suggestion schema
 */
export const OptimizationSuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(['filter', 'limit', 'dimension', 'metric', 'query', 'cache', 'index']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  implementation: z.object({
    changes: z.array(z.object({
      field: z.string(),
      currentValue: z.any(),
      suggestedValue: z.any(),
      reason: z.string(),
    })),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    estimatedEffort: z.string(),
  }),
  impact: z.object({
    performanceGain: z.string(),
    accuracyImpact: z.enum(['none', 'minimal', 'moderate', 'significant']),
    userExperienceImprovement: z.string(),
    resourceSavings: z.string().optional(),
  }),
  tradeoffs: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
});

/**
 * Chart query optimization result schema
 */
export const ChartQueryOptimizationSchema = z.object({
  chartUuid: z.string().uuid(),
  chartName: z.string(),
  currentPerformance: z.object({
    executionTime: z.number(),
    rowCount: z.number(),
    columnCount: z.number(),
    score: z.number().min(0).max(100),
    complexityScore: z.number().min(0).max(100),
  }),
  optimizations: z.array(OptimizationSuggestionSchema),
  predictedPerformance: z.object({
    executionTime: z.number(),
    score: z.number().min(0).max(100),
    improvement: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  optimizedQuery: z.object({
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
    filters: z.any(),
    sorts: z.array(z.any()),
    limit: z.number().optional(),
    tableCalculations: z.array(z.any()).optional(),
  }).optional(),
  metadata: z.object({
    optimizedAt: z.string().datetime(),
    optimizationType: OptimizationType,
    aggressiveness: OptimizationAggressiveness,
    optimizationVersion: z.string().default('2.0'),
  }),
});

/**
 * Benchmark variation result schema
 */
export const BenchmarkVariationResultSchema = z.object({
  variationId: z.string(),
  variationType: BenchmarkVariationType,
  configuration: z.object({
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
    filters: z.any(),
    limit: z.number().optional(),
  }),
  performance: z.object({
    executionTimes: z.array(z.number()),
    averageExecutionTime: z.number(),
    medianExecutionTime: z.number(),
    standardDeviation: z.number(),
    rowCount: z.number(),
    score: z.number().min(0).max(100),
  }),
  statisticalAnalysis: z.object({
    sampleSize: z.number(),
    confidenceInterval: z.object({
      lower: z.number(),
      upper: z.number(),
      level: z.number(),
    }),
    significanceLevel: StatisticalSignificance,
    pValue: z.number().optional(),
  }).optional(),
});

/**
 * Chart benchmark variations result schema
 */
export const ChartBenchmarkVariationsSchema = z.object({
  chartUuid: z.string().uuid(),
  chartName: z.string(),
  baseline: z.object({
    executionTime: z.number(),
    rowCount: z.number(),
    score: z.number().min(0).max(100),
  }),
  variations: z.array(BenchmarkVariationResultSchema),
  recommendations: z.array(z.object({
    variationId: z.string(),
    improvement: z.string(),
    confidence: z.number().min(0).max(1),
    tradeoffs: z.array(z.string()),
    recommendation: z.string(),
  })),
  summary: z.object({
    bestPerformingVariation: z.string(),
    averageImprovement: z.string(),
    significantImprovements: z.number(),
    totalVariationsTested: z.number(),
  }),
  metadata: z.object({
    benchmarkedAt: z.string().datetime(),
    testDuration: z.number(),
    iterations: z.number(),
    benchmarkVersion: z.string().default('2.0'),
  }),
});

/**
 * Project chart analytics schema for resource
 */
export const ProjectChartAnalyticsSchema = z.object({
  projectUuid: z.string().uuid(),
  projectName: z.string(),
  analytics: z.object({
    totalCharts: z.number(),
    performanceDistribution: z.object({
      fast: z.number(),
      moderate: z.number(),
      slow: z.number(),
      very_slow: z.number(),
    }),
    optimizationOpportunities: z.array(z.object({
      chartUuid: z.string().uuid(),
      chartName: z.string(),
      currentScore: z.number(),
      potentialImprovement: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
    })),
    usagePatterns: z.object({
      mostUsedExplores: z.array(z.object({
        exploreId: z.string(),
        chartCount: z.number(),
        averagePerformance: z.number(),
      })),
      commonPatterns: z.array(z.object({
        patternType: ChartPatternType,
        frequency: z.number(),
        averagePerformance: z.number(),
      })),
    }),
    healthMetrics: z.object({
      averagePerformanceScore: z.number(),
      chartsNeedingOptimization: z.number(),
      optimizationCompliance: z.number(),
    }),
  }),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
    analyticsVersion: z.string().default('2.0'),
  }),
});

/**
 * Explore optimization suggestions schema for resource
 */
export const ExploreOptimizationSuggestionsSchema = z.object({
  exploreId: z.string(),
  exploreName: z.string(),
  suggestions: z.array(z.object({
    category: z.enum(['performance', 'usability', 'best_practices', 'data_quality']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    affectedCharts: z.number(),
    implementation: z.object({
      effort: z.enum(['low', 'medium', 'high']),
      complexity: z.enum(['simple', 'moderate', 'complex']),
      steps: z.array(z.string()),
    }),
    impact: z.object({
      performanceImprovement: z.string(),
      userExperienceGain: z.string(),
      maintenanceReduction: z.string().optional(),
    }),
  })),
  fieldAnalysis: z.object({
    mostUsedFields: z.array(z.object({
      fieldId: z.string(),
      fieldName: z.string(),
      usageCount: z.number(),
      averagePerformanceImpact: z.number(),
    })),
    underutilizedFields: z.array(z.object({
      fieldId: z.string(),
      fieldName: z.string(),
      potentialValue: z.string(),
    })),
    performanceBottlenecks: z.array(z.object({
      fieldId: z.string(),
      fieldName: z.string(),
      impact: z.string(),
      suggestion: z.string(),
    })),
  }),
  patterns: z.object({
    commonCombinations: z.array(z.object({
      fields: z.array(z.string()),
      frequency: z.number(),
      averagePerformance: z.number(),
    })),
    optimizationOpportunities: z.array(z.object({
      pattern: z.string(),
      improvement: z.string(),
      affectedCharts: z.number(),
    })),
  }),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    chartCount: z.number(),
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
    suggestionsVersion: z.string().default('2.0'),
  }),
});
