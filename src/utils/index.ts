/**
 * Utility functions index - centralized exports for all utilities
 */

// Error handling utilities
export { createEnhancedErrorMessage } from './error-handling.js';

// Retry utilities
export { withRetry, MAX_RETRIES, RETRY_DELAY } from './retry.js';

// Performance analysis utilities
export {
  calculateQueryComplexityScore,
  predictQueryPerformance,
  calculateStatisticalMetrics,
} from './performance.js';

// Optimization utilities
export {
  generateOptimizationSuggestions,
  calculateConfigurationSimilarity,
} from './optimization.js';

// AI algorithms
export {
  analyzeDataCharacteristics,
  calculateRecommendationScore,
  interpretAnalyticalGoal,
} from './ai-algorithms.js';

// Cache utilities
export {
  getCachedResult,
  setCachedResult,
  clearCache,
  getCacheStats,
  cleanupExpiredEntries,
} from './cache.js';