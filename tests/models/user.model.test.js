jest.mock('../../src/config/db');
const { getSupabaseClient } = require('../../src/config/db');
const { createUser, findUserByEmail } = require('../../src/models/user.model');

function buildMock(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ single, eq }));
  const insert = jest.fn(() => ({ select }));
  const from = jest.fn(() => ({ insert, select }));
  return { from };
}

describe('user.model', () => {
  test('createUser inserts a user and returns the created row', async () => {
    const fakeUser = { id: '1', email: 'arvin@example.com', name: 'Arvin' };
    const mockClient = buildMock(fakeUser);
    getSupabaseClient.mockReturnValue(mockClient);

    const result = await createUser({ email: 'arvin@example.com', passwordHash: 'hashed', name: 'Arvin' });

    expect(mockClient.from).toHaveBeenCalledWith('users');
    expect(result).toEqual(fakeUser);
  });

  test('createUser throws when Supabase returns an error', async () => {
    const mockClient = buildMock(null, { message: 'duplicate key value' });
    getSupabaseClient.mockReturnValue(mockClient);

    await expect(
      createUser({ email: 'dup@example.com', passwordHash: 'hashed', name: 'Dup' })
    ).rejects.toThrow('duplicate key value');
  });

  test('findUserByEmail returns the matching user', async () => {
    const fakeUser = { id: '1', email: 'arvin@example.com', name: 'Arvin' };
    getSupabaseClient.mockReturnValue(buildMock(fakeUser));

    expect(await findUserByEmail('arvin@example.com')).toEqual(fakeUser);
  });

  test('findUserByEmail returns null when no user matches', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null));

    expect(await findUserByEmail('nobody@example.com')).toBeNull();
  });
});
