function requireAdminSession(req, res, next) {
  if (!req.session?.admin || req.session.admin.role !== 'admin') {
    return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }
  return next();
}

module.exports = requireAdminSession;
