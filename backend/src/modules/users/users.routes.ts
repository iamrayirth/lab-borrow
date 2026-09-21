import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { uploadComponentImage } from '../../middleware/upload';
import { validateBody } from '../../utils/validate';
import { updateProfileSchema } from './users.schemas';
import { getProfile, updateProfile, uploadProfileImage } from './users.controller';

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get('/', getProfile);
profileRouter.patch('/', validateBody(updateProfileSchema), updateProfile);
profileRouter.post('/image', uploadComponentImage.single('image'), uploadProfileImage);
