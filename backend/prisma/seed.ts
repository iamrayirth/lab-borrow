import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const passwordHash = await hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@labborrow.dev' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@labborrow.dev',
      college: 'Lab Borrow HQ',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@college.edu' },
    update: {},
    create: {
      name: 'Alice Sharma',
      email: 'alice@college.edu',
      college: 'IIT Bombay',
      passwordHash,
      role: 'STUDENT',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@college.edu' },
    update: {},
    create: {
      name: 'Bob Verma',
      email: 'bob@college.edu',
      college: 'BITS Pilani',
      passwordHash,
      role: 'STUDENT',
    },
  });

  const existingComponents = await prisma.component.count();
  if (existingComponents === 0) {
    await prisma.component.create({
      data: {
        ownerId: alice.id,
        name: 'ESP32 Dev Board',
        category: 'MICROCONTROLLERS',
        description: 'ESP32-WROOM-32 development board, barely used, works great for IoT projects.',
        condition: 'LIKE_NEW',
        dailyPrice: 30,
        securityDeposit: 200,
        availability: 'AVAILABLE',
      },
    });

    await prisma.component.create({
      data: {
        ownerId: alice.id,
        name: 'Arduino Uno R3',
        category: 'DEVELOPMENT_BOARDS',
        description: 'Classic Arduino Uno R3, includes USB cable. Great for beginner projects.',
        condition: 'GOOD',
        dailyPrice: 20,
        securityDeposit: 150,
        availability: 'AVAILABLE',
      },
    });

    await prisma.component.create({
      data: {
        ownerId: bob.id,
        name: 'DHT22 Temperature & Humidity Sensor',
        category: 'SENSORS',
        description: 'Accurate temperature and humidity sensor with digital output.',
        condition: 'NEW',
        dailyPrice: 10,
        securityDeposit: 50,
        availability: 'AVAILABLE',
      },
    });

    await prisma.component.create({
      data: {
        ownerId: bob.id,
        name: 'L298N Motor Driver Module',
        category: 'MOTOR_DRIVERS',
        description: 'Dual H-bridge motor driver, works well for small robotics projects.',
        condition: 'USED',
        dailyPrice: 15,
        securityDeposit: 80,
        availability: 'AVAILABLE',
      },
    });
  }

  console.log('Seed complete:', { admin: admin.email, alice: alice.email, bob: bob.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
