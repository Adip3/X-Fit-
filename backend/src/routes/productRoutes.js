import express from "express";
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getScheduledLaunches, notifySubscribersAboutProduct } from "../controllers/productController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/scheduled", authenticate, isAdmin, getScheduledLaunches);
router.post("/:id/notify", authenticate, isAdmin, notifySubscribersAboutProduct);
router.get("/:id", getProductById);
router.post("/", authenticate, isAdmin, upload.single("image"), createProduct);
router.put("/:id", authenticate, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", authenticate, isAdmin, deleteProduct);

export default router;
