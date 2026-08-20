const request = require('supertest');
const app = require('../../src/app');

describe('notFoundHandler', () => {
  test('returns 404 with the method and path for an unknown route', async () => {
    const res = await request(app).get('/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found: GET /tidak-ada');
  });
});
