import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { optionalAuth } from '../../middleware/optionalAuth';
import { uploadComponentImage } from '../../middleware/upload';
import { validateBody, validateQuery } from '../../utils/validate';
import { createComponentSchema, listComponentsQuerySchema, updateComponentSchema } from './components.schemas';
import {
  createComponent,
  deactivateComponent,
  deleteComponentImage,
  getComponent,
  listComponents,
  updateComponent,
  uploadComponentImageHandler,
} from './components.controller';

export const componentsRouter = Router();

componentsRouter.get('/', optionalAuth, validateQuery(listComponentsQuerySchema), listComponents);
componentsRouter.get('/:id', optionalAuth, getComponent);
componentsRouter.post('/', requireAuth, validateBody(createComponentSchema), createComponent);
componentsRouter.patch('/:id', requireAuth, validateBody(updateComponentSchema), updateComponent);
componentsRouter.delete('/:id', requireAuth, deactivateComponent);
componentsRouter.post('/:id/images', requireAuth, uploadComponentImage.single('image'), uploadComponentImageHandler);
componentsRouter.delete('/:id/images/:imageId', requireAuth, deleteComponentImage);
