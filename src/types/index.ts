/**
 * Shared types and interfaces for the Lightdash MCP Server
 */

// Re-export all schema types
export * from '../schemas.js';

/**
 * Performance analysis types
 */
export interface PerformanceMetrics {
  executionTime: number;
  rowCount: number;
  complexityScore: number;
  performanceScore: number;
  threshold: 'fast' | 'moderate' | 'slow' | 'very_slow';
}

export interface PerformancePrediction {
  estimatedTime: number;
  confidence: number;
  factors: string[];
}

/**
 * Chart analysis types
 */
export interface ChartConfiguration {
  dimensions?: string[];
  metrics?: string[];
  filters?: any;
  sorts?: any[];
  tableCalculations?: any[];
  customMetrics?: any[];
  limit?: number;
  chartType?: string;
}

export interface ChartAnalysis {
  chartUuid: string;
  chartName: string;
  chartType: string;
  exploreId: string;
  performance: PerformanceMetrics;
  configuration: {
    dimensionCount: number;
    metricCount: number;
    filterCount: number;
    sortCount: number;
    hasTableCalculations: boolean;
    hasCustomMetrics: boolean;
  };
  usage: {
    lastViewed: string;
    viewCount: number;
    dashboardCount: number;
  };
  quality: {
    score: number;
    issues: Array<{
      type: 'performance' | 'usability' | 'accuracy';
      severity: 'critical' | 'warning' | 'info';
      message: string;
      suggestion?: string;
    }>;
  };
  metadata: {
    analyzedAt: string;
    analysisVersion: string;
  };
}

/**
 * Optimization types
 */
export interface OptimizationSuggestion {
  id: string;
  type: 'filter' | 'limit' | 'dimension' | 'metric' | 'cache' | 'index';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: {
    changes: Array<{
      field: string;
      currentValue: any;
      suggestedValue: any;
      reason: string;
    }>;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedEffort: string;
  };
  impact: {
    performanceGain: string;
    accuracyImpact: string;
    userExperienceImprovement: string;
    resourceSavings?: string;
  };
  tradeoffs?: string[];
  confidence: number;
}

/**
 * AI recommendation types
 */
export interface DataCharacteristics {
  dataTypes: Record<string, string>;
  cardinality: Record<string, number>;
  distributions: Record<string, any>;
  relationships: Array<{
    field1: string;
    field2: string;
    strength: number;
    type: string;
  }>;
  temporalFields: string[];
  categoricalFields: string[];
  numericFields: string[];
  recommendations: string[];
}

export interface RecommendationScoring {
  score: number;
  confidence: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  factors: Record<string, number>;
}

export interface ChartRecommendation {
  recommendationId: string;
  title: string;
  description: string;
  analyticalGoal: string;
  confidence: string;
  confidenceScore: number;
  reasoning: {
    type: 'pattern_based' | 'ai_generated' | 'rule_based';
    explanation: string;
    supportingEvidence: string[];
    dataCharacteristics: string[];
  };
  chartConfiguration: ChartConfiguration;
  implementationGuidance?: {
    steps: Array<{
      stepNumber: number;
      title: string;
      description: string;
      estimatedTime: string;
    }>;
    complexity: 'simple' | 'moderate' | 'complex';
    prerequisites: string[];
    tips: string[];
  };
  expectedOutcomes: {
    insights: string[];
    businessValue: string;
    useCases: string[];
  };
  alternatives: Array<{
    title: string;
    description: string;
    tradeoffs: string[];
  }>;
}

/**
 * Template types
 */
export interface SmartTemplate {
  templateId: string;
  name: string;
  description: string;
  category: 'organizational_standard' | 'performance_optimized' | 'business_intelligence' | 'custom';
  chartType: string;
  configuration: {
    chartConfig: any;
    suggestedDimensions: string[];
    suggestedMetrics: string[];
    defaultFilters: any[];
    sortConfiguration: any[];
    limit?: number;
  };
  adaptiveFeatures: {
    autoSelectFields: boolean;
    contextualRecommendations: boolean;
    performanceOptimization: boolean;
    responsiveDesign: boolean;
    [key: string]: boolean;
  };
  usageGuidelines: {
    bestUseCases: string[];
    configurationTips: string[];
    performanceNotes: string[];
  };
  metadata: {
    basedOnCharts: number;
    confidenceScore: number;
    lastUpdated: string;
    organizationSpecific: boolean;
  };
}

/**
 * Cache types
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Statistical analysis types
 */
export interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  pValue?: number;
}

/**
 * Benchmark types
 */
export interface BenchmarkVariation {
  variationId: string;
  variationType: string;
  description: string;
  configuration: ChartConfiguration;
  performance: {
    executionTimes: number[];
    averageExecutionTime: number;
    medianExecutionTime: number;
    standardDeviation: number;
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
    averageRowCount: number;
    complexityScore: number;
  };
  statistics: {
    sampleSize: number;
    reliability: 'good' | 'limited' | 'poor';
    variability: number;
  };
  comparison?: {
    improvementPercentage: number;
    isStatisticallySignificant: boolean;
    confidenceLevel: number;
  };
}

/**
 * Dashboard optimization types
 */
export interface DashboardOptimization {
  optimizationId: string;
  type: 'performance' | 'layout' | 'content' | 'usability';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  implementation: {
    changes: Array<{
      target: string;
      action: string;
      details: string;
    }>;
    estimatedEffort: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  expectedBenefits: string[];
  potentialRisks: string[];
}

/**
 * Error handling types
 */
export interface EnhancedError {
  name: string;
  message: string;
  data?: any;
  suggestions?: string[];
}

/**
 * MCP Server types
 */
export interface ServerCapabilities {
  tools: Record<string, any>;
  resources: Record<string, any>;
  prompts: Record<string, any>;
}

export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

/**
 * Utility type helpers
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};