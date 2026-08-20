const {
  createHabit,
  findHabitsByUser,
  findHabitById,
  updateHabit,
  deleteHabit,
} = require('../models/habit.model');
const { createCheckin, findCheckinsByHabit } = require('../models/checkin.model');
const { calculateStreak } = require('../utils/streak.util');
const { summarizeCompletions } = require('../utils/stats.util');

async function create(req, res, next) {
  try {
    const { name, category, frequency } = req.body;
    if (!name || !frequency) {
      const err = new Error('name and frequency are required');
      err.status = 400;
      throw err;
    }

    const habit = await createHabit({ userId: req.user.id, name, category: category || null, frequency });
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
    const { name, category, frequency } = req.body;
    const habit = await updateHabit(req.params.id, req.user.id, { name, category, frequency });
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

    const today = new Date().toISOString().split('T')[0];
    const record = await createCheckin({ habitId: habit.id, date: today, completed: true });
    res.status(201).json(record);
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
      weekly: summarizeCompletions(checkins, 7),
      monthly: summarizeCompletions(checkins, 30),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove, checkin, getCheckins, stats };
