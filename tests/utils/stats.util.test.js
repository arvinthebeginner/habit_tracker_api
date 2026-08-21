const { summarizeCompletions } = require('../../src/utils/stats.util');
const { today, shiftDays } = require('../../src/utils/date.util');

function daysAgo(n) {
  return shiftDays(today(), -n);
}

function completedOn(...offsets) {
  return offsets.map((n) => ({ date: daysAgo(n), completed: true }));
}

describe('summarizeCompletions', () => {
  test('returns 0 completions for an empty history', () => {
    expect(summarizeCompletions([], 7)).toEqual({ days: 7, completed: 0 });
  });

  test('counts completions inside the window', () => {
    expect(summarizeCompletions(completedOn(0, 1, 2), 7)).toEqual({ days: 7, completed: 3 });
  });

  test('excludes check-ins older than the window', () => {
    expect(summarizeCompletions(completedOn(0, 10, 20), 7)).toEqual({ days: 7, completed: 1 });
  });

  test('includes the oldest day still inside the window', () => {
    // window 7 hari mencakup hari ini sampai 6 hari lalu
    expect(summarizeCompletions(completedOn(6), 7)).toEqual({ days: 7, completed: 1 });
    expect(summarizeCompletions(completedOn(7), 7)).toEqual({ days: 7, completed: 0 });
  });

  test('ignores check-ins marked as not completed', () => {
    const checkins = [
      { date: daysAgo(0), completed: true },
      { date: daysAgo(1), completed: false },
    ];
    expect(summarizeCompletions(checkins, 30)).toEqual({ days: 30, completed: 1 });
  });
});
