import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { setAuthCookie, clearAuthCookie } from '../../utils/cookies';
import { toPublicUser } from '../../utils/serialize';
import { signUserToken } from '../../utils/jwt';
import { USER_COOKIE } from '../../middleware/auth';
import { authenticate, registerStudent } from './auth.service';
import { prisma } from '../../database/prisma';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerStudent(req.body);
  const token = signUserToken({ userId: user.id });
  setAuthCookie(res, USER_COOKIE, token);
  res.status(201).json({ user: toPublicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await authenticate(req.body);
  const token = signUserToken({ userId: user.id });
  setAuthCookie(res, USER_COOKIE, token);
  res.json({ user: toPublicUser(user) });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res, USER_COOKIE);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw AppError.unauthorized();
  }
  res.json({ user: toPublicUser(user) });
});
