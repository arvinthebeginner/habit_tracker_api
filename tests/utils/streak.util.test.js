const { calculateStreak, calculateLongestStreak } = require('../../src/utils/streak.util');
const { today, shiftDays } = require('../../src/utils/date.util');

function daysAgo(n) {
  return shiftDays(today(), -n);
}

function completedOn(...offsets) {
  return offsets.map((n) => ({ date: daysAgo(n), completed: true }));
}

describe('calculateStreak', () => {
  test('returns 0 when there are no check-ins', () => {
    expect(calculateStreak([])).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    expect(calculateStreak(completedOn(0, 1, 2))).toBe(3);
  });

  test('still counts the streak when today has no check-in yet', () => {
    expect(calculateStreak(completedOn(1, 2))).toBe(2);
  });

  test('stops counting at the first missed day', () => {
    // hari ini dan kemarin terisi lalu bolong di hari ke-2
    expect(calculateStreak(completedOn(0, 1, 3, 4))).toBe(2);
  });

  test('returns 0 when the most recent check-in is older than yesterday', () => {
    expect(calculateStreak(completedOn(3, 4, 5))).toBe(0);
  });

  test('ignores check-ins marked as not completed', () => {
    const checkins = [
      { date: daysAgo(0), completed: true },
      { date: daysAgo(1), completed: false },
      { date: daysAgo(2), completed: true },
    ];
    expect(calculateStreak(checkins)).toBe(1);
  });
});

describe('calculateLongestStreak', () => {
  test('returns 0 when there are no check-ins', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  test('returns 1 for a single completed day', () => {
    expect(calculateLongestStreak(completedOn(5))).toBe(1);
  });

  test('counts a run of consecutive days', () => {
    expect(calculateLongestStreak(completedOn(2, 3, 4))).toBe(3);
  });

  test('picks the longest run, not the most recent one', () => {
    // rentetan 4 hari yang sudah lama, lalu rentetan 2 hari yang baru
    expect(calculateLongestStreak(completedOn(0, 1, 10, 11, 12, 13))).toBe(4);
  });

  test('does not merge two runs separated by a gap', () => {
    expect(calculateLongestStreak(completedOn(0, 1, 3, 4))).toBe(2);
  });

  test('does not depend on the order of the input', () => {
    expect(calculateLongestStreak(completedOn(4, 2, 3))).toBe(3);
  });

  test('ignores check-ins marked as not completed', () => {
    const checkins = [
      { date: daysAgo(0), completed: true },
      { date: daysAgo(1), completed: false },
      { date: daysAgo(2), completed: true },
      { date: daysAgo(3), completed: true },
    ];
    expect(calculateLongestStreak(checkins)).toBe(2);
  });

  test('counts a repeated date only once', () => {
    const checkins = [
      { date: daysAgo(1), completed: true },
      { date: daysAgo(1), completed: true },
      { date: daysAgo(2), completed: true },
    ];
    expect(calculateLongestStreak(checkins)).toBe(2);
  });

  test('counts across a month boundary', () => {
    const checkins = [
      { date: '2026-08-30', completed: true },
      { date: '2026-08-31', completed: true },
      { date: '2026-09-01', completed: true },
    ];
    expect(calculateLongestStreak(checkins)).toBe(3);
  });

  test('includes the streak that is still running', () => {
    expect(calculateLongestStreak(completedOn(0, 1, 2))).toBe(3);
  });

  test('is never smaller than the current streak', () => {
    const checkins = completedOn(0, 1, 2, 6, 7, 8, 9, 10);
    expect(calculateLongestStreak(checkins)).toBeGreaterThanOrEqual(calculateStreak(checkins));
  });
});
