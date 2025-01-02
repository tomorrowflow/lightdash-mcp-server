import { z } from 'zod';

export const ListProjectsSchema = z.object({});

export const GetProjectSchema = z.object({
  projectUuid: z.string(),
});

export const ListSpacesSchema = z.object({
  projectUuid: z.string(),
});

export const ListChartsSchema = z.object({
  projectUuid: z.string(),
});

export const ListDashboardsSchema = z.object({
  projectUuid: z.string(),
});
