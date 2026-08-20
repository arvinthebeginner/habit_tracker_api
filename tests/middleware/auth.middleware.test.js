process.env.JWT_SECRET = 'test-secret';
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { generateToken } = require('../../src/utils/jwt.util');

function buildRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('requireAuth', () => {
  test('attaches req.user and calls next for a valid token', () => {
    const req = { headers: { authorization: `Bearer ${generateToken({ user_id: '123' })}` } };
    const res = buildRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: '123' });
    expect(next).toHaveBeenCalled();
  });

  test('returns 401 when the Authorization header is missing', () => {
    const res = buildRes();
    const next = jest.fn();

    requireAuth({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when the header does not use the Bearer scheme', () => {
    const res = buildRes();
    const next = jest.fn();

    requireAuth({ headers: { authorization: 'Basic abc123' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an invalid token', () => {
    const res = buildRes();
    const next = jest.fn();

    requireAuth({ headers: { authorization: 'Bearer not-a-real-token' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
