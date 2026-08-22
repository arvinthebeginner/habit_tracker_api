process.env.JWT_SECRET = 'test-secret';
jest.mock('../../src/models/user.model');
const { createUser, findUserByEmail, findUserById } = require('../../src/models/user.model');
const { hashPassword } = require('../../src/utils/password.util');
const { generateToken } = require('../../src/utils/jwt.util');
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

describe('GET /api/auth/me', () => {
  afterEach(() => jest.clearAllMocks());

  const auth = { Authorization: `Bearer ${generateToken({ user_id: 'u1' })}` };

  test('returns 200 with the account behind the token', async () => {
    const user = { id: 'u1', email: 'arvin@example.com', name: 'Arvin', created_at: '2026-08-01T00:00:00Z' };
    findUserById.mockResolvedValue(user);

    const res = await request(app).get('/api/auth/me').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  test('looks the user up by the id inside the token', async () => {
    findUserById.mockResolvedValue({ id: 'u1' });

    await request(app).get('/api/auth/me').set(auth);

    expect(findUserById).toHaveBeenCalledWith('u1');
  });

  test('never leaks the password hash even if the model returns one', async () => {
    findUserById.mockResolvedValue({
      id: 'u1',
      email: 'arvin@example.com',
      name: 'Arvin',
      password_hash: '$2b$10$hashyanguharusnyatidakpernahkeluar',
    });

    const res = await request(app).get('/api/auth/me').set(auth);

    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2b\$/);
  });

  test('returns 401 when the token is valid but the account is gone', async () => {
    findUserById.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/me').set(auth);

    expect(res.status).toBe(401);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(findUserById).not.toHaveBeenCalled();
  });

  test('returns 401 for a token signed with another secret', async () => {
    const res = await request(app).get('/api/auth/me').set({ Authorization: 'Bearer bukan.token.asli' });

    expect(res.status).toBe(401);
    expect(findUserById).not.toHaveBeenCalled();
  });
});
