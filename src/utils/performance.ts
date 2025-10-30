/**
 * Performance analysis utilities for chart optimization
 */

/**
 * Calculate query complexity score based on various factors
 * Returns a score from 0-100 where higher scores indicate more complex queries
 */
export function calculateQueryComplexityScore(config: any): number {
  let complexityScore = 0;
  
  // Base complexity from field counts
  const dimensionCount = config.dimensions?.length || 0;
  const metricCount = config.metrics?.length || 0;
  const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                     (config.filters?.dimensions?.or?.length || 0) +
                     (config.filters?.metrics?.and?.length || 0) +
                     (config.filters?.metrics?.or?.length || 0);
  
  // Dimension complexity (0-30 points)
  complexityScore += Math.min(dimensionCount * 3, 30);
  
  // Metric complexity (0-25 points)
  complexityScore += Math.min(metricCount * 2.5, 25);
  
  // Filter complexity (0-20 points)
  complexityScore += Math.min(filterCount * 4, 20);
  
  // Table calculations add significant complexity (0-15 points)
  if (config.tableCalculations?.length > 0) {
    complexityScore += Math.min(config.tableCalculations.length * 7.5, 15);
  }
  
  // Custom metrics add complexity (0-10 points)
  if (config.customMetrics?.length > 0) {
    complexityScore += Math.min(config.customMetrics.length * 5, 10);
  }
  
  return Math.min(complexityScore, 100);
}

/**
 * Predict performance based on query characteristics
 * Uses machine learning-inspired heuristics to estimate execution time
 */
export function predictQueryPerformance(config: any, baselineTime?: number): {
  estimatedTime: number;
  confidence: number;
  factors: string[];
} {
  const factors: string[] = [];
  let timeMultiplier = 1.0;
  let confidence = 0.8; // Base confidence
  
  const dimensionCount = config.dimensions?.length || 0;
  const metricCount = config.metrics?.length || 0;
  const filterCount = (config.filters?.dimensions?.and?.length || 0) +
                     (config.filters?.dimensions?.or?.length || 0);
  
  // Dimension impact
  if (dimensionCount > 5) {
    timeMultiplier *= 1.3;
    factors.push('High dimension count increases complexity');
  } else if (dimensionCount > 2) {
    timeMultiplier *= 1.1;
    factors.push('Moderate dimension count');
  }
  
  // Metric impact
  if (metricCount > 10) {
    timeMultiplier *= 1.4;
    factors.push('High metric count increases processing time');
  } else if (metricCount > 5) {
    timeMultiplier *= 1.2;
    factors.push('Moderate metric count');
  }
  
  // Filter impact (filters generally improve performance)
  if (filterCount === 0) {
    timeMultiplier *= 1.8;
    confidence -= 0.1;
    factors.push('No filters - querying entire dataset');
  } else if (filterCount > 5) {
    timeMultiplier *= 1.1;
    factors.push('Complex filtering logic');
  } else {
    timeMultiplier *= 0.8;
    factors.push('Good filtering reduces data scope');
  }
  
  // Table calculations impact
  if (config.tableCalculations?.length > 0) {
    timeMultiplier *= 1.5;
    confidence -= 0.1;
    factors.push('Table calculations add processing overhead');
  }
  
  // Custom metrics impact
  if (config.customMetrics?.length > 0) {
    timeMultiplier *= 1.3;
    confidence -= 0.05;
    factors.push('Custom metrics require additional computation');
  }
  
  // Use baseline or estimate from scratch
  const baseTime = baselineTime || 2000; // 2 second default baseline
  const estimatedTime = Math.round(baseTime * timeMultiplier);
  
  return {
    estimatedTime,
    confidence: Math.max(0.3, Math.min(1.0, confidence)),
    factors,
  };
}

/**
 * Calculate statistical metrics for benchmark analysis
 */
export function calculateStatisticalMetrics(values: number[], significanceLevel: string): {
  mean: number;
  median: number;
  standardDeviation: number;
  confidenceInterval: { lower: number; upper: number; level: number };
  pValue?: number;
} {
  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate median
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate confidence interval
  const confidenceLevels = {
    'low': 0.90,
    'medium': 0.95,
    'high': 0.99,
    'very_high': 0.999,
  };
  
  const confidenceLevel = confidenceLevels[significanceLevel as keyof typeof confidenceLevels] || 0.95;
  const alpha = 1 - confidenceLevel;
  const tValue = getTValueForConfidenceInterval(alpha / 2, n - 1);
  const marginOfError = tValue * (standardDeviation / Math.sqrt(n));
  
  return {
    mean,
    median,
    standardDeviation,
    confidenceInterval: {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      level: confidenceLevel,
    },
  };
}

/**
 * Approximate t-value for confidence intervals (simplified implementation)
 */
function getTValueForConfidenceInterval(alpha: number, degreesOfFreedom: number): number {
  // Simplified t-table lookup for common cases
  const tTable: { [key: string]: number } = {
    '0.05_1': 12.706, '0.05_2': 4.303, '0.05_3': 3.182, '0.05_5': 2.571,
    '0.05_10': 2.228, '0.05_20': 2.086, '0.05_30': 2.042, '0.05_inf': 1.96,
    '0.025_1': 25.452, '0.025_2': 6.205, '0.025_3': 4.177, '0.025_5': 3.163,
    '0.025_10': 2.634, '0.025_20': 2.423, '0.025_30': 2.390, '0.025_inf': 2.326,
    '0.005_1': 127.32, '0.005_2': 14.089, '0.005_3': 7.453, '0.005_5': 5.208,
    '0.005_10': 4.144, '0.005_20': 3.552, '0.005_30': 3.385, '0.005_inf': 3.291,
  };
  
  const alphaStr = alpha.toFixed(3);
  let dfKey = degreesOfFreedom.toString();
  
  // Find closest degrees of freedom
  if (degreesOfFreedom > 30) dfKey = 'inf';
  else if (degreesOfFreedom > 20) dfKey = '30';
  else if (degreesOfFreedom > 10) dfKey = '20';
  else if (degreesOfFreedom > 5) dfKey = '10';
  else if (degreesOfFreedom > 3) dfKey = '5';
  
  const key = `${alphaStr}_${dfKey}`;
  return tTable[key] || 2.0; // Default fallback
}