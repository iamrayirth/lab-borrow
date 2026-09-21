import { z } from 'zod';

export const createReportSchema = z
  .object({
    targetType: z.enum(['USER', 'COMPONENT']),
    targetId: z.string().min(1, 'targetId is required'),
    reason: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(2000),
  })
  .transform((data) => ({
    targetType: data.targetType,
    reason: data.reason,
    description: data.description,
    targetUserId: data.targetType === 'USER' ? data.targetId : undefined,
    targetComponentId: data.targetType === 'COMPONENT' ? data.targetId : undefined,
  }));

export type CreateReportInput = z.infer<typeof createReportSchema>;
