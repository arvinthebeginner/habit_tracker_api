const { createHabit, findHabitsByUser } = require('../models/habit.model');

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

module.exports = { create, list };
