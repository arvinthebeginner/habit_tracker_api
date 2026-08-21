const { today, shiftDays } = require('../../src/utils/date.util');

describe('today', () => {
  afterEach(() => {
    jest.useRealTimers();
    delete process.env.APP_TIMEZONE;
  });

  test('returns the date in the given timezone, not the UTC date', () => {
    // 23:30 UTC = 06:30 WIB keesokan harinya: check-in pagi harus masuk hari baru
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T23:30:00Z'));

    expect(today('Asia/Jakarta')).toBe('2026-08-21');
    expect(today('UTC')).toBe('2026-08-20');
  });

  test('reads the timezone from APP_TIMEZONE when no argument is given', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T23:30:00Z'));
    process.env.APP_TIMEZONE = 'UTC';

    expect(today()).toBe('2026-08-20');
  });

  test('falls back to Asia/Jakarta when APP_TIMEZONE is not set', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T23:30:00Z'));

    expect(today()).toBe('2026-08-21');
  });
});

describe('shiftDays', () => {
  test('moves backwards and forwards by whole days', () => {
    expect(shiftDays('2026-08-21', -1)).toBe('2026-08-20');
    expect(shiftDays('2026-08-21', 1)).toBe('2026-08-22');
    expect(shiftDays('2026-08-21', 0)).toBe('2026-08-21');
  });

  test('crosses month and year boundaries', () => {
    expect(shiftDays('2026-09-01', -1)).toBe('2026-08-31');
    expect(shiftDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('handles leap days', () => {
    expect(shiftDays('2028-03-01', -1)).toBe('2028-02-29');
  });
});
