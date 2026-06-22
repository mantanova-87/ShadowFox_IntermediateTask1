/**
 * Role Guard Middleware — RBAC enforcement
 * Usage: router.get('/path', auth, roleGuard('seller'), controller.fn)
 *        router.get('/path', auth, roleGuard('admin', 'seller'), controller.fn)
 */
const roleGuard = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required.');
    err.statusCode = 401;
    return next(err);
  }
  if (!allowedRoles.includes(req.user.role)) {
    const err = new Error('Access forbidden: insufficient permissions.');
    err.statusCode = 403;
    return next(err);
  }
  next();
};

/**
 * Seller-approval guard — requires approved seller status on top of role check
 */
const sellerApproved = (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    const err = new Error('Seller access required.');
    err.statusCode = 403;
    return next(err);
  }
  if (req.user.sellerStatus !== 'approved') {
    const err = new Error('Your seller account is pending approval. Please wait for admin review.');
    err.statusCode = 403;
    return next(err);
  }
  next();
};

module.exports = { roleGuard, sellerApproved };
