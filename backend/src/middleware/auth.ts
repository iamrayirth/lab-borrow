import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyAdminToken, verifyUserToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  college: string;
  profileImage: string | null;
  role: Role;
  isDisabled: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const USER_COOKIE = 'token';
export const ADMIN_COOKIE = 'admin_token';

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[USER_COOKIE];
  if (!token) {
    throw AppError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyUserToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired session');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw AppError.unauthorized('Invalid or expired session');
  }
  if (user.isDisabled) {
    throw AppError.forbidden('Your account has been disabled');
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college,
    profileImage: user.profileImage,
    role: user.role,
    isDisabled: user.isDisabled,
  };
  next();
});

export const requireAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    throw AppError.unauthorized('Admin authentication required');
  }

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired admin session');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.role !== 'ADMIN') {
    throw AppError.forbidden('Admin access required');
  }
  if (user.isDisabled) {
    throw AppError.forbidden('Your admin account has been disabled');
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college,
    profileImage: user.profileImage,
    role: user.role,
    isDisabled: user.isDisabled,
  };
  next();
});
