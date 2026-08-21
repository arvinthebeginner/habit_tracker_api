const { createUser, findUserByEmail } = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');
const { validateRegistration, validateCredentials } = require('../utils/validate.util');

async function register(req, res, next) {
  try {
    const { email, password, name } = validateRegistration(req.body);

    const existing = await findUserByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, name });

    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = validateCredentials(req.body);

    const user = await findUserByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const matches = await comparePassword(password, user.password_hash);
    if (!matches) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const token = generateToken({ user_id: user.id });

    console.log(JSON.stringify({
      event: 'login_success',
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    }));

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
