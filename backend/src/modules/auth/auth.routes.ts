import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../utils/validate';
import { loginSchema, registerSchema } from './auth.schemas';
import { login, logout, me, register } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validateBody(registerSchema), register);
authRouter.post('/login', authRateLimiter, validateBody(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
