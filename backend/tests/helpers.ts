import { prisma } from '../src/database/prisma';

export async function resetDb() {
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.componentImage.deleteMany();
  await prisma.component.deleteMany();
  await prisma.user.deleteMany();
}

export function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export const VALID_PASSWORD = 'Password123!';
