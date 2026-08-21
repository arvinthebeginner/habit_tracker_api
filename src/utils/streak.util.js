const { today, shiftDays } = require('./date.util');

function calculateStreak(checkins) {
  const completedDates = new Set(checkins.filter((c) => c.completed).map((c) => c.date));

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

module.exports = { calculateStreak };
