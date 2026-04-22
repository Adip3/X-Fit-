import express from "express";
import { subscribe, getAllSubscribers } from "../controllers/subscriberController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", subscribe);
router.get("/", authenticate, isAdmin, getAllSubscribers);

export default router;
