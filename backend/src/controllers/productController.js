import Product from "../models/Product.js";
import { v4 as uuidv4 } from "uuid";

export const getAllProducts = (req, res) => {
  try {
    const { category, featured, search, admin } = req.query;
    // Admin sees all products; public sees only visible/launched ones
    let products = admin === "true" ? Product.getAll() : Product.getVisible();

    if (category) products = products.filter((p) => p.category && p.category.toLowerCase() === category.toLowerCase());
    if (featured === "true") products = products.filter((p) => p.featured);
    if (search) products = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.fabric && p.fabric.toLowerCase().includes(search.toLowerCase())));

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProductById = (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: "Product not found" });
  res.json({ success: true, data: product });
};

export const createProduct = (req, res) => {
  try {
    const launchVal = req.body.launchDate && req.body.launchDate !== "" ? req.body.launchDate : null;
    const hasLaunch = launchVal && new Date(launchVal) > new Date();
    const featuredVal = req.body.featured === "true" || req.body.featured === true;
    const product = {
      id: uuidv4(),
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image || "",
      price: parseFloat(req.body.price) || 0,
      stock: parseInt(req.body.stock) || 0,
      rating: parseFloat(req.body.rating) || 0,
      reviews: 0,
      featured: featuredVal,
      fabric: req.body.fabric || "",
      minOrder: parseInt(req.body.minOrder) || 1,
      launchDate: launchVal,
      isVisible: hasLaunch ? false : true,
      createdAt: new Date().toISOString(),
    };
    Product.create(product);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProduct = (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/${req.file.filename}`;
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.stock) updates.stock = parseInt(updates.stock);
    if (updates.featured !== undefined) updates.featured = updates.featured === "true" || updates.featured === true;
    if (updates.minOrder) updates.minOrder = parseInt(updates.minOrder);
    // If launchDate is set in the future, mark invisible; if past or cleared, mark visible
    if (updates.launchDate !== undefined) {
      const lv = updates.launchDate && updates.launchDate !== "" ? updates.launchDate : null;
      updates.launchDate = lv;
      if (lv && new Date(lv) > new Date()) {
        updates.isVisible = false;
      } else {
        updates.isVisible = true;
      }
    }

    const updated = Product.update(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProduct = (req, res) => {
  const deleted = Product.delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: "Product not found" });
  res.json({ success: true, message: "Product deleted" });
};

// Get scheduled/upcoming launches
export const getScheduledLaunches = (req, res) => {
  try {
    const scheduled = Product.getScheduled();
    res.json({ success: true, count: scheduled.length, data: scheduled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Notify subscribers about a product
export const notifySubscribersAboutProduct = async (req, res) => {
  try {
    const product = Product.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const { notifySubscribersNewProduct } = await import("../services/emailService.js");
    const sent = await notifySubscribersNewProduct(product);
    res.json({ success: true, message: `Notified ${sent} subscriber(s)`, sent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
