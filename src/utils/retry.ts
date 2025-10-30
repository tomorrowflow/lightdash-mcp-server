/**
 * Retry utilities for handling transient failures
 */

// Retry configuration
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '1000', 10);

/**
 * Retry helper function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on authentication errors or client errors (4xx)
      if (lastError.message.includes('401') || lastError.message.includes('403') ||
          lastError.message.includes('400') || lastError.message.includes('404')) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, lastError.message);
        throw lastError;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
  
  throw lastError!;
}

export { MAX_RETRIES, RETRY_DELAY };