import type { Request, Response } from 'express';
import { prisma } from '../../database/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { setAuthCookie, clearAuthCookie } from '../../utils/cookies';
import { toPublicUser } from '../../utils/serialize';
import { signAdminToken } from '../../utils/jwt';
import { ADMIN_COOKIE } from '../../middleware/auth';
import { authenticateAdmin } from '../auth/auth.service';
import type { User } from '@prisma/client';

function toAdminUser(user: User) {
  return { ...toPublicUser(user), isDisabled: user.isDisabled };
}

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const user = await authenticateAdmin(req.body);
  const token = signAdminToken({ userId: user.id });
  setAuthCookie(res, ADMIN_COOKIE, token);
  res.json({ user: toPublicUser(user) });
});

export const adminLogout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.status(204).send();
});

export const adminMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: toPublicUser(req.user as never) });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ]);
  res.json({ items: items.map(toAdminUser), total, page, limit });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw AppError.notFound('User not found');
  if (target.role === 'ADMIN') {
    throw AppError.badRequest('Cannot modify another admin account');
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isDisabled: req.body.isDisabled },
  });
  res.json({ user: toAdminUser(user) });
});

export const listComponentsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const [items, total] = await prisma.$transaction([
    prisma.component.findMany({
      include: { owner: true, images: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.component.count(),
  ]);
  res.json({
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      condition: c.condition,
      dailyPrice: c.dailyPrice,
      securityDeposit: c.securityDeposit,
      availability: c.availability,
      isActive: c.isActive,
      images: c.images.map((img) => ({ id: img.id, url: img.url })),
      owner: { id: c.owner.id, name: c.owner.name, email: c.owner.email },
      createdAt: c.createdAt,
    })),
    total,
    page,
    limit,
  });
});

export const updateComponentStatus = asyncHandler(async (req: Request, res: Response) => {
  const component = await prisma.component.findUnique({ where: { id: req.params.id } });
  if (!component) throw AppError.notFound('Component not found');
  const isActive: boolean = req.body.isActive;
  const availability = component.availability === 'RENTED' ? 'RENTED' : isActive ? 'AVAILABLE' : 'INACTIVE';
  const updated = await prisma.component.update({
    where: { id: req.params.id },
    data: { isActive, availability },
  });
  res.json({ component: updated });
});

export const listRentalsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const [items, total] = await prisma.$transaction([
    prisma.rental.findMany({
      include: { component: { include: { owner: true } }, renter: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rental.count(),
  ]);
  res.json({
    items: items.map((r) => ({
      id: r.id,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.days,
      totalAmount: r.totalAmount,
      component: { id: r.component.id, name: r.component.name },
      renter: { id: r.renter.id, name: r.renter.name },
      owner: { id: r.component.owner.id, name: r.component.owner.name },
      createdAt: r.createdAt,
    })),
    total,
    page,
    limit,
  });
});

export const listReportsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const [items, total] = await prisma.$transaction([
    prisma.report.findMany({
      include: { reporter: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count(),
  ]);

  const userIds = items.filter((r) => r.targetUserId).map((r) => r.targetUserId as string);
  const componentIds = items.filter((r) => r.targetComponentId).map((r) => r.targetComponentId as string);
  const [targetUsers, targetComponents] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } } }),
    prisma.component.findMany({ where: { id: { in: componentIds } } }),
  ]);

  res.json({
    items: items.map((r) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      targetType: r.targetType,
      reporter: { id: r.reporter.id, name: r.reporter.name },
      targetUser: r.targetUserId ? targetUsers.find((u) => u.id === r.targetUserId)?.name ?? null : null,
      targetComponent: r.targetComponentId
        ? targetComponents.find((c) => c.id === r.targetComponentId)?.name ?? null
        : null,
      createdAt: r.createdAt,
    })),
    total,
    page,
    limit,
  });
});
