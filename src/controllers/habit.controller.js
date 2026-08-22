const {
  createHabit,
  findHabitsByUser,
  findHabitById,
  updateHabit,
  deleteHabit,
} = require('../models/habit.model');
const {
  createCheckin,
  findCheckinByHabitAndDate,
  deleteCheckinByHabitAndDate,
  findCheckinsByHabit,
} = require('../models/checkin.model');
const { calculateStreak, calculateLongestStreak } = require('../utils/streak.util');
const { summarizeCompletions } = require('../utils/stats.util');
const { today } = require('../utils/date.util');
const { validateHabitInput, validateHabitUpdate } = require('../utils/validate.util');

async function create(req, res, next) {
  try {
    const { name, category, frequency } = validateHabitInput(req.body);

    const habit = await createHabit({ userId: req.user.id, name, category, frequency });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const habits = await findHabitsByUser(req.user.id);
    res.status(200).json(habits);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const habit = await findHabitById(req.params.id, req.user.id);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }
    res.status(200).json(habit);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = validateHabitUpdate(req.body);
    const habit = await updateHabit(req.params.id, req.user.id, updates);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }
    res.status(200).json(habit);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await deleteHabit(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function checkin(req, res, next) {
  try {
    const habit = await findHabitById(req.params.id, req.user.id);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }

    const date = today();
    const existing = await findCheckinByHabitAndDate(habit.id, date);
    if (existing) {
      const err = new Error('Habit already checked in for today');
      err.status = 409;
      throw err;
    }

    const record = await createCheckin({ habitId: habit.id, date, completed: true });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

// Hanya membatalkan check-in hari ini
async function removeCheckin(req, res, next) {
  try {
    const habit = await findHabitById(req.params.id, req.user.id);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }

    const deleted = await deleteCheckinByHabitAndDate(habit.id, today());
    if (!deleted) {
      const err = new Error('No check-in for today');
      err.status = 404;
      throw err;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getCheckins(req, res, next) {
  try {
    const habit = await findHabitById(req.params.id, req.user.id);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }

    const checkins = await findCheckinsByHabit(habit.id);
    res.status(200).json(checkins);
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const habit = await findHabitById(req.params.id, req.user.id);
    if (!habit) {
      const err = new Error('Habit not found');
      err.status = 404;
      throw err;
    }

    const checkins = await findCheckinsByHabit(habit.id);

    res.status(200).json({
      streak: calculateStreak(checkins),
      longestStreak: calculateLongestStreak(checkins),
      weekly: summarizeCompletions(checkins, 7),
      monthly: summarizeCompletions(checkins, 30),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  checkin,
  removeCheckin,
  getCheckins,
  stats,
};
