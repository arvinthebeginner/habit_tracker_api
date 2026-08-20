const jwt = require('jsonwebtoken');

const EXPIRES_IN = '7d';

function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set in environment variables');
  return jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set in environment variables');
  return jwt.verify(token, secret);
}

module.exports = { generateToken, verifyToken };
