/**
 * Query-related tool handlers
 * Handles data querying operations like running underlying data queries, catalog search, etc.
 */

import { lightdashClient, fieldTransformUtils } from '../../client/lightdash-client.js';
import { withRetry } from '../../utils/retry.js';
import { createEnhancedErrorMessage } from '../../utils/error-handling.js';
import {
  RunUnderlyingDataQueryRequestSchema,
  GetCatalogSearchRequestSchema,
  GetExploreWithFullSchemaRequestSchema,
  GetExploresSummaryRequestSchema,
  GetSavedChartResultsRequestSchema,
  GetDashboardByUuidRequestSchema,
} from '../../schemas.js';

/**
 * Handle lightdash_run_underlying_data_query tool
 */
export async function handleRunUnderlyingDataQuery(args: any) {
  const parsedArgs = RunUnderlyingDataQueryRequestSchema.parse(args);
  
  // Apply field transformations
  console.log('🚀 Starting field name transformations...');
  const transformedDimensions = fieldTransformUtils.transformFieldArray(
    parsedArgs.dimensions, 
    parsedArgs.exploreId, 
    'dimension'
  );
  const transformedMetrics = fieldTransformUtils.transformFieldArray(
    parsedArgs.metrics, 
    parsedArgs.exploreId, 
    'metric'
  );
  const transformedFilters = fieldTransformUtils.transformFilters(
    parsedArgs.filters, 
    parsedArgs.exploreId
  );
  const transformedSorts = fieldTransformUtils.transformSorts(
    parsedArgs.sorts, 
    parsedArgs.exploreId
  );

  // Build the query body with transformed field names
  const queryBody: any = {
    // Use transformed field arrays
    dimensions: transformedDimensions,
    metrics: transformedMetrics,
    sorts: transformedSorts,
    tableCalculations: parsedArgs.tableCalculations || [],
    // exploreName is required and should match exploreId
    exploreName: parsedArgs.exploreId,
    // Use transformed filters
    filters: transformedFilters,
  };
  
  if (parsedArgs.limit) {
    queryBody.limit = parsedArgs.limit;
  }

  // DEBUG: Log the exact request being sent to Lightdash API
  console.log('🔍 DEBUG: Sending request to Lightdash API:');
  console.log('  URL: /api/v1/projects/{projectUuid}/explores/{exploreId}/runUnderlyingDataQuery');
  console.log('  Project UUID:', parsedArgs.projectUuid);
  console.log('  Explore ID:', parsedArgs.exploreId);
  console.log('  Query Body (with transformed fields):', JSON.stringify(queryBody, null, 2));

  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.POST(
      '/api/v1/projects/{projectUuid}/explores/{exploreId}/runUnderlyingDataQuery',
      {
        params: {
          path: {
            projectUuid: parsedArgs.projectUuid,
            exploreId: parsedArgs.exploreId,
          },
        },
        body: queryBody,
      }
    );
    if (error) {
      // DEBUG: Log the exact error from Lightdash API
      console.log('🔍 DEBUG: Lightdash API error details:');
      console.log('  Error object:', JSON.stringify(error, null, 2));
      console.log('  Error name:', error.error?.name);
      console.log('  Error message:', error.error?.message);
      console.log('  Error data:', error.error?.data);
      
      throw new Error(createEnhancedErrorMessage(error));
    }
    return data;
  });

  // Parse the nested response format according to the roadmap
  // Response format: rows[].fieldId.value.raw
  const parsedResult = {
    ...result.results,
    rows: result.results.rows?.map((row: any) => {
      const parsedRow: any = {};
      for (const [fieldId, fieldData] of Object.entries(row)) {
        if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
          const valueData = (fieldData as any).value;
          parsedRow[fieldId] = {
            raw: valueData?.raw,
            formatted: valueData?.formatted,
          };
        } else {
          // Fallback for unexpected format
          parsedRow[fieldId] = fieldData;
        }
      }
      return parsedRow;
    }) || [],
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(parsedResult, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_catalog_search tool
 */
export async function handleGetCatalogSearch(args: any) {
  const parsedArgs = GetCatalogSearchRequestSchema.parse(args);
  
  // Build query parameters for catalog search
  const queryParams = new URLSearchParams();
  
  if (parsedArgs.search) {
    queryParams.append('search', parsedArgs.search);
  }
  
  if (parsedArgs.type) {
    queryParams.append('type', parsedArgs.type);
  }
  
  if (parsedArgs.limit) {
    queryParams.append('limit', parsedArgs.limit.toString());
  }
  
  if (parsedArgs.page) {
    queryParams.append('page', parsedArgs.page.toString());
  }

  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.GET(
      '/api/v1/projects/{projectUuid}/dataCatalog',
      {
        params: {
          path: {
            projectUuid: parsedArgs.projectUuid,
          },
          query: Object.fromEntries(queryParams.entries()),
        },
      }
    );
    if (error) {
      throw new Error(
        `Lightdash API error: ${error.error.name}, ${
          error.error.message ?? 'no message'
        }`
      );
    }
    return data;
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_explore_with_full_schema tool
 */
export async function handleGetExploreWithFullSchema(args: any) {
  const parsedArgs = GetExploreWithFullSchemaRequestSchema.parse(args);

  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.GET(
      '/api/v1/projects/{projectUuid}/explores/{exploreId}',
      {
        params: {
          path: {
            projectUuid: parsedArgs.projectUuid,
            exploreId: parsedArgs.exploreId,
          },
        },
      }
    );
    if (error) {
      throw new Error(
        `Lightdash API error: ${error.error.name}, ${
          error.error.message ?? 'no message'
        }`
      );
    }
    return data;
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_explores_summary tool
 */
export async function handleGetExploresSummary(args: any) {
  const parsedArgs = GetExploresSummaryRequestSchema.parse(args);

  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.GET(
      '/api/v1/projects/{projectUuid}/explores',
      {
        params: {
          path: {
            projectUuid: parsedArgs.projectUuid,
          },
        },
      }
    );
    if (error) {
      throw new Error(
        `Lightdash API error: ${error.error.name}, ${
          error.error.message ?? 'no message'
        }`
      );
    }
    return data;
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_saved_chart_results tool
 */
export async function handleGetSavedChartResults(args: any) {
  const parsedArgs = GetSavedChartResultsRequestSchema.parse(args);
  
  // Build the request body with optional parameters
  const requestBody: any = {};
  
  if (parsedArgs.invalidateCache !== undefined) {
    requestBody.invalidateCache = parsedArgs.invalidateCache;
  }
  
  if (parsedArgs.dashboardFilters) {
    requestBody.dashboardFilters = parsedArgs.dashboardFilters;
  }
  
  if (parsedArgs.dateZoomGranularity) {
    requestBody.dateZoomGranularity = parsedArgs.dateZoomGranularity;
  }

  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.POST(
      '/api/v1/saved/{chartUuid}/results',
      {
        params: {
          path: {
            chartUuid: parsedArgs.chartUuid,
          },
        },
        body: Object.keys(requestBody).length > 0 ? requestBody : undefined,
      }
    );
    if (error) {
      throw new Error(
        `Lightdash API error: ${error.error.name}, ${
          error.error.message ?? 'no message'
        }`
      );
    }
    return data;
  });

  // Parse the nested response format according to the roadmap
  // Response format: rows[].fieldId.value.raw (same as run_underlying_data_query)
  const parsedResult = {
    ...result.results,
    rows: result.results.rows?.map((row: any) => {
      const parsedRow: any = {};
      for (const [fieldId, fieldData] of Object.entries(row)) {
        if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
          const valueData = (fieldData as any).value;
          parsedRow[fieldId] = {
            raw: valueData?.raw,
            formatted: valueData?.formatted,
          };
        } else {
          // Fallback for unexpected format
          parsedRow[fieldId] = fieldData;
        }
      }
      return parsedRow;
    }) || [],
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(parsedResult, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_dashboard_by_uuid tool
 */
export async function handleGetDashboardByUuid(args: any) {
  const parsedArgs = GetDashboardByUuidRequestSchema.parse(args);

  const result = await withRetry(async () => {
    // Use fetch directly since this endpoint might not be in the typed client
    const response = await fetch(
      `${process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud'}/api/v1/dashboards/${parsedArgs.dashboardUuid}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (data.status === 'error') {
      throw new Error(`Lightdash API error: ${data.error.name}, ${data.error.message ?? 'no message'}`);
    }
    
    return data;
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify((result as any).results, null, 2),
      },
    ],
  };
}