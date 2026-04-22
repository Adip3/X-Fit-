import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendCustomEmail, sendWelcomeEmail } from "../services/emailService.js";

export const getAllUsers = (req, res) => {
  try {
    const users = User.getAll().map(({ password, ...u }) => u);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getUserById = (req, res) => {
  const user = User.getById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  const { password, ...u } = user;
  res.json({ success: true, data: u });
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "name, email, password required" });
    if (User.getByEmail(email)) return res.status(400).json({ success: false, error: "Email already exists" });
    const user = { id: uuidv4(), name, email, password: await bcrypt.hash(password, 10), role: role || "customer", createdAt: new Date().toISOString() };
    User.create(user);
    sendWelcomeEmail(user).catch(() => {});
    const { password: _, ...safe } = user;
    res.status(201).json({ success: true, data: safe });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    const updated = User.update(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, error: "User not found" });
    const { password, ...safe } = updated;
    res.json({ success: true, data: safe });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const deleteUser = (req, res) => {
  if (!User.delete(req.params.id)) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, message: "User deleted" });
};

export const emailUser = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = User.getById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (!subject || !message) return res.status(400).json({ success: false, error: "subject and message required" });
    const sent = await sendCustomEmail(user.email, subject, message);
    res.json({ success: sent, message: sent ? `Email sent to ${user.email}` : "Failed to send. Check SMTP config." });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const emailSubscribers = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, error: "subject and message required" });
    const Subscriber = (await import("../models/Subscriber.js")).default;
    const subs = Subscriber.getAll();
    let sent = 0;
    for (const sub of subs) { if (await sendCustomEmail(sub.email, subject, message)) sent++; }
    res.json({ success: true, message: `Email sent to ${sent}/${subs.length} subscribers` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
