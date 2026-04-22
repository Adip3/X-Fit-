import Promo from "../models/Promo.js";
import { v4 as uuidv4 } from "uuid";

export const validatePromo = (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, error: "Promo code is required" });

    const promo = Promo.getByCode(code);
    if (!promo) return res.status(404).json({ success: false, error: "Invalid promo code" });
    if (!promo.active) return res.status(400).json({ success: false, error: "This promo code is no longer active" });
    if (new Date(promo.expiresAt) < new Date()) return res.status(400).json({ success: false, error: "This promo code has expired" });
    if (promo.usedCount >= promo.maxUses) return res.status(400).json({ success: false, error: "This promo code has reached its usage limit" });
    if (subtotal < promo.minOrder) return res.status(400).json({ success: false, error: `Minimum order of $${promo.minOrder} required for this code` });

    let discount = 0;
    if (promo.type === "percentage") {
      discount = (subtotal * promo.value) / 100;
    } else {
      discount = promo.value;
    }
    discount = Math.min(discount, subtotal);

    res.json({
      success: true,
      data: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discount: parseFloat(discount.toFixed(2)),
        message: promo.type === "percentage" ? `${promo.value}% off applied!` : `$${promo.value} off applied!`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllPromos = (req, res) => {
  res.json({ success: true, data: Promo.getAll() });
};

export const createPromo = (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
    if (!code || !type || !value) return res.status(400).json({ success: false, error: "code, type, value required" });
    if (Promo.getByCode(code)) return res.status(400).json({ success: false, error: "Code already exists" });

    const promo = {
      id: uuidv4(), code: code.toUpperCase(), type, value: parseFloat(value),
      minOrder: parseFloat(minOrder) || 0, maxUses: parseInt(maxUses) || 999,
      usedCount: 0, active: true,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    Promo.create(promo);
    res.status(201).json({ success: true, data: promo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePromo = (req, res) => {
  const updated = Promo.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data: updated });
};

export const deletePromo = (req, res) => {
  const deleted = Promo.delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, message: "Deleted" });
};
