const {
  validateSignup,
  validateLogin,
  validateChatTitle,
  validateChatTitleRequired,
  validateMessage,
} = require('../utils/validation');

function respondWithErrors(res, errors) {
  return res.status(400).json({
    success: false,
    message: errors[0],
    errors,
  });
}

function validateSignupBody(req, res, next) {
  const errors = validateSignup(req.body || {});
  if (errors.length) return respondWithErrors(res, errors);
  next();
}

function validateLoginBody(req, res, next) {
  const errors = validateLogin(req.body || {});
  if (errors.length) return respondWithErrors(res, errors);
  next();
}

// Used on create: title is optional (defaults to "New Conversation").
function validateChatTitleBody(req, res, next) {
  const { title } = req.body || {};
  const errors = validateChatTitle(title);
  if (errors.length) return respondWithErrors(res, errors);
  next();
}

// Used on rename: title is required.
function validateChatTitleRequiredBody(req, res, next) {
  const { title } = req.body || {};
  const errors = validateChatTitleRequired(title);
  if (errors.length) return respondWithErrors(res, errors);
  next();
}

function validateMessageBody(req, res, next) {
  const { message } = req.body || {};
  const errors = validateMessage(message);
  if (errors.length) return respondWithErrors(res, errors);
  next();
}

module.exports = {
  validateSignupBody,
  validateLoginBody,
  validateChatTitleBody,
  validateChatTitleRequiredBody,
  validateMessageBody,
};
