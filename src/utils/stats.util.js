const { today, shiftDays } = require('./date.util');

function summarizeCompletions(checkins, days) {
  // Window `days` hari mencakup hari ini, jadi batas bawahnya days - 1 hari lalu.
  const cutoff = shiftDays(today(), -(days - 1));

  const completed = checkins.filter((c) => c.completed && c.date >= cutoff).length;

  return { days, completed };
}

module.exports = { summarizeCompletions };
