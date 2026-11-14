require('dotenv').config();

const pool = require('../config/db');
const { hashPassword } = require('../lib/password');

async function main() {
  const fullName = String(process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '');

  if (!fullName || !email || !password) {
    throw new Error('Cần đặt BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL và BOOTSTRAP_ADMIN_PASSWORD trước khi chạy.');
  }
  if (fullName.length > 200 || email.length > 255 || password.length < 12) {
    throw new Error('Tên/email quá dài hoặc mật khẩu quản trị ngắn hơn 12 ký tự.');
  }

  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, full_name, email`,
    [fullName, email, hashPassword(password)],
  );

  if (!result.rowCount) {
    throw new Error('Email đã tồn tại. Không thay đổi tài khoản hiện có.');
  }
  console.log(`Đã tạo tài khoản quản trị: ${result.rows[0].email}`);
}

main()
  .catch((error) => {
    console.error(error.message || 'Không thể tạo tài khoản quản trị.');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
