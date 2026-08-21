process.env.JWT_SECRET = 'test-secret';
jest.mock('../../src/models/user.model');
const { createUser, findUserByEmail } = require('../../src/models/user.model');
const { hashPassword } = require('../../src/utils/password.util');
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 201 and the created user', async () => {
    createUser.mockResolvedValue({ id: '1', email: 'arvin@example.com', name: 'Arvin' });
    findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'arvin@example.com', password: 'secret123', name: 'Arvin' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: '1', email: 'arvin@example.com', name: 'Arvin' });
  });

  test('does not store the plain password', async () => {
    createUser.mockResolvedValue({ id: '1', email: 'arvin@example.com', name: 'Arvin' });
    findUserByEmail.mockResolvedValue(null);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'arvin@example.com', password: 'secret123', name: 'Arvin' });

    expect(createUser.mock.calls[0][0].passwordHash).not.toBe('secret123');
  });

  test('returns 409 when email is already registered', async () => {
    findUserByEmail.mockResolvedValue({ id: '1', email: 'arvin@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'arvin@example.com', password: 'secret123', name: 'Arvin' });

    expect(res.status).toBe(409);
  });

  test('rejects a malformed email with 400 before touching the database', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bukan-email', password: 'secret123', name: 'Arvin' });

    expect(res.status).toBe(400);
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  test('rejects a password shorter than 8 characters with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'arvin@example.com', password: 'pendek', name: 'Arvin' });

    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  test('looks up and stores the email in lowercase', async () => {
    createUser.mockResolvedValue({ id: '1', email: 'arvin@example.com', name: 'Arvin' });
    findUserByEmail.mockResolvedValue(null);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'Arvin@Example.COM', password: 'secret123', name: 'Arvin' });

    expect(findUserByEmail).toHaveBeenCalledWith('arvin@example.com');
    expect(createUser.mock.calls[0][0].email).toBe('arvin@example.com');
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'arvin@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with a token for correct credentials', async () => {
    const passwordHash = await hashPassword('secret123');
    findUserByEmail.mockResolvedValue({ id: '1', email: 'arvin@example.com', password_hash: passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'arvin@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('returns 401 for wrong password', async () => {
    const passwordHash = await hashPassword('secret123');
    findUserByEmail.mockResolvedValue({ id: '1', email: 'arvin@example.com', password_hash: passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'arvin@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  test('returns 401 when user does not exist', async () => {
    findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  test('finds the account even when the email casing differs', async () => {
    findUserByEmail.mockResolvedValue({
      id: '1',
      email: 'arvin@example.com',
      password_hash: await hashPassword('secret123'),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ARVIN@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(findUserByEmail).toHaveBeenCalledWith('arvin@example.com');
  });

  test('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'arvin@example.com' });
    expect(res.status).toBe(400);
  });
});
