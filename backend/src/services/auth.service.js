const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

// In-memory storage for users (since MongoDB is not available)
const usersDb = new Map();
let userIdCounter = 1;

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Creates a new user account (in-memory).
 */
async function signup({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  for (const user of usersDb.values()) {
    if (user.email === normalizedEmail) {
      throw new AppError('An account with this email already exists.', 409);
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    _id: (userIdCounter++).toString(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date(),
  };

  usersDb.set(user._id, user);

  const token = signToken(user._id);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

/**
 * Authenticates a user by email + password (in-memory).
 */
async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  let foundUser = null;
  for (const user of usersDb.values()) {
    if (user.email === normalizedEmail) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(foundUser._id);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = foundUser;
  return { token, user: userWithoutPassword };
}

/**
 * Fetches a user by id (in-memory).
 */
async function getUserById(userId) {
  const user = usersDb.get(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  
  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

module.exports = { signup, login, getUserById, AppError };
