import { z } from 'zod';
import { ComponentCategory, ComponentCondition } from '@prisma/client';

export const createComponentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  category: z.nativeEnum(ComponentCategory),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  condition: z.nativeEnum(ComponentCondition),
  dailyPrice: z.coerce.number().positive('Daily price must be greater than 0').max(100000),
  securityDeposit: z.coerce.number().min(0, 'Security deposit cannot be negative').max(500000),
});

export const updateComponentSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    category: z.nativeEnum(ComponentCategory).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    condition: z.nativeEnum(ComponentCondition).optional(),
    dailyPrice: z.coerce.number().positive().max(100000).optional(),
    securityDeposit: z.coerce.number().min(0).max(500000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const listComponentsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  category: z.nativeEnum(ComponentCategory).optional(),
  availability: z.enum(['AVAILABLE', 'RENTED', 'INACTIVE']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
export type ListComponentsQuery = z.infer<typeof listComponentsQuerySchema>;
