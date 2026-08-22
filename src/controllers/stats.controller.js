const { findHabitsByUser } = require('../models/habit.model');
const { findCheckinsByHabits } = require('../models/checkin.model');
const { calculateStreak, calculateLongestStreak } = require('../utils/streak.util');
const { summarizeCompletions } = require('../utils/stats.util');
const { today } = require('../utils/date.util');

function groupByHabit(checkins) {
  const grouped = new Map();

  for (const checkin of checkins) {
    const bucket = grouped.get(checkin.habit_id);
    if (bucket) bucket.push(checkin);
    else grouped.set(checkin.habit_id, [checkin]);
  }

  return grouped;
}

async function summary(req, res, next) {
  try {
    const habits = await findHabitsByUser(req.user.id);
    const checkins = await findCheckinsByHabits(habits.map((h) => h.id));
    const grouped = groupByHabit(checkins);
    const date = today();

    const items = habits.map((habit) => {
      const own = grouped.get(habit.id) || [];

      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        frequency: habit.frequency,
        checkedInToday: own.some((c) => c.date === date && c.completed),
        streak: calculateStreak(own),
        longestStreak: calculateLongestStreak(own),
        weekly: summarizeCompletions(own, 7),
        monthly: summarizeCompletions(own, 30),
      };
    });

    res.status(200).json({
      totalHabits: items.length,
      checkedInToday: items.filter((item) => item.checkedInToday).length,
      habits: items,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
