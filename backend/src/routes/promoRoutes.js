import express from "express";
import { validatePromo, getAllPromos, createPromo, updatePromo, deletePromo } from "../controllers/promoController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", authenticate, validatePromo);
router.get("/", authenticate, isAdmin, getAllPromos);
router.post("/", authenticate, isAdmin, createPromo);
router.put("/:id", authenticate, isAdmin, updatePromo);
router.delete("/:id", authenticate, isAdmin, deletePromo);

export default router;
