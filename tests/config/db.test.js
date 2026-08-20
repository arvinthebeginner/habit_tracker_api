describe('getSupabaseClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('throws when SUPABASE_URL or SUPABASE_KEY is missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;

    const { getSupabaseClient } = require('../../src/config/db');
    expect(() => getSupabaseClient()).toThrow('SUPABASE_URL and SUPABASE_KEY must be set');
  });

  test('returns the same client instance on repeated calls', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_KEY = 'test-key';

    const { getSupabaseClient } = require('../../src/config/db');
    expect(getSupabaseClient()).toBe(getSupabaseClient());
  });
});
