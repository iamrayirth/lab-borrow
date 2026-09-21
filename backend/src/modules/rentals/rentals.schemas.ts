import { z } from 'zod';

const isoDate = z.coerce.date();

export const createRentalSchema = z
  .object({
    componentId: z.string().min(1, 'componentId is required'),
    startDate: isoDate,
    endDate: isoDate,
    message: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.endDate.getTime() >= data.startDate.getTime(), {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

export const RENTAL_ACTION_STATUSES = ['ACTIVE', 'REJECTED', 'CANCELLED', 'RETURN_REQUESTED', 'COMPLETED'] as const;

export const updateRentalStatusSchema = z.object({
  status: z.enum(RENTAL_ACTION_STATUSES),
});

export const listRentalsQuerySchema = z.object({
  role: z.enum(['renter', 'owner']).default('renter'),
  status: z.string().trim().optional(),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>;
export type ListRentalsQuery = z.infer<typeof listRentalsQuerySchema>;
