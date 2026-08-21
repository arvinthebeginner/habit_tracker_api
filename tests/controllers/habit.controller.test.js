process.env.JWT_SECRET = 'test-secret';
jest.mock('../../src/models/habit.model');
jest.mock('../../src/models/checkin.model');
const {
  createCheckin,
  findCheckinByHabitAndDate,
  findCheckinsByHabit,
} = require('../../src/models/checkin.model');
const {
  createHabit,
  findHabitsByUser,
  findHabitById,
  updateHabit,
  deleteHabit,
} = require('../../src/models/habit.model');
const { generateToken } = require('../../src/utils/jwt.util');
const { today: currentDate } = require('../../src/utils/date.util');
const request = require('supertest');
const app = require('../../src/app');

const HABIT_ID = '11111111-1111-4111-8111-111111111111';
const token = generateToken({ user_id: 'u1' });
const auth = { Authorization: `Bearer ${token}` };

describe('POST /api/habits', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 201 and the created habit', async () => {
    const habit = { id: HABIT_ID, user_id: 'u1', name: 'Olahraga', category: null, frequency: 'daily' };
    createHabit.mockResolvedValue(habit);

    const res = await request(app).post('/api/habits').set(auth).send({ name: 'Olahraga', frequency: 'daily' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(habit);
  });

  test('uses the user id from the token, not from the request body', async () => {
    createHabit.mockResolvedValue({ id: HABIT_ID });

    await request(app)
      .post('/api/habits')
      .set(auth)
      .send({ name: 'Olahraga', frequency: 'daily', userId: 'someone-else' });

    expect(createHabit.mock.calls[0][0].userId).toBe('u1');
  });

  test('rejects an unknown frequency with 400', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set(auth)
      .send({ name: 'Olahraga', frequency: 'monthly' });

    expect(res.status).toBe(400);
    expect(createHabit).not.toHaveBeenCalled();
  });

  test('trims the name and defaults category to null', async () => {
    createHabit.mockResolvedValue({ id: HABIT_ID });

    await request(app).post('/api/habits').set(auth).send({ name: '  Olahraga  ', frequency: 'daily' });

    expect(createHabit).toHaveBeenCalledWith({
      userId: 'u1',
      name: 'Olahraga',
      category: null,
      frequency: 'daily',
    });
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
    const habits = [{ id: HABIT_ID, name: 'Olahraga' }];
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
    const habit = { id: HABIT_ID, user_id: 'u1', name: 'Olahraga' };
    findHabitById.mockResolvedValue(habit);

    const res = await request(app).get(`/api/habits/${HABIT_ID}`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(habit);
    expect(findHabitById).toHaveBeenCalledWith(HABIT_ID, 'u1');
  });

  test('returns 404 when the habit is not found', async () => {
    findHabitById.mockResolvedValue(null);

    const res = await request(app).get(`/api/habits/${HABIT_ID}`).set(auth);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/habits/:id', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with the updated habit', async () => {
    const updated = { id: HABIT_ID, user_id: 'u1', name: 'Lari pagi' };
    updateHabit.mockResolvedValue(updated);

    const res = await request(app).put(`/api/habits/${HABIT_ID}`).set(auth).send({ name: 'Lari pagi' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  test('returns 400 for an empty body instead of wiping the habit', async () => {
    const res = await request(app).put(`/api/habits/${HABIT_ID}`).set(auth).send({});

    expect(res.status).toBe(400);
    expect(updateHabit).not.toHaveBeenCalled();
  });

  test('sends only the fields that were provided', async () => {
    updateHabit.mockResolvedValue({ id: HABIT_ID, name: 'Lari pagi' });

    await request(app).put(`/api/habits/${HABIT_ID}`).set(auth).send({ name: 'Lari pagi' });

    expect(updateHabit).toHaveBeenCalledWith(HABIT_ID, 'u1', { name: 'Lari pagi' });
  });

  test('returns 404 when the habit belongs to another user', async () => {
    updateHabit.mockResolvedValue(null);

    const res = await request(app).put(`/api/habits/${HABIT_ID}`).set(auth).send({ name: 'Lari pagi' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/habits/:id', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 204 with an empty body', async () => {
    deleteHabit.mockResolvedValue();

    const res = await request(app).delete(`/api/habits/${HABIT_ID}`).set(auth);

    expect(res.status).toBe(204);
    expect(deleteHabit).toHaveBeenCalledWith(HABIT_ID, 'u1');
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).delete(`/api/habits/${HABIT_ID}`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/habits/:id/checkin', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 201 with the created check-in for today', async () => {
    const today = currentDate();
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinByHabitAndDate.mockResolvedValue(null);
    createCheckin.mockResolvedValue({ id: 'c1', habit_id: HABIT_ID, date: today, completed: true });

    const res = await request(app).post(`/api/habits/${HABIT_ID}/checkin`).set(auth);

    expect(res.status).toBe(201);
    expect(createCheckin).toHaveBeenCalledWith({ habitId: HABIT_ID, date: today, completed: true });
  });

  test('returns 409 and does not insert twice when today is already checked in', async () => {
    const today = currentDate();
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinByHabitAndDate.mockResolvedValue({ id: 'c1', habit_id: HABIT_ID, date: today, completed: true });

    const res = await request(app).post(`/api/habits/${HABIT_ID}/checkin`).set(auth);

    expect(res.status).toBe(409);
    expect(createCheckin).not.toHaveBeenCalled();
  });

  test('looks for an existing check-in on today only', async () => {
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinByHabitAndDate.mockResolvedValue(null);
    createCheckin.mockResolvedValue({ id: 'c1' });

    await request(app).post(`/api/habits/${HABIT_ID}/checkin`).set(auth);

    expect(findCheckinByHabitAndDate).toHaveBeenCalledWith(HABIT_ID, currentDate());
  });

  test('returns 404 when the habit belongs to another user', async () => {
    findHabitById.mockResolvedValue(null);

    const res = await request(app).post(`/api/habits/${HABIT_ID}/checkin`).set(auth);

    expect(res.status).toBe(404);
    expect(createCheckin).not.toHaveBeenCalled();
  });
});

describe('GET /api/habits/:id/checkins', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 with the check-in history', async () => {
    const checkins = [{ id: 'c1', habit_id: HABIT_ID, date: '2026-08-20', completed: true }];
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinsByHabit.mockResolvedValue(checkins);

    const res = await request(app).get(`/api/habits/${HABIT_ID}/checkins`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(checkins);
  });

  test('returns 404 when the habit is not found', async () => {
    findHabitById.mockResolvedValue(null);

    const res = await request(app).get(`/api/habits/${HABIT_ID}/checkins`).set(auth);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/habits/:id/stats', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns streak plus weekly and monthly summaries', async () => {
    const today = currentDate();
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinsByHabit.mockResolvedValue([{ id: 'c1', habit_id: HABIT_ID, date: today, completed: true }]);

    const res = await request(app).get(`/api/habits/${HABIT_ID}/stats`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      streak: 1,
      weekly: { days: 7, completed: 1 },
      monthly: { days: 30, completed: 1 },
    });
  });

  test('returns zeroed stats when there are no check-ins', async () => {
    findHabitById.mockResolvedValue({ id: HABIT_ID, user_id: 'u1' });
    findCheckinsByHabit.mockResolvedValue([]);

    const res = await request(app).get(`/api/habits/${HABIT_ID}/stats`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.streak).toBe(0);
  });

  test('returns 404 when the habit belongs to another user', async () => {
    findHabitById.mockResolvedValue(null);

    const res = await request(app).get(`/api/habits/${HABIT_ID}/stats`).set(auth);

    expect(res.status).toBe(404);
  });
});

describe('habit id validation', () => {
  afterEach(() => jest.clearAllMocks());

  test.each([
    ['GET', (id) => request(app).get(`/api/habits/${id}`)],
    ['PUT', (id) => request(app).put(`/api/habits/${id}`).send({ name: 'Lari pagi' })],
    ['DELETE', (id) => request(app).delete(`/api/habits/${id}`)],
    ['POST checkin', (id) => request(app).post(`/api/habits/${id}/checkin`)],
    ['GET checkins', (id) => request(app).get(`/api/habits/${id}/checkins`)],
    ['GET stats', (id) => request(app).get(`/api/habits/${id}/stats`)],
  ])('%s returns 400 for an id that is not a UUID', async (_label, send) => {
    const res = await send('bukan-uuid').set(auth);

    expect(res.status).toBe(400);
    expect(findHabitById).not.toHaveBeenCalled();
    expect(deleteHabit).not.toHaveBeenCalled();
  });
});
