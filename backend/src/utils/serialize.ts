import type { User } from '@prisma/client';

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college,
    profileImage: user.profileImage,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toOwnerSummary(user: User) {
  return {
    id: user.id,
    name: user.name,
    college: user.college,
  };
}
