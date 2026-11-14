const { cookieOptions } = require("../config/session");

const CART_COOKIE_NAME = "rideform.cart";
const CART_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày
const MAX_CART_LINES = 50;
const MAX_QUANTITY = 999;

// Cookie giỏ hàng chỉ chứa { productId: quantity } — không chứa thông tin cá nhân.
function readCart(req) {
  const raw = req.cookies?.[CART_COOKIE_NAME];
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([id, quantity]) =>
            /^\d+$/.test(id) && Number.isInteger(quantity) && quantity > 0,
        )
        .slice(0, MAX_CART_LINES)
        .map(([id, quantity]) => [id, Math.min(quantity, MAX_QUANTITY)]),
    );
  } catch (_error) {
    return {};
  }
}

function writeCart(res, cart) {
  res.cookie(CART_COOKIE_NAME, JSON.stringify(cart), {
    ...cookieOptions,
    maxAge: CART_MAX_AGE,
  });
}

function getCart(req, res) {
  return res.json({ data: readCart(req) });
}

function saveCart(req, res) {
  const body = req.body || {};
  if (
    !body.items ||
    typeof body.items !== "object" ||
    Array.isArray(body.items)
  ) {
    return res.status(400).json({ message: "Giỏ hàng không hợp lệ." });
  }

  const entries = Object.entries(body.items);
  if (entries.length > MAX_CART_LINES) {
    return res
      .status(400)
      .json({
        message: `Giỏ hàng chỉ chứa tối đa ${MAX_CART_LINES} sản phẩm.`,
      });
  }

  const cart = {};
  for (const [id, quantity] of entries) {
    const value = Number(quantity);
    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > MAX_QUANTITY
    ) {
      return res
        .status(400)
        .json({ message: "Số lượng sản phẩm trong giỏ hàng không hợp lệ." });
    }
    cart[id] = value;
  }

  writeCart(res, cart);
  return res.json({ data: cart, message: "Đã lưu giỏ hàng." });
}

function clearCart(_req, res) {
  res.clearCookie(CART_COOKIE_NAME, cookieOptions);
  return res.sendStatus(204);
}

module.exports = { getCart, saveCart, clearCart, CART_COOKIE_NAME };
