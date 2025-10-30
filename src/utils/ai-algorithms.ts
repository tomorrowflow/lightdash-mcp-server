/**
 * AI-powered algorithms for chart analysis and recommendations
 */

/**
 * AI-powered pattern recognition for chart recommendations
 * Uses machine learning-inspired algorithms to identify optimal chart configurations
 */
export function analyzeDataCharacteristics(exploreSchema: any, sampleData?: any): {
  dataTypes: Record<string, string>;
  cardinality: Record<string, number>;
  distributions: Record<string, any>;
  relationships: Array<{ field1: string; field2: string; strength: number; type: string }>;
  temporalFields: string[];
  categoricalFields: string[];
  numericFields: string[];
  recommendations: string[];
} {
  const analysis = {
    dataTypes: {} as Record<string, string>,
    cardinality: {} as Record<string, number>,
    distributions: {} as Record<string, any>,
    relationships: [] as Array<{ field1: string; field2: string; strength: number; type: string }>,
    temporalFields: [] as string[],
    categoricalFields: [] as string[],
    numericFields: [] as string[],
    recommendations: [] as string[],
  };

  // Analyze explore schema structure
  if (exploreSchema?.tables) {
    for (const [tableName, table] of Object.entries(exploreSchema.tables)) {
      const tableData = table as any;
      
      // Analyze dimensions
      if (tableData.dimensions) {
        for (const [fieldName, field] of Object.entries(tableData.dimensions)) {
          const fieldData = field as any;
          const fullFieldName = `${tableName}_${fieldName}`;
          
          analysis.dataTypes[fullFieldName] = fieldData.type || 'string';
          
          // Classify field types
          if (fieldData.type === 'timestamp' || fieldData.type === 'date' ||
              fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('time')) {
            analysis.temporalFields.push(fullFieldName);
            analysis.recommendations.push(`Consider time-series analysis with ${fullFieldName}`);
          } else if (fieldData.type === 'string' || fieldData.type === 'boolean') {
            analysis.categoricalFields.push(fullFieldName);
            // Estimate cardinality based on field name patterns
            if (fieldName.toLowerCase().includes('id') || fieldName.toLowerCase().includes('uuid')) {
              analysis.cardinality[fullFieldName] = 10000; // High cardinality
            } else if (fieldName.toLowerCase().includes('status') || fieldName.toLowerCase().includes('type')) {
              analysis.cardinality[fullFieldName] = 5; // Low cardinality
            } else {
              analysis.cardinality[fullFieldName] = 50; // Medium cardinality
            }
          }
        }
      }
      
      // Analyze metrics
      if (tableData.metrics) {
        for (const [fieldName, field] of Object.entries(tableData.metrics)) {
          const fieldData = field as any;
          const fullFieldName = `${tableName}_${fieldName}`;
          
          analysis.dataTypes[fullFieldName] = 'number';
          analysis.numericFields.push(fullFieldName);
          
          // Generate metric-specific recommendations
          if (fieldName.toLowerCase().includes('count')) {
            analysis.recommendations.push(`${fullFieldName} is suitable for trend analysis and comparisons`);
          } else if (fieldName.toLowerCase().includes('revenue') || fieldName.toLowerCase().includes('amount')) {
            analysis.recommendations.push(`${fullFieldName} works well with time-series and breakdown analysis`);
          } else if (fieldName.toLowerCase().includes('rate') || fieldName.toLowerCase().includes('percent')) {
            analysis.recommendations.push(`${fullFieldName} is ideal for performance tracking and benchmarking`);
          }
        }
      }
    }
  }

  // Generate relationship insights
  const temporalCount = analysis.temporalFields.length;
  const categoricalCount = analysis.categoricalFields.length;
  const numericCount = analysis.numericFields.length;

  if (temporalCount > 0 && numericCount > 0) {
    analysis.relationships.push({
      field1: analysis.temporalFields[0],
      field2: analysis.numericFields[0],
      strength: 0.9,
      type: 'temporal_trend'
    });
    analysis.recommendations.push('Strong potential for time-series analysis');
  }

  if (categoricalCount > 0 && numericCount > 0) {
    analysis.relationships.push({
      field1: analysis.categoricalFields[0],
      field2: analysis.numericFields[0],
      strength: 0.8,
      type: 'categorical_breakdown'
    });
    analysis.recommendations.push('Excellent for metric breakdown by categories');
  }

  return analysis;
}

