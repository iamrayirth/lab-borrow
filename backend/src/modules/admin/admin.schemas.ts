import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateUserStatusSchema = z.object({
  isDisabled: z.boolean(),
});

export const updateComponentStatusSchema = z.object({
  isActive: z.boolean(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
