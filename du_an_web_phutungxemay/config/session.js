const crypto = require("crypto");
const session = require("express-session");

const SESSION_COOKIE_NAME = "rideform.sid";
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000; // 8 giờ

const isProduction = process.env.NODE_ENV === "production";

const sessionSecret =
  process.env.SESSION_SECRET ||
  (isProduction ? "" : crypto.randomBytes(32).toString("hex"));

if (!sessionSecret) {
  throw new Error("Cần cấu hình SESSION_SECRET khi chạy production.");
}

// Thuộc tính cookie dùng chung cho session và cookie giỏ hàng.
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
};

const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { ...cookieOptions, maxAge: SESSION_MAX_AGE },
});

module.exports = {
  sessionMiddleware,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  cookieOptions,
};
