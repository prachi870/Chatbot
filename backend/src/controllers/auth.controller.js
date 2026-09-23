const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { token, user } = await authService.signup({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.userId);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// POST /api/auth/logout
// JWTs are stateless, so "logout" is primarily a client-side action
// (deleting the stored token). This endpoint exists for API completeness
// and as a hook for future server-side token blacklisting if needed.
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = { signup, login, getMe, logout };
