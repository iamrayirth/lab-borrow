import request from 'supertest';
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

const validComponent = {
  name: 'ESP32 Dev Board',
  category: 'MICROCONTROLLERS',
  description: 'A barely used ESP32 board, great condition.',
  condition: 'LIKE_NEW',
  dailyPrice: 30,
  securityDeposit: 200,
};

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Components', () => {
  it('creates a component listing for the authenticated owner', async () => {
    const owner = await registerAndLogin('owner1@college.edu');
    const res = await owner.post('/api/components').send(validComponent);

    expect(res.status).toBe(201);
    expect(res.body.component.name).toBe('ESP32 Dev Board');
    expect(res.body.component.availability).toBe('AVAILABLE');
  });

  it('rejects component creation without authentication', async () => {
    const res = await request(app).post('/api/components').send(validComponent);
    expect(res.status).toBe(401);
  });

  it('allows the owner to edit their own component', async () => {
    const owner = await registerAndLogin('owner2@college.edu');
    const created = await owner.post('/api/components').send(validComponent);

    const res = await owner
      .patch(`/api/components/${created.body.component.id}`)
      .send({ dailyPrice: 45 });

    expect(res.status).toBe(200);
    expect(res.body.component.dailyPrice).toBe('45');
  });

  it('prevents a different student from editing another user\'s component', async () => {
    const owner = await registerAndLogin('owner3@college.edu');
    const stranger = await registerAndLogin('stranger3@college.edu');
    const created = await owner.post('/api/components').send(validComponent);

    const res = await stranger
      .patch(`/api/components/${created.body.component.id}`)
      .send({ dailyPrice: 999 });

    expect(res.status).toBe(403);
  });

  it('deactivates a component (soft delete) without destroying it', async () => {
    const owner = await registerAndLogin('owner4@college.edu');
    const created = await owner.post('/api/components').send(validComponent);

    const res = await owner.delete(`/api/components/${created.body.component.id}`);
    expect(res.status).toBe(200);
    expect(res.body.component.isActive).toBe(false);

    const stillInDb = await prisma.component.findUnique({ where: { id: created.body.component.id } });
    expect(stillInDb).not.toBeNull();
  });

  it('hides deactivated components from public browsing', async () => {
    const owner = await registerAndLogin('owner5@college.edu');
    const created = await owner.post('/api/components').send(validComponent);
    await owner.delete(`/api/components/${created.body.component.id}`);

    const res = await request(app).get('/api/components');
    const ids = res.body.items.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.body.component.id);
  });

  it('supports searching components by name', async () => {
    const owner = await registerAndLogin('owner6@college.edu');
    await owner.post('/api/components').send(validComponent);
    await owner.post('/api/components').send({ ...validComponent, name: 'Arduino Uno' });

    const res = await request(app).get('/api/components').query({ search: 'Arduino' });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('Arduino Uno');
  });

  it('filters components by category', async () => {
    const owner = await registerAndLogin('owner7@college.edu');
    await owner.post('/api/components').send(validComponent);
    await owner.post('/api/components').send({ ...validComponent, name: 'DHT22', category: 'SENSORS' });

    const res = await request(app).get('/api/components').query({ category: 'SENSORS' });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].category).toBe('SENSORS');
  });
});
