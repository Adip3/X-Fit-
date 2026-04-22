import express from "express";
import { getActiveSales, getAllSales, createSale, updateSale, deleteSale } from "../controllers/saleController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/active", getActiveSales);
router.get("/", authenticate, isAdmin, getAllSales);
router.post("/", authenticate, isAdmin, createSale);
router.put("/:id", authenticate, isAdmin, updateSale);
router.delete("/:id", authenticate, isAdmin, deleteSale);

export default router;
