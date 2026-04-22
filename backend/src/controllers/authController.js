import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../middleware/auth.js";
import { sendWelcomeEmail } from "../services/emailService.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "All fields are required" });
    if (User.getByEmail(email)) return res.status(400).json({ success: false, error: "Email already registered" });
    const user = { id: uuidv4(), name, email, password: await bcrypt.hash(password, 10), role: "customer", createdAt: new Date().toISOString() };
    User.create(user);
    const token = generateToken(user);
    const { password: _, ...safe } = user;
    sendWelcomeEmail(user).catch(() => {});
    res.status(201).json({ success: true, data: safe, token });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = User.getByEmail(email);
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Invalid credentials" });
    const token = generateToken(user);
    const { password: _, ...safe } = user;
    res.json({ success: true, data: safe, token });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getProfile = (req, res) => {
  const user = User.getById(req.user.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  const { password, ...safe } = user;
  res.json({ success: true, data: safe });
};
