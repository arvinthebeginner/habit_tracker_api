process.env.JWT_SECRET = 'test-secret';
jest.mock('../../src/models/habit.model');
jest.mock('../../src/models/checkin.model');
const { findHabitsByUser } = require('../../src/models/habit.model');
const { findCheckinsByHabits } = require('../../src/models/checkin.model');
const { generateToken } = require('../../src/utils/jwt.util');
const { today, shiftDays } = require('../../src/utils/date.util');
const request = require('supertest');
const app = require('../../src/app');

const HABIT_A = '11111111-1111-4111-8111-111111111111';
const HABIT_B = '22222222-2222-4222-8222-222222222222';
const token = generateToken({ user_id: 'u1' });
const auth = { Authorization: `Bearer ${token}` };

const habit = (id, name) => ({ id, user_id: 'u1', name, category: null, frequency: 'daily' });
const completedOn = (habitId, ...offsets) =>
  offsets.map((n) => ({ habit_id: habitId, date: shiftDays(today(), -n), completed: true }));

describe('GET /api/stats/summary', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns one entry per habit with its own stats', async () => {
    findHabitsByUser.mockResolvedValue([habit(HABIT_A, 'Olahraga'), habit(HABIT_B, 'Baca')]);
    findCheckinsByHabits.mockResolvedValue([
      ...completedOn(HABIT_A, 0, 1, 2),
      ...completedOn(HABIT_B, 5),
    ]);

    const res = await request(app).get('/api/stats/summary').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.totalHabits).toBe(2);
    expect(res.body.habits).toHaveLength(2);
    expect(res.body.habits[0]).toMatchObject({
      id: HABIT_A,
      name: 'Olahraga',
      checkedInToday: true,
      streak: 3,
      longestStreak: 3,
      weekly: { days: 7, completed: 3 },
      monthly: { days: 30, completed: 3 },
    });
    expect(res.body.habits[1]).toMatchObject({
      id: HABIT_B,
      checkedInToday: false,
      streak: 0,
      longestStreak: 1,
    });
  });

  test('keeps the check-ins of one habit out of the other habit stats', async () => {
    findHabitsByUser.mockResolvedValue([habit(HABIT_A, 'Olahraga'), habit(HABIT_B, 'Baca')]);
    findCheckinsByHabits.mockResolvedValue(completedOn(HABIT_A, 0, 1, 2, 3));

    const res = await request(app).get('/api/stats/summary').set(auth);

    expect(res.body.habits[0].streak).toBe(4);
    expect(res.body.habits[1]).toMatchObject({
      streak: 0,
      longestStreak: 0,
      weekly: { days: 7, completed: 0 },
      monthly: { days: 30, completed: 0 },
    });
  });

  test('counts how many habits are already checked in today', async () => {
    findHabitsByUser.mockResolvedValue([habit(HABIT_A, 'Olahraga'), habit(HABIT_B, 'Baca')]);
    findCheckinsByHabits.mockResolvedValue([
      ...completedOn(HABIT_A, 0),
      ...completedOn(HABIT_B, 1),
    ]);

    const res = await request(app).get('/api/stats/summary').set(auth);

    expect(res.body.checkedInToday).toBe(1);
  });

  test('fetches the check-ins of every habit in a single call', async () => {
    findHabitsByUser.mockResolvedValue([habit(HABIT_A, 'Olahraga'), habit(HABIT_B, 'Baca')]);
    findCheckinsByHabits.mockResolvedValue([]);

    await request(app).get('/api/stats/summary').set(auth);

    expect(findCheckinsByHabits).toHaveBeenCalledTimes(1);
    expect(findCheckinsByHabits).toHaveBeenCalledWith([HABIT_A, HABIT_B]);
  });

  test('returns an empty summary when the user has no habits', async () => {
    findHabitsByUser.mockResolvedValue([]);
    findCheckinsByHabits.mockResolvedValue([]);

    const res = await request(app).get('/api/stats/summary').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalHabits: 0, checkedInToday: 0, habits: [] });
  });

  test('ignores check-ins that are not completed', async () => {
    findHabitsByUser.mockResolvedValue([habit(HABIT_A, 'Olahraga')]);
    findCheckinsByHabits.mockResolvedValue([
      { habit_id: HABIT_A, date: today(), completed: false },
    ]);

    const res = await request(app).get('/api/stats/summary').set(auth);

    expect(res.body.checkedInToday).toBe(0);
    expect(res.body.habits[0]).toMatchObject({ checkedInToday: false, streak: 0 });
  });

  test('asks only for the habits of the logged in user', async () => {
    findHabitsByUser.mockResolvedValue([]);
    findCheckinsByHabits.mockResolvedValue([]);

    await request(app).get('/api/stats/summary').set(auth);

    expect(findHabitsByUser).toHaveBeenCalledWith('u1');
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/stats/summary');

    expect(res.status).toBe(401);
    expect(findHabitsByUser).not.toHaveBeenCalled();
  });
});
