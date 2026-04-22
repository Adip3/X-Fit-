import express from "express";
import { getSettings, getPublicSettings, updateSettings, toggleSite } from "../controllers/settingsController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";
const router = express.Router();
router.get("/public", getPublicSettings);
router.get("/", authenticate, isAdmin, getSettings);
router.put("/", authenticate, isAdmin, updateSettings);
router.post("/toggle-site", authenticate, isAdmin, toggleSite);
export default router;
