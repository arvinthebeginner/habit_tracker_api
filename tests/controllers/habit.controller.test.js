process.env.JWT_SECRET = 'test-secret';
jest.mock('../../src/models/habit.model');
const {
  createHabit,
  findHabitsByUser,
  findHabitById,
  updateHabit,
  deleteHabit,
} = require('../../src/models/habit.model');
const { generateToken } = require('../../src/utils/jwt.util');
const request = require('supertest');
const app = require('../../src/app');

const token = generateToken({ user_id: 'u1' });
const auth = { Authorization: `Bearer ${token}` };

describe('POST /api/habits', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 201 and the created habit', async () => {
    const habit = { id: 'h1', user_id: 'u1', name: 'Olahraga', category: null, frequency: 'daily' };
    createHabit.mockResolvedValue(habit);

    const res = await request(app).post('/api/habits').set(auth).send({ name: 'Olahraga', frequency: 'daily' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(habit);
  });

  test('uses the user id from the token, not from the request body', async () => {
    createHabit.mockResolvedValue({ id: 'h1' });

    await request(app)
      .post('/api/habits')
      .set(auth)
      .send({ name: 'Olahraga', frequency: 'daily', userId: 'someone-else' });

    expect(createHabit.mock.calls[0][0].userId).toBe('u1');
  });

  test('returns 400 when name or frequency is missing', async () => {
    const res = await request(app).post('/api/habits').set(auth).send({ name: 'Olahraga' });
    expect(res.status).toBe(400);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).post('/api/habits').send({ name: 'Olahraga', frequency: 'daily' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/habits', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with the habits of the logged in user', async () => {
    const habits = [{ id: 'h1', name: 'Olahraga' }];
    findHabitsByUser.mockResolvedValue(habits);

    const res = await request(app).get('/api/habits').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(habits);
    expect(findHabitsByUser).toHaveBeenCalledWith('u1');
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/habits/:id', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with the habit', async () => {
    const habit = { id: 'h1', user_id: 'u1', name: 'Olahraga' };
    findHabitById.mockResolvedValue(habit);

    const res = await request(app).get('/api/habits/h1').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(habit);
    expect(findHabitById).toHaveBeenCalledWith('h1', 'u1');
  });

  test('returns 404 when the habit is not found', async () => {
    findHabitById.mockResolvedValue(null);

    const res = await request(app).get('/api/habits/h1').set(auth);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/habits/:id', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with the updated habit', async () => {
    const updated = { id: 'h1', user_id: 'u1', name: 'Lari pagi' };
    updateHabit.mockResolvedValue(updated);

    const res = await request(app).put('/api/habits/h1').set(auth).send({ name: 'Lari pagi' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  test('returns 404 when the habit belongs to another user', async () => {
    updateHabit.mockResolvedValue(null);

    const res = await request(app).put('/api/habits/h1').set(auth).send({ name: 'Lari pagi' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/habits/:id', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 204 with an empty body', async () => {
    deleteHabit.mockResolvedValue();

    const res = await request(app).delete('/api/habits/h1').set(auth);

    expect(res.status).toBe(204);
    expect(deleteHabit).toHaveBeenCalledWith('h1', 'u1');
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/habits/h1');
    expect(res.status).toBe(401);
  });
});
