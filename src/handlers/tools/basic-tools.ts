/**
 * Basic Lightdash API tool handlers
 * Handles fundamental operations like listing projects, spaces, charts, etc.
 */

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { lightdashClient } from '../../client/lightdash-client.js';
import { withRetry } from '../../utils/retry.js';
import {
  ListProjectsRequestSchema,
  GetProjectRequestSchema,
  ListSpacesRequestSchema,
  ListChartsRequestSchema,
  ListDashboardsRequestSchema,
  GetCustomMetricsRequestSchema,
  GetCatalogRequestSchema,
  GetMetricsCatalogRequestSchema,
  GetChartsAsCodeRequestSchema,
  GetDashboardsAsCodeRequestSchema,
  GetMetadataRequestSchema,
  GetAnalyticsRequestSchema,
  GetUserAttributesRequestSchema,
} from '../../schemas.js';

/**
 * Handle lightdash_list_projects tool
 */
export async function handleListProjects() {
  const result = await withRetry(async () => {
    const { data, error } = await lightdashClient.GET(
      '/api/v1/org/projects',
      {}
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
 * Handle lightdash_get_project tool
 */
export async function handleGetProject(args: any) {
  const parsedArgs = GetProjectRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_list_spaces tool
 */
export async function handleListSpaces(args: any) {
  const parsedArgs = ListSpacesRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/spaces',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_list_charts tool
 */
export async function handleListCharts(args: any) {
  const parsedArgs = ListChartsRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/charts',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_list_dashboards tool
 */
export async function handleListDashboards(args: any) {
  const parsedArgs = ListDashboardsRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dashboards',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_custom_metrics tool
 */
export async function handleGetCustomMetrics(args: any) {
  const parsedArgs = GetCustomMetricsRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/custom-metrics',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_catalog tool
 */
export async function handleGetCatalog(args: any) {
  const parsedArgs = GetCatalogRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dataCatalog',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_metrics_catalog tool
 */
export async function handleGetMetricsCatalog(args: any) {
  const parsedArgs = GetMetricsCatalogRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dataCatalog/metrics',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_charts_as_code tool
 */
export async function handleGetChartsAsCode(args: any) {
  const parsedArgs = GetChartsAsCodeRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/charts/code',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_dashboards_as_code tool
 */
export async function handleGetDashboardsAsCode(args: any) {
  const parsedArgs = GetDashboardsAsCodeRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dashboards/code',
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_metadata tool
 */
export async function handleGetMetadata(args: any) {
  const parsedArgs = GetMetadataRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dataCatalog/{table}/metadata',
    {
      params: {
        path: {
          projectUuid: parsedArgs.projectUuid,
          table: parsedArgs.table,
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_analytics tool
 */
export async function handleGetAnalytics(args: any) {
  const parsedArgs = GetAnalyticsRequestSchema.parse(args);
  const { data, error } = await lightdashClient.GET(
    '/api/v1/projects/{projectUuid}/dataCatalog/{table}/analytics',
    {
      params: {
        path: {
          projectUuid: parsedArgs.projectUuid,
          table: parsedArgs.table,
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
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}

/**
 * Handle lightdash_get_user_attributes tool
 */
export async function handleGetUserAttributes() {
  const { data, error } = await lightdashClient.GET(
    '/api/v1/org/attributes',
    {}
  );
  if (error) {
    throw new Error(
      `Lightdash API error: ${error.error.name}, ${
        error.error.message ?? 'no message'
      }`
    );
  }
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data.results, null, 2),
      },
    ],
  };
}