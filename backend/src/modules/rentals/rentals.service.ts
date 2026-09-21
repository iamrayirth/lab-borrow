import type { Prisma, Rental, RentalStatus } from '@prisma/client';
import { Prisma as PrismaNS } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateRentalInput, ListRentalsQuery } from './rentals.schemas';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const rentalWithRelations = {
  component: { include: { owner: true, images: true } },
  renter: true,
} satisfies Prisma.RentalInclude;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcRentalDays(start: Date, end: Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY) + 1;
}

const NON_TERMINAL_STATUSES: RentalStatus[] = ['PENDING', 'ACTIVE', 'RETURN_REQUESTED'];

export async function createRental(renterId: string, input: CreateRentalInput) {
  const today = startOfDay(new Date());
  if (startOfDay(input.startDate).getTime() < today.getTime()) {
    throw AppError.badRequest('Start date cannot be in the past');
  }

  const days = calcRentalDays(input.startDate, input.endDate);
  if (days < 1) {
    throw AppError.badRequest('Rental duration must be at least 1 day');
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const component = await tx.component.findUnique({ where: { id: input.componentId } });
        if (!component) {
          throw AppError.notFound('Component not found');
        }
        if (!component.isActive) {
          throw AppError.badRequest('This component is not available for rent');
        }
        if (component.ownerId === renterId) {
          throw AppError.badRequest('You cannot rent your own component');
        }

        const overlapping = await tx.rental.findFirst({
          where: {
            componentId: input.componentId,
            status: { in: NON_TERMINAL_STATUSES },
            startDate: { lte: input.endDate },
            endDate: { gte: input.startDate },
          },
        });
        if (overlapping) {
          throw AppError.conflict('This component is already requested or rented for the selected dates');
        }

        const dailyPrice = Number(component.dailyPrice);
        const securityDeposit = Number(component.securityDeposit);
        const rentalAmount = Math.round(dailyPrice * days * 100) / 100;
        const totalAmount = Math.round((rentalAmount + securityDeposit) * 100) / 100;

        const rental = await tx.rental.create({
          data: {
            componentId: input.componentId,
            renterId,
            startDate: input.startDate,
            endDate: input.endDate,
            message: input.message,
            days,
            rentalAmount,
            securityDeposit,
            totalAmount,
          },
          include: rentalWithRelations,
        });

        await tx.notification.create({
          data: {
            userId: component.ownerId,
            type: 'RENTAL_REQUEST_RECEIVED',
            message: `${rental.renter.name} requested to rent your "${component.name}"`,
            relatedRentalId: rental.id,
          },
        });

        return rental;
      },
      { isolationLevel: PrismaNS.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof PrismaNS.PrismaClientKnownRequestError && err.code === 'P2034') {
      throw AppError.conflict('This component was just booked for overlapping dates. Please try again.');
    }
    throw err;
  }
}

export async function listRentals(userId: string, query: ListRentalsQuery) {
  const statusFilter = query.status
    ? (query.status.split(',').map((s) => s.trim()) as RentalStatus[])
    : undefined;

  const where: Prisma.RentalWhereInput =
    query.role === 'owner' ? { component: { ownerId: userId } } : { renterId: userId };

  if (statusFilter?.length) {
    where.status = { in: statusFilter };
  }

  return prisma.rental.findMany({
    where,
    include: rentalWithRelations,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRentalById(rentalId: string, userId: string) {
  const rental = await prisma.rental.findUnique({ where: { id: rentalId }, include: rentalWithRelations });
  if (!rental) {
    throw AppError.notFound('Rental not found');
  }
  const isRenter = rental.renterId === userId;
  const isOwner = rental.component.ownerId === userId;
  if (!isRenter && !isOwner) {
    throw AppError.forbidden('You do not have access to this rental');
  }
  return rental;
}

type TransitionHandler = (tx: Prisma.TransactionClient, rental: Rental & { component: { ownerId: string; name: string; isActive: boolean }; renter: { name: string } }, userId: string) => Promise<void>;

const TRANSITIONS: Record<string, { from: RentalStatus; requireRole: 'owner' | 'renter'; handler: TransitionHandler }> = {
  ACTIVE: {
    from: 'PENDING',
    requireRole: 'owner',
    handler: async (tx, rental) => {
      await tx.component.update({ where: { id: rental.componentId }, data: { availability: 'RENTED' } });
      await tx.notification.create({
        data: {
          userId: rental.renterId,
          type: 'REQUEST_ACCEPTED',
          message: `Your request for "${rental.component.name}" was accepted`,
          relatedRentalId: rental.id,
        },
      });
    },
  },
  REJECTED: {
    from: 'PENDING',
    requireRole: 'owner',
    handler: async (tx, rental) => {
      await tx.notification.create({
        data: {
          userId: rental.renterId,
          type: 'REQUEST_REJECTED',
          message: `Your request for "${rental.component.name}" was rejected`,
          relatedRentalId: rental.id,
        },
      });
    },
  },
  CANCELLED: {
    from: 'PENDING',
    requireRole: 'renter',
    handler: async () => {
      // No component state to revert; it was never reserved for a PENDING request.
    },
  },
  RETURN_REQUESTED: {
    from: 'ACTIVE',
    requireRole: 'renter',
    handler: async (tx, rental) => {
      await tx.notification.create({
        data: {
          userId: rental.component.ownerId,
          type: 'RETURN_REQUESTED',
          message: `${rental.renter.name} requested to return "${rental.component.name}"`,
          relatedRentalId: rental.id,
        },
      });
    },
  },
  COMPLETED: {
    from: 'RETURN_REQUESTED',
    requireRole: 'owner',
    handler: async (tx, rental) => {
      await tx.component.update({
        where: { id: rental.componentId },
        data: { availability: rental.component.isActive ? 'AVAILABLE' : 'INACTIVE' },
      });
      await tx.notification.create({
        data: {
          userId: rental.renterId,
          type: 'RENTAL_COMPLETED',
          message: `Your rental of "${rental.component.name}" is complete`,
          relatedRentalId: rental.id,
        },
      });
    },
  },
};

export async function updateRentalStatus(rentalId: string, userId: string, targetStatus: string) {
  const transition = TRANSITIONS[targetStatus];
  if (!transition) {
    throw AppError.badRequest(`Unsupported status transition: ${targetStatus}`);
  }

  return prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { component: true, renter: true },
    });
    if (!rental) {
      throw AppError.notFound('Rental not found');
    }

    const isOwner = rental.component.ownerId === userId;
    const isRenter = rental.renterId === userId;
    if (transition.requireRole === 'owner' && !isOwner) {
      throw AppError.forbidden('Only the component owner can perform this action');
    }
    if (transition.requireRole === 'renter' && !isRenter) {
      throw AppError.forbidden('Only the renter can perform this action');
    }

    if (rental.status !== transition.from) {
      throw AppError.conflict(
        `Cannot move rental from ${rental.status} to ${targetStatus}`,
      );
    }

    await transition.handler(tx, rental, userId);

    return tx.rental.update({
      where: { id: rentalId },
      data: { status: targetStatus as RentalStatus },
      include: rentalWithRelations,
    });
  });
}
