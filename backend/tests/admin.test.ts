import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { resetDb, VALID_PASSWORD } from './helpers';

const app = createApp();

async function registerAndLogin(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({
    name: 'Student ' + email,
    email,
    password: VALID_PASSWORD,
    college: 'College',
  });
  return agent;
}

async function createAdmin(email: string) {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 12);
  return prisma.user.create({
    data: { name: 'Admin', email, college: 'HQ', passwordHash, role: 'ADMIN' },
  });
}

async function loginAdmin(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/admin/auth/login').send({ email, password: VALID_PASSWORD });
  return agent;
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Admin', () => {
  it('authenticates an admin user separately from student login', async () => {
    await createAdmin('admin1@labborrow.dev');
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin1@labborrow.dev', password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.headers['set-cookie']?.[0]).toMatch(/admin_token=/);
  });

  it('rejects a student attempting to log in through the admin endpoint', async () => {
    await registerAndLogin('notadmin@college.edu');
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'notadmin@college.edu', password: VALID_PASSWORD });

    expect(res.status).toBe(403);
  });

  it('denies a student session access to admin endpoints', async () => {
    const student = await registerAndLogin('student@college.edu');
    const res = await student.get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('denies access to admin endpoints with no session at all', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('allows an admin to list users and disable one', async () => {
    await createAdmin('admin2@labborrow.dev');
    const admin = await loginAdmin('admin2@labborrow.dev');
    const student = await registerAndLogin('tobedisabled@college.edu');
    const studentMe = await student.get('/api/auth/me');
    const studentId = studentMe.body.user.id;

    const list = await admin.get('/api/admin/users');
    expect(list.status).toBe(200);
    expect(list.body.items.some((u: { id: string }) => u.id === studentId)).toBe(true);

    const disable = await admin.patch(`/api/admin/users/${studentId}`).send({ isDisabled: true });
    expect(disable.status).toBe(200);
    expect(disable.body.user.isDisabled).toBe(true);

    const blocked = await student.get('/api/auth/me');
    expect(blocked.status).toBe(403);
  });

  it('allows an admin to disable a component listing', async () => {
    await createAdmin('admin3@labborrow.dev');
    const admin = await loginAdmin('admin3@labborrow.dev');
    const owner = await registerAndLogin('listingowner@college.edu');
    const component = await owner.post('/api/components').send({
      name: 'ESP32',
      category: 'MICROCONTROLLERS',
      description: 'A description that is long enough.',
      condition: 'GOOD',
      dailyPrice: 20,
      securityDeposit: 100,
    });

    const res = await admin
      .patch(`/api/admin/components/${component.body.component.id}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.component.isActive).toBe(false);

    const publicView = await request(app).get('/api/components');
    const ids = publicView.body.items.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(component.body.component.id);
  });
});
