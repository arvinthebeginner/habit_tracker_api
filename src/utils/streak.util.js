const { today, shiftDays } = require('./date.util');

function completedDatesOf(checkins) {
  return new Set(checkins.filter((c) => c.completed).map((c) => c.date));
}

function calculateStreak(checkins) {
  const completedDates = completedDatesOf(checkins);

  let cursor = today();
  if (!completedDates.has(cursor)) {
    cursor = shiftDays(cursor, -1);
  }

  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }

  return streak;
}

// Menghitung streak terpanjang yang pernah dicapai, termasuk streak yang sedang
// berjalan
function calculateLongestStreak(checkins) {
  const dates = [...completedDatesOf(checkins)].sort();

  let longest = 0;
  let run = 0;
  let previous = null;

  for (const date of dates) {
    run = previous !== null && shiftDays(previous, 1) === date ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = date;
  }

  return longest;
}

module.exports = { calculateStreak, calculateLongestStreak };
