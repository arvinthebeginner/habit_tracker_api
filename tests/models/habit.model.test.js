jest.mock('../../src/config/db');
const { getSupabaseClient } = require('../../src/config/db');
const { createHabit, findHabitsByUser } = require('../../src/models/habit.model');

function buildMock(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const order = jest.fn().mockResolvedValue(result);
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ order }));
  const select = jest.fn(() => ({ single, eq }));
  const insert = jest.fn(() => ({ select }));
  const from = jest.fn(() => ({ insert, select }));
  return { from, insert, eq };
}

describe('habit.model', () => {
  test('createHabit inserts into habits and returns the created row', async () => {
    const fakeHabit = { id: 'h1', user_id: 'u1', name: 'Olahraga', frequency: 'daily' };
    const mockClient = buildMock(fakeHabit);
    getSupabaseClient.mockReturnValue(mockClient);

    const result = await createHabit({ userId: 'u1', name: 'Olahraga', category: null, frequency: 'daily' });

    expect(mockClient.from).toHaveBeenCalledWith('habits');
    expect(result).toEqual(fakeHabit);
  });

  test('createHabit throws when Supabase returns an error', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null, { message: 'insert failed' }));

    await expect(
      createHabit({ userId: 'u1', name: 'Olahraga', category: null, frequency: 'daily' })
    ).rejects.toThrow('insert failed');
  });

  test('findHabitsByUser filters by the given user id', async () => {
    const fakeHabits = [{ id: 'h1', user_id: 'u1', name: 'Olahraga' }];
    const mockClient = buildMock(fakeHabits);
    getSupabaseClient.mockReturnValue(mockClient);

    const result = await findHabitsByUser('u1');

    expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(fakeHabits);
  });
});
