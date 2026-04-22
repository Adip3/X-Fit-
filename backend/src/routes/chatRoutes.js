import express from "express";
import { chat } from "../controllers/chatController.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "xsow_secret_key_change_in_production";

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
};

const router = express.Router();
router.post("/", optionalAuth, chat);
export default router;
