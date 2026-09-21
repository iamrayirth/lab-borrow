import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as rentalsService from './rentals.service';

function serializeRental(rental: Awaited<ReturnType<typeof rentalsService.getRentalById>>) {
  return {
    id: rental.id,
    status: rental.status,
    startDate: rental.startDate,
    endDate: rental.endDate,
    days: rental.days,
    message: rental.message,
    rentalAmount: rental.rentalAmount,
    securityDeposit: rental.securityDeposit,
    totalAmount: rental.totalAmount,
    createdAt: rental.createdAt,
    updatedAt: rental.updatedAt,
    renter: { id: rental.renter.id, name: rental.renter.name, college: rental.renter.college },
    component: {
      id: rental.component.id,
      name: rental.component.name,
      category: rental.component.category,
      condition: rental.component.condition,
      dailyPrice: rental.component.dailyPrice,
      images: rental.component.images.map((img) => ({ id: img.id, url: img.url })),
      ownerId: rental.component.ownerId,
      owner: { id: rental.component.owner.id, name: rental.component.owner.name },
    },
  };
}

export const createRental = asyncHandler(async (req: Request, res: Response) => {
  const rental = await rentalsService.createRental(req.user!.id, req.body);
  res.status(201).json({ rental: serializeRental(rental) });
});

export const listRentals = asyncHandler(async (req: Request, res: Response) => {
  const rentals = await rentalsService.listRentals(req.user!.id, req.query as never);
  res.json({ items: rentals.map(serializeRental) });
});

export const getRental = asyncHandler(async (req: Request, res: Response) => {
  const rental = await rentalsService.getRentalById(req.params.id, req.user!.id);
  res.json({ rental: serializeRental(rental) });
});

export const updateRentalStatus = asyncHandler(async (req: Request, res: Response) => {
  const rental = await rentalsService.updateRentalStatus(req.params.id, req.user!.id, req.body.status);
  res.json({ rental: serializeRental(rental) });
});
