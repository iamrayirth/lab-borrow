import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    college: z.string().trim().min(2).max(150).optional(),
    profileImage: z.string().trim().url().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
