const pool = require('../config/db');
const { verifyPassword } = require('../lib/password');
const { SESSION_COOKIE_NAME, cookieOptions } = require('../config/session');

async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password || email.length > 255 || password.length > 1024) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu hợp lệ.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE lower(email) = $1 AND role = 'admin' AND is_active = TRUE
       LIMIT 1`,
      [email],
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error('Không thể tạo phiên quản trị:', error);
        return res.status(500).json({ message: 'Không thể đăng nhập lúc này.' });
      }

      req.session.admin = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      };
      req.session.save((saveError) => {
        if (saveError) {
          console.error('Không thể lưu phiên quản trị:', saveError);
          return res.status(500).json({ message: 'Không thể lưu phiên đăng nhập.' });
        }
        return res.json({ data: req.session.admin, message: 'Đăng nhập thành công.' });
      });
    });
  } catch (error) {
    console.error('Không thể xác thực tài khoản quản trị:', error);
    return res.status(500).json({ message: 'Không thể xác thực tài khoản lúc này.' });
  }
}

function logout(req, res) {
  if (!req.session) return res.sendStatus(204);
  req.session.destroy((error) => {
    if (error) {
      console.error('Không thể hủy phiên quản trị:', error);
      return res.status(500).json({ message: 'Không thể đăng xuất lúc này.' });
    }
    res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
    return res.sendStatus(204);
  });
}

function getCurrentSession(req, res) {
  if (!req.session?.admin) {
    return res.status(401).json({ message: 'Chưa đăng nhập.' });
  }
  return res.json({ data: req.session.admin });
}

module.exports = { login, logout, getCurrentSession };
