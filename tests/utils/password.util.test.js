const { hashPassword, comparePassword } = require('../../src/utils/password.util');

describe('password.util', () => {
  test('hashPassword produces a hash different from the plain password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).not.toBe('mySecret123');
    expect(hash.length).toBeGreaterThan(20);
  });

  test('comparePassword returns true for a matching password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(await comparePassword('mySecret123', hash)).toBe(true);
  });

  test('comparePassword returns false for a non-matching password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(await comparePassword('wrongPassword', hash)).toBe(false);
  });
});
