const express = require("express");
const cart = require("../controllers/cartController");

const router = express.Router();

router.get("/", cart.getCart);
router.put("/", cart.saveCart);
router.delete("/", cart.clearCart);

module.exports = router;
