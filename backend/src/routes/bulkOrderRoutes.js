import express from "express";
import {
  createBulkOrderRequest,
  getMyBulkOrders,
  getAllBulkOrders,
  quoteBulkOrder,
  updateBulkOrderStatus,
  deleteBulkOrder,
} from "../controllers/bulkOrderController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Customer routes
router.post("/request", authenticate, createBulkOrderRequest);
router.get("/my-requests", authenticate, getMyBulkOrders);

// Admin routes
router.get("/", authenticate, isAdmin, getAllBulkOrders);
router.put("/:id/quote", authenticate, isAdmin, quoteBulkOrder);
router.put("/:id/status", authenticate, isAdmin, updateBulkOrderStatus);
router.delete("/:id", authenticate, isAdmin, deleteBulkOrder);

export default router;
