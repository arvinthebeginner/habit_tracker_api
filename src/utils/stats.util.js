function summarizeCompletions(checkins, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  const completed = checkins.filter((c) => {
    if (!c.completed) return false;
    return new Date(c.date) >= cutoff;
  }).length;

  return { days, completed };
}

module.exports = { summarizeCompletions };
