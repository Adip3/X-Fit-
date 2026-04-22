import Subscriber from "../models/Subscriber.js";
import { v4 as uuidv4 } from "uuid";

export const subscribe = (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });

    if (Subscriber.getByEmail(email))
      return res.status(400).json({ success: false, error: "Already subscribed" });

    const sub = { id: uuidv4(), email, subscribedAt: new Date().toISOString() };
    Subscriber.create(sub);
    res.status(201).json({ success: true, message: "Subscribed successfully", data: sub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllSubscribers = (req, res) => {
  const subs = Subscriber.getAll();
  res.json({ success: true, count: subs.length, data: subs });
};
