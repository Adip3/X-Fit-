import BulkOrder from "../models/BulkOrder.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { sendBulkOrderResponse } from "../services/emailService.js";

// Customer submits a bulk order request
export const createBulkOrderRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, message, businessName, phone } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    // Validate and enrich items
    const enrichedItems = items.map((item) => {
      const product = Product.getById(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        name: product.name,
        originalPrice: product.price,
        requestedQuantity: parseInt(item.quantity) || 1,
        fabric: product.fabric || "",
        image: product.image,
        // Admin will fill these later
        bulkPrice: null,
        approved: false,
      };
    }).filter(Boolean);

    if (!enrichedItems.length) {
      return res.status(400).json({ success: false, error: "No valid products found" });
    }

    const user = User.getById(userId);
    const bulkOrder = {
      id: uuidv4(),
      requestNumber: "BLK-" + uuidv4().slice(0, 8).toUpperCase(),
      userId,
      customerName: user?.name || "Customer",
      customerEmail: user?.email || "",
      businessName: businessName || "",
      phone: phone || "",
      items: enrichedItems,
      message: message || "",
      status: "pending", // pending, quoted, accepted, rejected
      adminNote: "",
      totalOriginal: enrichedItems.reduce((sum, i) => sum + i.originalPrice * i.requestedQuantity, 0),
      totalBulkPrice: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    BulkOrder.create(bulkOrder);
    res.status(201).json({ success: true, data: bulkOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Customer gets their bulk order requests
export const getMyBulkOrders = (req, res) => {
  try {
    const orders = BulkOrder.getByUserId(req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin gets all bulk order requests
export const getAllBulkOrders = (req, res) => {
  try {
    const orders = BulkOrder.getAll()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin sends updated price list (quote) for bulk order
export const quoteBulkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, adminNote } = req.body;
    const order = BulkOrder.getById(id);
    if (!order) return res.status(404).json({ success: false, error: "Bulk order not found" });

    // Update items with bulk prices
    const updatedItems = order.items.map((item) => {
      const update = items?.find((i) => i.productId === item.productId);
      if (update) {
        return {
          ...item,
          bulkPrice: parseFloat(update.bulkPrice) || item.originalPrice,
          approved: update.approved !== false,
        };
      }
      return item;
    });

    const totalBulkPrice = updatedItems
      .filter((i) => i.approved)
      .reduce((sum, i) => sum + (i.bulkPrice || i.originalPrice) * i.requestedQuantity, 0);

    const updates = {
      items: updatedItems,
      status: "quoted",
      adminNote: adminNote || "",
      totalBulkPrice,
      updatedAt: new Date().toISOString(),
    };

    const updated = BulkOrder.update(id, updates);

    // Send email notification to customer with price list
    try {
      await sendBulkOrderResponse({ ...order, ...updates });
    } catch (e) {
      console.error("Bulk order email failed:", e.message);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin updates bulk order status
export const updateBulkOrderStatus = (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const order = BulkOrder.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Bulk order not found" });

    const updated = BulkOrder.update(req.params.id, {
      status,
      adminNote: adminNote || order.adminNote,
      updatedAt: new Date().toISOString(),
    });

    // If accepted, deduct stock for all items
    if (status === "accepted") {
      order.items.forEach((item) => {
        const product = Product.getById(item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.requestedQuantity);
          Product.update(item.productId, { stock: newStock });
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete bulk order
export const deleteBulkOrder = (req, res) => {
  if (!BulkOrder.delete(req.params.id)) {
    return res.status(404).json({ success: false, error: "Bulk order not found" });
  }
  res.json({ success: true, message: "Deleted" });
};
