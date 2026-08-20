const { generateToken, verifyToken } = require('../../src/utils/jwt.util');

describe('jwt.util', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('verifyToken returns the payload that was signed', () => {
    const token = generateToken({ user_id: '123' });
    expect(verifyToken(token).user_id).toBe('123');
  });

  test('verifyToken throws for a tampered token', () => {
    const token = generateToken({ user_id: '123' });
    expect(() => verifyToken(`${token}tampered`)).toThrow();
  });

  test('verifyToken throws when the token was signed with a different secret', () => {
    const token = generateToken({ user_id: '123' });
    process.env.JWT_SECRET = 'another-secret';
    expect(() => verifyToken(token)).toThrow();
  });

  test('generateToken throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateToken({ user_id: '123' })).toThrow('JWT_SECRET must be set');
  });
});
