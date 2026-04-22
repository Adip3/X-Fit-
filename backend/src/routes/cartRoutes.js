import express from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getCart);
router.post("/", authenticate, addToCart);
router.put("/:productId", authenticate, updateCartItem);
router.delete("/clear", authenticate, clearCart);
router.delete("/:productId", authenticate, removeFromCart);

export default router;
