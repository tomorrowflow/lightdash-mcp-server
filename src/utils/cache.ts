/**
 * Memory cache utilities for expensive operations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Memory cache for expensive operations
 */
const analysisCache = new Map<string, CacheEntry<any>>();

/**
 * Cache helper with TTL support
 */
export function getCachedResult<T>(key: string): T | null {
  const cached = analysisCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  if (cached) {
    analysisCache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Set cached result with TTL
 */
export function setCachedResult<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 min default
  analysisCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Clear all cached results
 */
export function clearCache(): void {
  analysisCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number; ttl: number }>;
} {
  const now = Date.now();
  const entries = Array.from(analysisCache.entries()).map(([key, entry]) => ({
    key,
    age: now - entry.timestamp,
    ttl: entry.ttl,
  }));

  return {
    size: analysisCache.size,
    entries,
  };
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      analysisCache.delete(key);
      removedCount++;
    }
  }
  
  return removedCount;
}

// Automatically cleanup expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);