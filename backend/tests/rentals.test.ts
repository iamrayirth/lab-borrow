import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { futureDate, resetDb, VALID_PASSWORD } from './helpers';

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

describe('Rentals', () => {
  it('creates a rental request with a correct price calculation', async () => {
    const owner = await registerAndLogin('rowner1@college.edu');
    const renter = await registerAndLogin('renter1@college.edu');
    const component = await owner.post('/api/components').send(validComponent);

    const res = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(3),
      message: 'Need it for a project',
    });

    expect(res.status).toBe(201);
    expect(res.body.rental.status).toBe('PENDING');
    expect(res.body.rental.days).toBe(3);
    expect(res.body.rental.rentalAmount).toBe('90');
    expect(res.body.rental.totalAmount).toBe('290');
  });

  it('prevents a user from renting their own component', async () => {
    const owner = await registerAndLogin('rowner2@college.edu');
    const component = await owner.post('/api/components').send(validComponent);

    const res = await owner.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(3),
    });

    expect(res.status).toBe(400);
  });

  it('prevents renting an inactive (deactivated) component', async () => {
    const owner = await registerAndLogin('rowner3@college.edu');
    const renter = await registerAndLogin('renter3@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    await owner.delete(`/api/components/${component.body.component.id}`);

    const res = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(3),
    });

    expect(res.status).toBe(400);
  });

  it('prevents overlapping rentals for the same component and dates', async () => {
    const owner = await registerAndLogin('rowner4@college.edu');
    const renterA = await registerAndLogin('rentera4@college.edu');
    const renterB = await registerAndLogin('renterb4@college.edu');
    const component = await owner.post('/api/components').send(validComponent);

    const first = await renterA.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(5),
      endDate: futureDate(10),
    });
    expect(first.status).toBe(201);

    const overlapping = await renterB.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(8),
      endDate: futureDate(12),
    });
    expect(overlapping.status).toBe(409);

    const nonOverlapping = await renterB.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(11),
      endDate: futureDate(14),
    });
    expect(nonOverlapping.status).toBe(201);
  });

  it('lets the owner accept a request, activating the rental', async () => {
    const owner = await registerAndLogin('rowner5@college.edu');
    const renter = await registerAndLogin('renter5@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    const res = await owner
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.rental.status).toBe('ACTIVE');

    const componentCheck = await request(app).get(`/api/components/${component.body.component.id}`);
    expect(componentCheck.body.component.availability).toBe('RENTED');
  });

  it('lets the owner reject a pending request', async () => {
    const owner = await registerAndLogin('rowner6@college.edu');
    const renter = await registerAndLogin('renter6@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    const res = await owner
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(200);
    expect(res.body.rental.status).toBe('REJECTED');
  });

  it('prevents the renter from accepting their own request', async () => {
    const owner = await registerAndLogin('rowner7@college.edu');
    const renter = await registerAndLogin('renter7@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    const res = await renter
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(403);
  });

  it('lets the renter cancel a pending request', async () => {
    const owner = await registerAndLogin('rowner8@college.edu');
    const renter = await registerAndLogin('renter8@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    const res = await renter
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.rental.status).toBe('CANCELLED');
  });

  it('completes the full return workflow and frees up the component', async () => {
    const owner = await registerAndLogin('rowner9@college.edu');
    const renter = await registerAndLogin('renter9@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    await owner.patch(`/api/rentals/${rental.body.rental.id}/status`).send({ status: 'ACTIVE' });

    const returnReq = await renter
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'RETURN_REQUESTED' });
    expect(returnReq.status).toBe(200);
    expect(returnReq.body.rental.status).toBe('RETURN_REQUESTED');

    const confirmed = await owner
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'COMPLETED' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.rental.status).toBe('COMPLETED');

    const componentCheck = await request(app).get(`/api/components/${component.body.component.id}`);
    expect(componentCheck.body.component.availability).toBe('AVAILABLE');
  });

  it('rejects an invalid status transition', async () => {
    const owner = await registerAndLogin('rowner10@college.edu');
    const renter = await registerAndLogin('renter10@college.edu');
    const component = await owner.post('/api/components').send(validComponent);
    const rental = await renter.post('/api/rentals').send({
      componentId: component.body.component.id,
      startDate: futureDate(1),
      endDate: futureDate(2),
    });

    const res = await owner
      .patch(`/api/rentals/${rental.body.rental.id}/status`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(409);
  });
});
