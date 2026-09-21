import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../utils/validate';
import { createReportSchema } from './reports.schemas';
import { createReport } from './reports.controller';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.post('/', validateBody(createReportSchema), createReport);
