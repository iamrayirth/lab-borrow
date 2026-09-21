import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma';
import { AppError } from '../../utils/AppError';
import type { LoginInput, RegisterInput } from './auth.schemas';

const SALT_ROUNDS = 12;

export async function registerStudent(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      college: input.college,
      passwordHash,
    },
  });
}

export async function authenticate(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.isDisabled) {
    throw AppError.forbidden('Your account has been disabled. Contact support.');
  }

  return user;
}

export async function authenticateAdmin(input: LoginInput) {
  const user = await authenticate(input);
  if (user.role !== 'ADMIN') {
    throw AppError.forbidden('Admin access required');
  }
  return user;
}
