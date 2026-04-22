import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import { v4 as uuidv4 } from "uuid";

const getSaleForProduct = (productId) => {
  const sales = Sale.getActive();
  return sales.find((s) => s.productId === productId) || null;
};

export const getCart = (req, res) => {
  try {
    let cart = Cart.getByUserId(req.user.id);
    if (!cart) {
      cart = { id: uuidv4(), userId: req.user.id, items: [], createdAt: new Date().toISOString() };
      Cart.create(cart);
    }
    const enrichedItems = cart.items.map((item) => {
      const product = Product.getById(item.productId);
      const sale = getSaleForProduct(item.productId);
      const effectivePrice = sale ? sale.salePrice : (product?.price || 0);
      return {
        ...item,
        product: product || { name: "Deleted Product", price: 0, image: "" },
        sale: sale ? { discount: sale.discount, salePrice: sale.salePrice, tag: sale.tag } : null,
        effectivePrice,
      };
    });
    const total = enrichedItems.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0);
    const originalTotal = enrichedItems.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
    res.json({ success: true, data: { ...cart, items: enrichedItems, total, originalTotal, savings: originalTotal - total } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addToCart = (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: "productId is required" });
    const product = Product.getById(productId);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ success: false, error: "Not enough stock" });

    let cart = Cart.getByUserId(req.user.id);
    if (!cart) {
      cart = { id: uuidv4(), userId: req.user.id, items: [], createdAt: new Date().toISOString() };
      Cart.create(cart);
    }
    const existingIndex = cart.items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) { cart.items[existingIndex].quantity += quantity; }
    else { cart.items.push({ productId, quantity, addedAt: new Date().toISOString() }); }
    Cart.update(cart.id, { items: cart.items });
    res.json({ success: true, message: "Added to cart", data: cart });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateCartItem = (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    let cart = Cart.getByUserId(req.user.id);
    if (!cart) return res.status(404).json({ success: false, error: "Cart not found" });
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, error: "Item not in cart" });
    if (quantity <= 0) { cart.items.splice(itemIndex, 1); } else { cart.items[itemIndex].quantity = quantity; }
    Cart.update(cart.id, { items: cart.items });
    res.json({ success: true, data: cart });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const removeFromCart = (req, res) => {
  try {
    const { productId } = req.params;
    let cart = Cart.getByUserId(req.user.id);
    if (!cart) return res.status(404).json({ success: false, error: "Cart not found" });
    cart.items = cart.items.filter((i) => i.productId !== productId);
    Cart.update(cart.id, { items: cart.items });
    res.json({ success: true, message: "Item removed", data: cart });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const clearCart = (req, res) => {
  try {
    let cart = Cart.getByUserId(req.user.id);
    if (cart) Cart.update(cart.id, { items: [] });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
