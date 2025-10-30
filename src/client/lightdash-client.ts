/**
 * Lightdash client configuration and setup
 */

import { createLightdashClient } from 'lightdash-client-typescript-fetch';

/**
 * Create and configure Lightdash client with environment variables
 */
export const lightdashClient = createLightdashClient(
  process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud',
  {
    headers: {
      Authorization: `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
    },
  }
);

/**
 * Field name transformation utilities for Lightdash queries
 */
export const fieldTransformUtils = {
  /**
   * Transform field name by adding explore prefix if not already present
   */
  transformFieldName: (fieldName: string, exploreId: string): string => {
    // If field already has the explore prefix, return as-is
    if (fieldName.startsWith(exploreId + '_')) {
      console.log(`🔍 Field already prefixed: ${fieldName}`);
      return fieldName;
    }
    
    // Add explore prefix to create fully qualified field name
    const transformedName = `${exploreId}_${fieldName}`;
    console.log(`🔄 Field transformation: ${fieldName} → ${transformedName}`);
    return transformedName;
  },

  /**
   * Transform array of field names
   */
  transformFieldArray: (fields: string[] | undefined, exploreId: string, fieldType: string): string[] => {
    if (!fields || fields.length === 0) {
      console.log(`📝 No ${fieldType} fields to transform`);
      return [];
    }
    
    console.log(`🔄 Transforming ${fields.length} ${fieldType} field(s):`);
    const transformed = fields.map(field => fieldTransformUtils.transformFieldName(field, exploreId));
    console.log(`   Original: [${fields.join(', ')}]`);
    console.log(`   Transformed: [${transformed.join(', ')}]`);
    return transformed;
  },

  /**
   * Transform filter field references
   */
  transformFilters: (filters: any, exploreId: string): any => {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const transformedFilters = { ...filters };

    // Transform dimension filters
    if (filters.dimensions && typeof filters.dimensions === 'object') {
      transformedFilters.dimensions = { ...filters.dimensions };
      
      if (filters.dimensions.and && Array.isArray(filters.dimensions.and)) {
        transformedFilters.dimensions.and = filters.dimensions.and.map((filter: any) => ({
          ...filter,
          target: {
            ...filter.target,
            fieldId: fieldTransformUtils.transformFieldName(filter.target.fieldId, exploreId)
          }
        }));
      }
      
      if (filters.dimensions.or && Array.isArray(filters.dimensions.or)) {
        transformedFilters.dimensions.or = filters.dimensions.or.map((filter: any) => ({
          ...filter,
          target: {
            ...filter.target,
            fieldId: fieldTransformUtils.transformFieldName(filter.target.fieldId, exploreId)
          }
        }));
      }
    }

    // Transform metric filters
    if (filters.metrics && typeof filters.metrics === 'object') {
      transformedFilters.metrics = { ...filters.metrics };
      
      if (filters.metrics.and && Array.isArray(filters.metrics.and)) {
        transformedFilters.metrics.and = filters.metrics.and.map((filter: any) => ({
          ...filter,
          target: {
            ...filter.target,
            fieldId: fieldTransformUtils.transformFieldName(filter.target.fieldId, exploreId)
          }
        }));
      }
      
      if (filters.metrics.or && Array.isArray(filters.metrics.or)) {
        transformedFilters.metrics.or = filters.metrics.or.map((filter: any) => ({
          ...filter,
          target: {
            ...filter.target,
            fieldId: fieldTransformUtils.transformFieldName(filter.target.fieldId, exploreId)
          }
        }));
      }
    }

    return transformedFilters;
  },

  /**
   * Transform sort field references
   */
  transformSorts: (sorts: any[] | undefined, exploreId: string): any[] => {
    if (!sorts || sorts.length === 0) {
      console.log('📝 No sort fields to transform');
      return [];
    }

    console.log(`🔄 Transforming ${sorts.length} sort field(s):`);
    const transformed = sorts.map(sort => ({
      ...sort,
      fieldId: fieldTransformUtils.transformFieldName(sort.fieldId, exploreId)
    }));
    
    sorts.forEach((sort, index) => {
      console.log(`   Sort ${index + 1}: ${sort.fieldId} → ${transformed[index].fieldId}`);
    });
    
    return transformed;
  },
};

// Re-export the createLightdashClient function for convenience
export { createLightdashClient };