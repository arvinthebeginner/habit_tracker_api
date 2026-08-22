jest.mock('../../src/config/db');
const { getSupabaseClient } = require('../../src/config/db');
const { createUser, findUserByEmail, findUserById } = require('../../src/models/user.model');

function buildMock(resolvedData, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError };
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ single, eq }));
  const insert = jest.fn(() => ({ select }));
  const from = jest.fn(() => ({ insert, select }));
  return { from, select, eq, insert, single, maybeSingle };
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

  test('findUserById returns the matching user', async () => {
    const fakeUser = { id: '1', email: 'arvin@example.com', name: 'Arvin' };
    const mockClient = buildMock(fakeUser);
    getSupabaseClient.mockReturnValue(mockClient);

    const result = await findUserById('1');

    expect(mockClient.eq).toHaveBeenCalledWith('id', '1');
    expect(result).toEqual(fakeUser);
  });

  test('findUserById never asks Supabase for the password hash', async () => {
    const mockClient = buildMock({ id: '1' });
    getSupabaseClient.mockReturnValue(mockClient);

    await findUserById('1');

    const columns = mockClient.select.mock.calls[0][0];
    expect(columns).not.toMatch(/password/);
    expect(columns).toBe('id, email, name, created_at');
  });

  test('findUserById returns null when the account no longer exists', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null));

    expect(await findUserById('gone')).toBeNull();
  });

  test('findUserById throws when Supabase returns an error', async () => {
    getSupabaseClient.mockReturnValue(buildMock(null, { message: 'select failed' }));

    await expect(findUserById('1')).rejects.toThrow('select failed');
  });
});
