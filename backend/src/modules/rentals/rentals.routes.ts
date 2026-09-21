import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../utils/validate';
import { createRentalSchema, listRentalsQuerySchema, updateRentalStatusSchema } from './rentals.schemas';
import { createRental, getRental, listRentals, updateRentalStatus } from './rentals.controller';

export const rentalsRouter = Router();

rentalsRouter.use(requireAuth);
rentalsRouter.post('/', validateBody(createRentalSchema), createRental);
rentalsRouter.get('/', validateQuery(listRentalsQuerySchema), listRentals);
rentalsRouter.get('/:id', getRental);
rentalsRouter.patch('/:id/status', validateBody(updateRentalStatusSchema), updateRentalStatus);
