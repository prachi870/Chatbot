const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates signup payload.
 * Returns an array of error messages (empty array = valid).
 */
function validateSignup({ name, email, password, confirmPassword }) {
  const errors = [];

  if (!isNonEmptyString(name)) errors.push('Name is required.');
  if (!isNonEmptyString(email)) errors.push('Email is required.');
  else if (!isValidEmail(email)) errors.push('Please provide a valid email address.');

  if (!isNonEmptyString(password)) errors.push('Password is required.');
  else if (!isValidPassword(password)) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  if (!isNonEmptyString(confirmPassword)) errors.push('Password confirmation is required.');
  else if (password !== confirmPassword) errors.push('Passwords do not match.');

  return errors;
}

/**
 * Validates login payload.
 */
function validateLogin({ email, password }) {
  const errors = [];

  if (!isNonEmptyString(email)) errors.push('Email is required.');
  else if (!isValidEmail(email)) errors.push('Please provide a valid email address.');

  if (!isNonEmptyString(password)) errors.push('Password is required.');

  return errors;
}

/**
 * Validates a chat title (used for create/rename).
 */
function validateChatTitle(title) {
  const errors = [];
  if (title !== undefined && title !== null) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title must be a non-empty string.');
    } else if (title.length > 100) {
      errors.push('Title must be 100 characters or fewer.');
    }
  }
  return errors;
}

/**
 * Validates an incoming chat message.
 */
function validateMessage(message) {
  const errors = [];
  if (!isNonEmptyString(message)) {
    errors.push('Message content is required.');
  } else if (message.length > 8000) {
    errors.push('Message is too long (max 8000 characters).');
  }
  return errors;
}

/**
 * Like validateChatTitle, but the title is mandatory (used for rename).
 */
function validateChatTitleRequired(title) {
  if (!isNonEmptyString(title)) {
    return ['Title is required.'];
  }
  return validateChatTitle(title);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isNonEmptyString,
  validateSignup,
  validateLogin,
  validateChatTitle,
  validateChatTitleRequired,
  validateMessage,
  MIN_PASSWORD_LENGTH,
};