/**
 * Multi-factor scoring system for chart recommendations
 * Combines multiple factors to generate confidence scores
 */
export function calculateRecommendationScore(
  chartConfig: any,
  dataCharacteristics: any,
  analyticalGoal: string,
  userContext?: any
): { score: number; confidence: string; factors: Record<string, number> } {
  const factors = {
    dataFit: 0,
    goalAlignment: 0,
    complexity: 0,
    performance: 0,
    usability: 0,
    bestPractice: 0,
  };

  // Data fit scoring (0-1)
  const dimensionCount = chartConfig.dimensions?.length || 0;
  const metricCount = chartConfig.metrics?.length || 0;
  
  if (dimensionCount > 0 && metricCount > 0) {
    factors.dataFit = Math.min(1.0, (dimensionCount + metricCount) / 5); // Optimal around 3-5 fields
  }

  // Goal alignment scoring (0-1)
  const goalScoring = {
    'trend_analysis': chartConfig.chartType === 'line' ? 0.9 :
                     dataCharacteristics.temporalFields.length > 0 ? 0.8 : 0.4,
    'comparison': chartConfig.chartType === 'bar' ? 0.9 :
                 dimensionCount > 1 ? 0.8 : 0.5,
    'distribution': chartConfig.chartType === 'histogram' ? 0.9 :
                   chartConfig.chartType === 'scatter' ? 0.8 : 0.4,
    'performance_tracking': metricCount > 0 ? 0.8 : 0.3,
    'custom': 0.6, // Neutral score for custom goals
  };
  factors.goalAlignment = goalScoring[analyticalGoal as keyof typeof goalScoring] || 0.5;

  // Complexity scoring (0-1, lower complexity = higher score)
  const complexityScore = calculateQueryComplexityScore(chartConfig);
  factors.complexity = Math.max(0, 1 - (complexityScore / 100));

  // Performance scoring (0-1)
  const predictedPerformance = predictQueryPerformance(chartConfig);
  factors.performance = predictedPerformance.confidence;

  // Usability scoring (0-1)
  if (dimensionCount <= 3 && metricCount <= 5) {
    factors.usability = 0.9; // Easy to understand
  } else if (dimensionCount <= 5 && metricCount <= 8) {
    factors.usability = 0.7; // Moderate complexity
  } else {
    factors.usability = 0.4; // High complexity
  }

  // Best practice scoring (0-1)
  let bestPracticeScore = 0.5; // Base score
  if (chartConfig.filters && chartConfig.filters.length > 0) {
    bestPracticeScore += 0.2; // Bonus for filtering
  }
  if (chartConfig.sorts && chartConfig.sorts.length > 0) {
    bestPracticeScore += 0.1; // Bonus for sorting
  }
  if (chartConfig.limit && chartConfig.limit <= 1000) {
    bestPracticeScore += 0.2; // Bonus for reasonable limits
  }
  factors.bestPractice = Math.min(1.0, bestPracticeScore);

  // Calculate weighted overall score
  const weights = {
    dataFit: 0.25,
    goalAlignment: 0.25,
    complexity: 0.15,
    performance: 0.15,
    usability: 0.15,
    bestPractice: 0.05,
  };

  const overallScore = Object.entries(factors).reduce((sum, [factor, score]) => {
    return sum + (score * weights[factor as keyof typeof weights]);
  }, 0);

  // Determine confidence level
  let confidence: string;
  if (overallScore >= 0.8) confidence = 'very_high';
  else if (overallScore >= 0.65) confidence = 'high';
  else if (overallScore >= 0.5) confidence = 'medium';
  else if (overallScore >= 0.35) confidence = 'low';
  else confidence = 'very_low';

  return { score: overallScore, confidence, factors };
}

