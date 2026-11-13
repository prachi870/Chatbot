const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Creates a new user account.
 * Throws AppError(409) if the email is already registered.
 */
async function signup({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken(user._id.toString());

  return { token, user };
}

/**
 * Authenticates a user by email + password.
 * Throws AppError(401) on any failure (intentionally vague for security).
 */
async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id.toString());

  return { token, user };
}

/**
 * Fetches a user by id (used for GET /api/auth/me).
 */
async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return user;
}

module.exports = { signup, login, getUserById, AppError };
