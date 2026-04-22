import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import { v4 as uuidv4 } from "uuid";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "../services/emailService.js";

export const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city)
      return res.status(400).json({ success: false, error: "Shipping address required" });
    const cart = Cart.getByUserId(userId);
    if (!cart || !cart.items?.length) return res.status(400).json({ success: false, error: "Cart is empty" });

    const activeSales = Sale.getActive();
    let totalAmount = 0;
    const items = cart.items.map(item => {
      const product = Product.getById(item.productId);
      if (!product) return null;
      const sale = activeSales.find(s => s.productId === item.productId);
      const price = sale ? sale.salePrice : product.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;
      Product.update(product.id, { stock: Math.max(0, product.stock - item.quantity) });
      return { productId: item.productId, name: product.name, originalPrice: product.price, price, quantity: item.quantity, image: product.image, subtotal, onSale: !!sale, discount: sale?.discount || 0 };
    }).filter(Boolean);

    const order = {
      id: uuidv4(), orderNumber: "XS-" + uuidv4().slice(0, 8).toUpperCase(), userId, items, totalAmount,
      shippingAddress, paymentMethod: paymentMethod || "cod", paymentStatus: "pending", status: "confirmed",
      timeline: [{ status: "confirmed", date: new Date().toISOString(), note: "Order placed successfully" }],
      createdAt: new Date().toISOString(),
    };
    Order.create(order);
    Cart.deleteByUserId(userId);
    sendOrderConfirmation(order).catch(() => {});
    res.status(201).json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getMyOrders = (req, res) => {
  const orders = Order.getAll().filter(o => o.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: orders });
};

export const getOrderById = (req, res) => {
  const order = Order.getById(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });
  res.json({ success: true, data: order });
};

export const getAllOrders = (req, res) => {
  res.json({ success: true, count: Order.getAll().length, data: Order.getAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, paymentStatus } = req.body;
    const order = Order.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    const updates = {};
    if (status) {
      updates.status = status;
      updates.timeline = [...(order.timeline || []), { status, date: new Date().toISOString(), note: note || `Status: ${status}` }];
    }
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (status === "delivered" && !paymentStatus) updates.paymentStatus = "paid";
    const updated = Order.update(req.params.id, updates);
    if (status) sendOrderStatusUpdate({ ...order, ...updates }).catch(() => {});
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
