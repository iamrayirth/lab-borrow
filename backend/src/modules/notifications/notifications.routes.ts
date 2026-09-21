import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { listNotifications, markNotificationRead } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get('/', listNotifications);
notificationsRouter.patch('/:id/read', markNotificationRead);
