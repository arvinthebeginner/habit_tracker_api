function calculateStreak(checkins) {
  const completedDates = new Set(checkins.filter((c) => c.completed).map((c) => c.date));
  const toDateStr = (d) => d.toISOString().split('T')[0];

  const cursor = new Date();
  if (!completedDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDates.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

module.exports = { calculateStreak };
