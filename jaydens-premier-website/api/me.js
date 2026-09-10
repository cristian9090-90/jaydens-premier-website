/**
 * GET /api/me
 * Returns whether the current request has a valid admin session.
 */
const { isAuthenticated } = require("../lib/auth");

module.exports = async (req, res) => {
  res.status(200).json({ authenticated: isAuthenticated(req) });
};
