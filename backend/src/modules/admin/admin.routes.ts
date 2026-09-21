import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimit';
import { validateBody, validateQuery } from '../../utils/validate';
import { loginSchema } from '../auth/auth.schemas';
import { paginationQuerySchema, updateComponentStatusSchema, updateUserStatusSchema } from './admin.schemas';
import {
  adminLogin,
  adminLogout,
  adminMe,
  listComponentsAdmin,
  listRentalsAdmin,
  listReportsAdmin,
  listUsers,
  updateComponentStatus,
  updateUserStatus,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), adminLogin);
adminRouter.post('/auth/logout', adminLogout);
adminRouter.get('/auth/me', requireAdmin, adminMe);

adminRouter.get('/users', requireAdmin, validateQuery(paginationQuerySchema), listUsers);
adminRouter.patch('/users/:id', requireAdmin, validateBody(updateUserStatusSchema), updateUserStatus);

adminRouter.get('/components', requireAdmin, validateQuery(paginationQuerySchema), listComponentsAdmin);
adminRouter.patch('/components/:id', requireAdmin, validateBody(updateComponentStatusSchema), updateComponentStatus);

adminRouter.get('/rentals', requireAdmin, validateQuery(paginationQuerySchema), listRentalsAdmin);
adminRouter.get('/reports', requireAdmin, validateQuery(paginationQuerySchema), listReportsAdmin);
