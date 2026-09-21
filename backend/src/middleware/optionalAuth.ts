import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyUserToken } from '../utils/jwt';
import { USER_COOKIE } from './auth';

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[USER_COOKIE];
  if (!token) {
    return next();
  }

  try {
    const payload = verifyUserToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user && !user.isDisabled) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        profileImage: user.profileImage,
        role: user.role,
        isDisabled: user.isDisabled,
      };
    }
  } catch {
    // Invalid token on an optional-auth route: proceed as anonymous.
  }
  next();
});
