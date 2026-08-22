jest.mock('../../src/config/db');
const { getSupabaseClient } = require('../../src/config/db');
const {
  createCheckin,
  findCheckinByHabitAndDate,
  deleteCheckinByHabitAndDate,
  findCheckinsByHabit,
} = require('../../src/models/checkin.model');

function buildMock(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const chain = {
    insert: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  return { from: jest.fn(() => chain), chain };
}

describe('checkin.model', () => {
  test('createCheckin inserts into checkins and returns the created row', async () => {
    const fakeCheckin = { id: 'c1', habit_id: 'h1', date: '2026-08-20', completed: true };
    const mock = buildMock(fakeCheckin);
    getSupabaseClient.mockReturnValue(mock);

    const result = await createCheckin({ habitId: 'h1', date: '2026-08-20', completed: true });

    expect(mock.from).toHaveBeenCalledWith('checkins');
    expect(mock.chain.insert).toHaveBeenCalledWith({ habit_id: 'h1', date: '2026-08-20', completed: true });
    expect(result).toEqual(fakeCheckin);
  });

  test('createCheckin throws when Supabase returns an error', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null, { message: 'insert failed' }));

    await expect(
      createCheckin({ habitId: 'h1', date: '2026-08-20', completed: true })
    ).rejects.toThrow('insert failed');
  });

  test('findCheckinByHabitAndDate filters by habit id and date', async () => {
    const fakeCheckin = { id: 'c1', habit_id: 'h1', date: '2026-08-20', completed: true };
    const mock = buildMock(fakeCheckin);
    getSupabaseClient.mockReturnValue(mock);

    const result = await findCheckinByHabitAndDate('h1', '2026-08-20');

    expect(mock.chain.eq).toHaveBeenCalledWith('habit_id', 'h1');
    expect(mock.chain.eq).toHaveBeenCalledWith('date', '2026-08-20');
    expect(result).toEqual(fakeCheckin);
  });

  test('findCheckinByHabitAndDate returns null when there is no check-in yet', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null));

    await expect(findCheckinByHabitAndDate('h1', '2026-08-20')).resolves.toBeNull();
  });

  test('deleteCheckinByHabitAndDate deletes only that habit on that date', async () => {
    const fakeCheckin = { id: 'c1', habit_id: 'h1', date: '2026-08-20', completed: true };
    const mock = buildMock(fakeCheckin);
    getSupabaseClient.mockReturnValue(mock);

    const result = await deleteCheckinByHabitAndDate('h1', '2026-08-20');

    expect(mock.chain.delete).toHaveBeenCalled();
    expect(mock.chain.eq).toHaveBeenCalledWith('habit_id', 'h1');
    expect(mock.chain.eq).toHaveBeenCalledWith('date', '2026-08-20');
    expect(result).toEqual(fakeCheckin);
  });

  test('deleteCheckinByHabitAndDate returns null when there was nothing to delete', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null));

    await expect(deleteCheckinByHabitAndDate('h1', '2026-08-20')).resolves.toBeNull();
  });

  test('deleteCheckinByHabitAndDate throws when Supabase returns an error', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null, { message: 'delete failed' }));

    await expect(deleteCheckinByHabitAndDate('h1', '2026-08-20')).rejects.toThrow('delete failed');
  });

  test('findCheckinsByHabit filters by habit id', async () => {
    const fakeCheckins = [{ id: 'c1', habit_id: 'h1', date: '2026-08-20', completed: true }];
    const mock = buildMock(fakeCheckins);
    getSupabaseClient.mockReturnValue(mock);

    const result = await findCheckinsByHabit('h1');

    expect(mock.chain.eq).toHaveBeenCalledWith('habit_id', 'h1');
    expect(result).toEqual(fakeCheckins);
  });
});
