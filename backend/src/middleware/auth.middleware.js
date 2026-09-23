const { verifyToken } = require('../utils/jwt');

/**
 * Protects routes by requiring a valid "Authorization: Bearer <token>" header.
 * On success, attaches req.userId (from the verified token) — the ONLY
 * source of truth for "who is making this request". Route handlers must
 * never trust a userId sent in the request body/params.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.sub;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}

module.exports = { requireAuth };
