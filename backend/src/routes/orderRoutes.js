import express from "express";
import { checkout, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from "../controllers/orderController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/checkout", authenticate, checkout);
router.get("/my-orders", authenticate, getMyOrders);
router.get("/:id", authenticate, getOrderById);
router.get("/", authenticate, isAdmin, getAllOrders);
router.put("/:id/status", authenticate, isAdmin, updateOrderStatus);

export default router;
