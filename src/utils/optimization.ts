/**
 * Query optimization utilities for chart performance improvement
 */

/**
 * Generate optimization suggestions based on query analysis
 */
export function generateOptimizationSuggestions(
  config: any,
  currentPerformance: any,
  optimizationType: string,
  aggressiveness: string
): any[] {
  const suggestions: any[] = [];
  let suggestionId = 1;
  
  const dimensionCount = config.dimensions?.length || 0;
  const metricCount = config.metrics?.length || 0;
  const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                     (config.filters?.dimensions?.or?.length || 0);
  const executionTime = currentPerformance.executionTime || 0;
  const rowCount = currentPerformance.rowCount || 0;
  
  // High-impact suggestions for slow queries
  if (executionTime > 5000) {
    if (filterCount === 0) {
      suggestions.push({
        id: `opt_${suggestionId++}`,
        type: 'filter',
        priority: 'critical',
        title: 'Add Date Range Filter',
        description: 'Query is scanning entire dataset. Add date range filter to limit data scope.',
        implementation: {
          changes: [{
            field: 'filters.dimensions',
            currentValue: null,
            suggestedValue: 'Add date filter (e.g., last 90 days)',
            reason: 'Reduces data volume and improves performance',
          }],
          complexity: 'simple',
          estimatedEffort: '5 minutes',
        },
        impact: {
          performanceGain: '60-80% faster execution',
          accuracyImpact: 'minimal',
          userExperienceImprovement: 'Significantly faster loading',
          resourceSavings: 'Reduced database load',
        },
        confidence: 0.9,
      });
    }
    
    if (rowCount > 10000) {
      suggestions.push({
        id: `opt_${suggestionId++}`,
        type: 'limit',
        priority: 'high',
        title: 'Add Row Limit',
        description: 'Large result set impacts performance. Consider adding row limit or pagination.',
        implementation: {
          changes: [{
            field: 'limit',
            currentValue: null,
            suggestedValue: 1000,
            reason: 'Reduces data transfer and rendering time',
          }],
          complexity: 'simple',
          estimatedEffort: '2 minutes',
        },
        impact: {
          performanceGain: '40-60% faster rendering',
          accuracyImpact: 'moderate',
          userExperienceImprovement: 'Faster page load, better responsiveness',
        },
        tradeoffs: ['May not show complete dataset', 'Requires pagination for full data'],
        confidence: 0.85,
      });
    }
  }
  
  // Dimension optimization
  if (dimensionCount > 5 && aggressiveness !== 'conservative') {
    suggestions.push({
      id: `opt_${suggestionId++}`,
      type: 'dimension',
      priority: 'medium',
      title: 'Reduce Dimension Count',
      description: 'High number of dimensions increases query complexity. Consider using drill-down approach.',
      implementation: {
        changes: [{
          field: 'dimensions',
          currentValue: `${dimensionCount} dimensions`,
          suggestedValue: 'Focus on 3-4 key dimensions',
          reason: 'Reduces query complexity and improves performance',
        }],
        complexity: 'moderate',
        estimatedEffort: '15 minutes',
      },
      impact: {
        performanceGain: '20-30% faster execution',
        accuracyImpact: 'none',
        userExperienceImprovement: 'Cleaner, more focused analysis',
      },
      tradeoffs: ['Less detailed breakdown', 'May require multiple charts for full analysis'],
      confidence: 0.7,
    });
  }
  
  // Metric optimization
  if (metricCount > 8 && optimizationType === 'performance') {
    suggestions.push({
      id: `opt_${suggestionId++}`,
      type: 'metric',
      priority: 'medium',
      title: 'Optimize Metric Selection',
      description: 'Large number of metrics increases processing time. Focus on key metrics.',
      implementation: {
        changes: [{
          field: 'metrics',
          currentValue: `${metricCount} metrics`,
          suggestedValue: 'Select 4-6 most important metrics',
          reason: 'Reduces computation overhead',
        }],
        complexity: 'moderate',
        estimatedEffort: '10 minutes',
      },
      impact: {
        performanceGain: '15-25% faster execution',
        accuracyImpact: 'minimal',
        userExperienceImprovement: 'Faster loading, cleaner visualization',
      },
      confidence: 0.75,
    });
  }
  
  // Caching suggestion for frequently accessed charts
  if (optimizationType === 'user_experience' || optimizationType === 'comprehensive') {
    suggestions.push({
      id: `opt_${suggestionId++}`,
      type: 'cache',
      priority: 'low',
      title: 'Enable Result Caching',
      description: 'Cache results for frequently accessed charts to improve user experience.',
      implementation: {
        changes: [{
          field: 'caching',
          currentValue: 'disabled',
          suggestedValue: 'enabled with 1-hour TTL',
          reason: 'Reduces repeated query execution',
        }],
        complexity: 'simple',
        estimatedEffort: '5 minutes',
      },
      impact: {
        performanceGain: 'Near-instant loading for cached results',
        accuracyImpact: 'minimal',
        userExperienceImprovement: 'Much faster subsequent loads',
      },
      tradeoffs: ['Slightly stale data possible', 'Requires cache management'],
      confidence: 0.8,
    });
  }
  
  return suggestions.slice(0, 10); // Limit to top 10 suggestions
}

/**
 * Calculate similarity between two chart configurations
 */
export function calculateConfigurationSimilarity(config1: any, config2: any): number {
  let similarity = 0;
  let factors = 0;

  // Chart type similarity
  if (config1.chartType === config2.chartType) {
    similarity += 0.3;
  }
  factors += 0.3;

  // Field similarity
  const fields1 = [...(config1.dimensions || []), ...(config1.metrics || [])];
  const fields2 = [...(config2.dimensions || []), ...(config2.metrics || [])];
  const commonFields = fields1.filter(field => fields2.includes(field));
  const fieldSimilarity = commonFields.length / Math.max(fields1.length, fields2.length, 1);
  similarity += fieldSimilarity * 0.4;
  factors += 0.4;

  // Complexity similarity
  const complexity1 = calculateQueryComplexityScore(config1);
  const complexity2 = calculateQueryComplexityScore(config2);
  const complexitySimilarity = 1 - Math.abs(complexity1 - complexity2) / 100;
  similarity += complexitySimilarity * 0.3;
  factors += 0.3;

  return similarity / factors;
}

// Import the complexity calculation function
function calculateQueryComplexityScore(config: any): number {
  let complexityScore = 0;
  
  const dimensionCount = config.dimensions?.length || 0;
  const metricCount = config.metrics?.length || 0;
  const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                     (config.filters?.dimensions?.or?.length || 0) +
                     (config.filters?.metrics?.and?.length || 0) +
                     (config.filters?.metrics?.or?.length || 0);
  
  complexityScore += Math.min(dimensionCount * 3, 30);
  complexityScore += Math.min(metricCount * 2.5, 25);
  complexityScore += Math.min(filterCount * 4, 20);
  
  if (config.tableCalculations?.length > 0) {
    complexityScore += Math.min(config.tableCalculations.length * 7.5, 15);
  }
  
  if (config.customMetrics?.length > 0) {
    complexityScore += Math.min(config.customMetrics.length * 5, 10);
  }
  
  return Math.min(complexityScore, 100);
}