/**
 * Natural language processing for analytical goal interpretation
 * Converts business questions into structured analytical goals
 */
export function interpretAnalyticalGoal(
  businessQuestion?: string,
  dataContext?: any,
  userRole?: string
): { goal: string; confidence: number; reasoning: string; suggestedApproaches: string[] } {
  const interpretation = {
    goal: 'custom',
    confidence: 0.5,
    reasoning: 'No specific business question provided',
    suggestedApproaches: ['Explore data with basic visualizations'],
  };

  if (!businessQuestion) {
    return interpretation;
  }

  const question = businessQuestion.toLowerCase();
  const approaches: string[] = [];

  // Trend analysis patterns
  if (question.includes('trend') || question.includes('over time') ||
      question.includes('growth') || question.includes('decline') ||
      question.includes('change') || question.includes('evolution')) {
    interpretation.goal = 'trend_analysis';
    interpretation.confidence = 0.9;
    interpretation.reasoning = 'Question indicates interest in temporal patterns and changes';
    approaches.push('Use line charts with time dimensions');
    approaches.push('Include moving averages for smoother trends');
    approaches.push('Consider year-over-year comparisons');
  }
  
  // Comparison patterns
  else if (question.includes('compare') || question.includes('versus') ||
           question.includes('vs') || question.includes('difference') ||
           question.includes('better') || question.includes('worse')) {
    interpretation.goal = 'comparison';
    interpretation.confidence = 0.85;
    interpretation.reasoning = 'Question focuses on comparing different segments or categories';
    approaches.push('Use bar charts for categorical comparisons');
    approaches.push('Consider side-by-side visualizations');
    approaches.push('Include percentage differences');
  }
  
  // Performance tracking patterns
  else if (question.includes('performance') || question.includes('kpi') ||
           question.includes('metric') || question.includes('target') ||
           question.includes('goal') || question.includes('benchmark')) {
    interpretation.goal = 'performance_tracking';
    interpretation.confidence = 0.8;
    interpretation.reasoning = 'Question relates to monitoring and measuring performance';
    approaches.push('Create KPI dashboards with key metrics');
    approaches.push('Include target lines or benchmarks');
    approaches.push('Use color coding for performance indicators');
  }

  // Adjust confidence based on data context
  if (dataContext?.timeRange && interpretation.goal === 'trend_analysis') {
    interpretation.confidence = Math.min(0.95, interpretation.confidence + 0.1);
  }
  
  if (dataContext?.keyMetrics && interpretation.goal === 'performance_tracking') {
    interpretation.confidence = Math.min(0.95, interpretation.confidence + 0.1);
  }

  // Adjust based on user role
  if (userRole) {
    const roleAdjustments = {
      'analyst': 0.05,
      'data_scientist': 0.1,
      'business_user': -0.05,
      'executive': 0.0,
    };
    const adjustment = roleAdjustments[userRole as keyof typeof roleAdjustments] || 0;
    interpretation.confidence = Math.max(0.1, Math.min(0.95, interpretation.confidence + adjustment));
  }

  interpretation.suggestedApproaches = approaches.length > 0 ? approaches : interpretation.suggestedApproaches;

  return interpretation;
}

// Helper functions (simplified versions from performance.ts to avoid circular imports)
function calculateQueryComplexityScore(config: any): number {
  let complexityScore = 0;
  const dimensionCount = config.dimensions?.length || 0;
  const metricCount = config.metrics?.length || 0;
  complexityScore += Math.min(dimensionCount * 3, 30);
  complexityScore += Math.min(metricCount * 2.5, 25);
  return Math.min(complexityScore, 100);
}

function predictQueryPerformance(config: any): { confidence: number } {
  return { confidence: 0.8 }; // Simplified for this context
}