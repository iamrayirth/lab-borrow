import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { resetDb, VALID_PASSWORD } from './helpers';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth', () => {
  it('registers a new student', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'student@college.edu',
      password: VALID_PASSWORD,
      college: 'Test College',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('student@college.edu');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
  });

  it('rejects registration with a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'dup@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'dup@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    expect(res.status).toBe(409);
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak',
      email: 'weak@college.edu',
      password: '123',
      college: 'College',
    });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'login@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@college.edu', password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@college.edu');
  });

  it('rejects login with an invalid password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'badpass@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'badpass@college.edu', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('denies unauthorized access to /api/auth/me without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for an authenticated session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Me Test',
      email: 'me@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@college.edu');
  });

  it('logs out and clears the session cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Logout Test',
      email: 'logout@college.edu',
      password: VALID_PASSWORD,
      college: 'College',
    });

    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
