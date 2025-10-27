import { z } from 'zod';

export const ListProjectsRequestSchema = z.object({});

export const GetProjectRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListSpacesRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListChartsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListDashboardsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCustomMetricsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCatalogRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetricsCatalogRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetChartsAsCodeRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetDashboardsAsCodeRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetadataRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string().min(1, 'Table name cannot be empty'),
});

export const GetAnalyticsRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string(),
});

export const GetUserAttributesRequestSchema = z.object({});

export const GetCatalogSearchRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  search: z
    .string()
    .optional()
    .describe('Search term to filter catalog items by name, label, or description'),
  type: z
    .enum(['field', 'table', 'dashboard', 'space', 'chart'])
    .optional()
    .describe('Filter results by catalog item type'),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Maximum number of results to return (default: 100, max: 1000)'),
  page: z
    .number()
    .min(1)
    .optional()
    .default(1)
    .describe('Page number for pagination (default: 1)'),
});

// Filter group schema for complex filtering
const FilterGroupSchema = z.object({
  id: z.string(),
  and: z.array(z.object({
    id: z.string(),
    target: z.object({
      fieldId: z.string(),
    }),
    operator: z.string(),
    values: z.array(z.union([z.string(), z.number()])),
  })).optional(),
  or: z.array(z.object({
    id: z.string(),
    target: z.object({
      fieldId: z.string(),
    }),
    operator: z.string(),
    values: z.array(z.union([z.string(), z.number()])),
  })).optional(),
});

// Sort schema
const SortSchema = z.object({
  fieldId: z.string().describe('The field ID to sort by'),
  descending: z.boolean().describe('Whether to sort in descending order'),
});

export const RunUnderlyingDataQueryRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  exploreId: z
    .string()
    .min(1, 'Explore ID cannot be empty')
    .describe('The explore/table name to query'),
  dimensions: z
    .array(z.string())
    .optional()
    .describe('Array of dimension field IDs to include in the query'),
  metrics: z
    .array(z.string())
    .optional()
    .describe('Array of metric field IDs to include in the query'),
  filters: z
    .object({
      dimensions: FilterGroupSchema.optional(),
      metrics: FilterGroupSchema.optional(),
    })
    .optional()
    .describe('Filters to apply to dimensions and metrics'),
  sorts: z
    .array(SortSchema)
    .optional()
    .describe('Sort configuration for the query results'),
  limit: z
    .number()
    .min(1)
    .max(5000)
    .optional()
    .default(500)
    .describe('Maximum number of rows to return (default: 500, max: 5000)'),
  tableCalculations: z
    .array(z.any())
    .optional()
    .describe('Custom table calculations to include'),
});

export const GetExploreWithFullSchemaRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
  exploreId: z
    .string()
    .min(1, 'Explore ID cannot be empty')
    .describe('The ID/name of the explore to get the full schema for'),
});

export const GetExploresSummaryRequestSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe('The UUID of the project. You can obtain it from the project list.'),
});

export const GetSavedChartResultsRequestSchema = z.object({
  chartUuid: z
    .string()
    .uuid()
    .describe('The UUID of the saved chart to get results from'),
  invalidateCache: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to force refresh the cache (default: false)'),
  dashboardFilters: z
    .object({
      dimensions: z.array(z.any()).optional(),
      metrics: z.array(z.any()).optional(),
    })
    .optional()
    .describe('Optional dashboard filters to override'),
  dateZoomGranularity: z
    .string()
    .optional()
    .describe('Optional time granularity for date zoom'),
});

export const GetDashboardByUuidRequestSchema = z.object({
  dashboardUuid: z
    .string()
    .uuid()
    .describe('The UUID of the dashboard to retrieve'),
});
