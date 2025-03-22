import { z } from 'zod';

export const ListProjectsSchema = z.object({});

export const GetProjectSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListSpacesSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListChartsSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const ListDashboardsSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCustomMetricsSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetCatalogSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetricsCatalogSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetChartsAsCodeSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetDashboardsAsCodeSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
});

export const GetMetadataSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string().min(1, 'Table name cannot be empty'),
});

export const GetAnalyticsSchema = z.object({
  projectUuid: z
    .string()
    .uuid()
    .describe(
      'The UUID of the project. You can obtain it from the project list.'
    ),
  table: z.string(),
});

export const GetUserAttributesSchema = z.object({});
