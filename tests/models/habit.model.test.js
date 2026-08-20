jest.mock('../../src/config/db');
const { getSupabaseClient } = require('../../src/config/db');
const {
  createHabit,
  findHabitsByUser,
  findHabitById,
  updateHabit,
  deleteHabit,
} = require('../../src/models/habit.model');

// Supabase queries are chainable, so one object stands in for every step of the
// chain. It is thenable too, because delete() is awaited without a final call.
function buildMock(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const chain = {
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return { from: jest.fn(() => chain), chain };
}

describe('habit.model', () => {
  test('createHabit inserts into habits and returns the created row', async () => {
    const fakeHabit = { id: 'h1', user_id: 'u1', name: 'Olahraga', frequency: 'daily' };
    const mock = buildMock(fakeHabit);
    getSupabaseClient.mockReturnValue(mock);

    const result = await createHabit({ userId: 'u1', name: 'Olahraga', category: null, frequency: 'daily' });

    expect(mock.from).toHaveBeenCalledWith('habits');
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
    const mock = buildMock(fakeHabits);
    getSupabaseClient.mockReturnValue(mock);

    const result = await findHabitsByUser('u1');

    expect(mock.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(fakeHabits);
  });

  test('findHabitById scopes the lookup to both habit id and user id', async () => {
    const fakeHabit = { id: 'h1', user_id: 'u1' };
    const mock = buildMock(fakeHabit);
    getSupabaseClient.mockReturnValue(mock);

    const result = await findHabitById('h1', 'u1');

    expect(mock.chain.eq).toHaveBeenCalledWith('id', 'h1');
    expect(mock.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(fakeHabit);
  });

  test('findHabitById returns null when the habit belongs to another user', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null));

    expect(await findHabitById('h1', 'someone-else')).toBeNull();
  });

  test('updateHabit scopes the update to both habit id and user id', async () => {
    const updated = { id: 'h1', user_id: 'u1', name: 'Lari pagi' };
    const mock = buildMock(updated);
    getSupabaseClient.mockReturnValue(mock);

    const result = await updateHabit('h1', 'u1', { name: 'Lari pagi' });

    expect(mock.chain.update).toHaveBeenCalledWith({ name: 'Lari pagi' });
    expect(mock.chain.eq).toHaveBeenCalledWith('id', 'h1');
    expect(mock.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(updated);
  });

  test('deleteHabit scopes the delete to both habit id and user id', async () => {
    const mock = buildMock(null);
    getSupabaseClient.mockReturnValue(mock);

    await deleteHabit('h1', 'u1');

    expect(mock.chain.delete).toHaveBeenCalled();
    expect(mock.chain.eq).toHaveBeenCalledWith('id', 'h1');
    expect(mock.chain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  test('deleteHabit throws when Supabase returns an error', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null, { message: 'delete failed' }));

    await expect(deleteHabit('h1', 'u1')).rejects.toThrow('delete failed');
  });
});
