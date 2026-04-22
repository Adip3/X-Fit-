import express from "express";
import { getProductReviews, createReview } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", authenticate, createReview);

export default router;
