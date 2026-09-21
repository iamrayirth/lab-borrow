import type { Request, Response } from 'express';
import { prisma } from '../../database/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { toPublicUser } from '../../utils/serialize';
import { publicUploadPath } from '../../middleware/upload';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw AppError.notFound('User not found');
  res.json({ user: toPublicUser(user) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: req.body,
  });
  res.json({ user: toPublicUser(user) });
});

export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No image file provided');
  }
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { profileImage: publicUploadPath(req.file.filename) },
  });
  res.json({ user: toPublicUser(user) });
});
