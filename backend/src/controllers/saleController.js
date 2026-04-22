import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { v4 as uuidv4 } from "uuid";
import { notifySubscribersNewSale } from "../services/emailService.js";

export const getActiveSales = (req, res) => {
  try {
    const sales = Sale.getActive();
    const enriched = sales.map(s => ({ ...s, product: Product.getById(s.productId) || null })).filter(s => s.product);
    res.json({ success: true, data: enriched });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getAllSales = (req, res) => {
  try {
    const sales = Sale.getAll();
    const enriched = sales.map(s => ({ ...s, product: Product.getById(s.productId) || null }));
    res.json({ success: true, count: sales.length, data: enriched });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const createSale = async (req, res) => {
  try {
    const { productId, discount, salePrice, tag, endsAt, notifySubscribers } = req.body;
    if (!productId || !discount || !salePrice) return res.status(400).json({ success: false, error: "productId, discount, salePrice required" });
    const product = Product.getById(productId);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const sale = {
      id: uuidv4(), productId, discount: parseFloat(discount), salePrice: parseFloat(salePrice),
      tag: tag || "Sale", active: true, endsAt: endsAt || new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date().toISOString(),
    };
    Sale.create(sale);
    // Send notifications in background — don't block the response
    if (notifySubscribers !== false) {
      notifySubscribersNewSale(sale, product).catch(e => console.error("Notify error:", e.message));
    }
    res.status(201).json({ success: true, data: { ...sale, product } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateSale = (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.discount) updates.discount = parseFloat(updates.discount);
    if (updates.salePrice) updates.salePrice = parseFloat(updates.salePrice);
    const updated = Sale.update(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, error: "Sale not found" });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const deleteSale = (req, res) => {
  if (!Sale.delete(req.params.id)) return res.status(404).json({ success: false, error: "Sale not found" });
  res.json({ success: true, message: "Sale deleted" });
};
