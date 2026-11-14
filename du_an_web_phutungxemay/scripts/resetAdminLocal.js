require("dotenv").config();

const pool = require("../config/db");
const { hashPassword } = require("../lib/password");

const EMAIL = "admin@rideform.local";
const PASSWORD = "Rideform@2026";
const FULL_NAME = "Quản trị viên";

async function main() {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = 'admin',
           is_active = TRUE,
           updated_at = NOW()
     RETURNING id, full_name, email, role, is_active`,
    [FULL_NAME, EMAIL, hashPassword(PASSWORD)],
  );
  console.log(JSON.stringify(result.rows[0], null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || "Không thể tạo tài khoản quản trị.");
    process.exitCode = 1;
  })
  .finally(() => pool.end());
