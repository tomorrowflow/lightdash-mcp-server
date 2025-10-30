/**
 * Enhanced error handling utilities for Lightdash MCP Server
 */

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Handle Zod validation errors with user-friendly messages
 */
export function handleZodValidationError(error: any): string {
  if (error.name === 'ZodError') {
    const validationErrors = error.errors.map((e: any) => {
      const path = e.path.join('.');
      let message = e.message;
      
      // Provide more specific error messages for common validation issues
      if (e.code === 'invalid_string' && e.validation === 'uuid') {
        message = `Invalid UUID format. Please provide a valid UUID (e.g., "123e4567-e89b-12d3-a456-426614174000")`;
      } else if (e.code === 'invalid_type') {
        message = `Expected ${e.expected} but received ${e.received}`;
      }
      
      return `${path}: ${message}`;
    }).join(', ');
    
    return `Validation error: ${validationErrors}`;
  }
  
  return error.message || 'Unknown validation error';
}

/**
 * Enhanced error message helper function
 */
export function createEnhancedErrorMessage(error: any): string {
  // Handle Zod validation errors first
  if (error.name === 'ZodError') {
    return handleZodValidationError(error);
  }
  
  // Handle standard API errors
  if (error.error && error.error.name) {
    let errorMessage = `Lightdash API error: ${error.error.name}`;
    
    if (error.error.message) {
      errorMessage += `, ${error.error.message}`;
    }
    
    // Include detailed validation errors from error.error.data
    if (error.error.data && typeof error.error.data === 'object') {
      const validationDetails = [];
      
      // Extract field-specific validation errors
      for (const [field, fieldError] of Object.entries(error.error.data)) {
        if (fieldError && typeof fieldError === 'object' && 'message' in fieldError) {
          validationDetails.push(`${field}: ${(fieldError as any).message}`);
        } else if (typeof fieldError === 'string') {
          validationDetails.push(`${field}: ${fieldError}`);
        }
      }
      
      if (validationDetails.length > 0) {
        errorMessage += `. Validation errors: ${validationDetails.join(', ')}`;
        
        // Add actionable suggestions for common errors
        if (validationDetails.some(detail => detail.includes('filters') && detail.includes('required'))) {
          errorMessage += '. Suggestion: Ensure filters object is provided, even if empty ({}).';
        }
        if (validationDetails.some(detail => detail.includes('dimensions') || detail.includes('metrics'))) {
          errorMessage += '. Suggestion: Check that field IDs exist in the explore schema.';
        }
        if (validationDetails.some(detail => detail.includes('exploreId') || detail.includes('explore'))) {
          errorMessage += '. Suggestion: Verify the explore/table name exists in the project.';
        }
        if (validationDetails.some(detail => detail.includes('uuid') || detail.includes('UUID'))) {
          errorMessage += '. Suggestion: Ensure UUIDs are in the correct format (e.g., "123e4567-e89b-12d3-a456-426614174000").';
        }
      }
    }
    
    return errorMessage;
  }
  
  // Handle HTTP errors
  if (error.message && error.message.includes('HTTP')) {
    const statusMatch = error.message.match(/HTTP (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      switch (status) {
        case 400:
          return `Bad Request: ${error.message}. Please check your request parameters.`;
        case 401:
          return `Unauthorized: ${error.message}. Please check your API key and permissions.`;
        case 403:
          return `Forbidden: ${error.message}. You don't have permission to access this resource.`;
        case 404:
          return `Not Found: ${error.message}. The requested resource doesn't exist or you don't have access to it.`;
        case 500:
          return `Internal Server Error: ${error.message}. This is likely a temporary issue. Please try again later.`;
        default:
          return error.message;
      }
    }
  }
  
  // Return original error message as fallback
  return error.message || 'Unknown error occurred';
}

/**
 * Validate required parameters before making API calls
 */
export function validateRequiredParams(params: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !params[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required parameters: ${missingFields.join(', ')}`);
  }
  
  // Validate UUID fields specifically
  const uuidFields = requiredFields.filter(field => field.toLowerCase().includes('uuid'));
  for (const field of uuidFields) {
    if (params[field] && !isValidUUID(params[field])) {
      throw new Error(`Invalid UUID format for ${field}: ${params[field]}. Please provide a valid UUID.`);
    }
  }
}