const { calculateStreak } = require('../../src/utils/streak.util');
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
