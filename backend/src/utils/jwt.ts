import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
}

export function signUserToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyUserToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function signAdminToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.adminJwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): TokenPayload {
  return jwt.verify(token, config.adminJwtSecret) as TokenPayload;
}
