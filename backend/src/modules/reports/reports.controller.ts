import type { Request, Response } from 'express';
import { prisma } from '../../database/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  const { targetType, targetUserId, targetComponentId, reason, description } = req.body;

  if (targetType === 'USER') {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw AppError.notFound('Reported user not found');
  } else {
    const component = await prisma.component.findUnique({ where: { id: targetComponentId } });
    if (!component) throw AppError.notFound('Reported component not found');
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user!.id,
      targetType,
      targetUserId,
      targetComponentId,
      reason,
      description,
    },
  });
  res.status(201).json({ report });
});
