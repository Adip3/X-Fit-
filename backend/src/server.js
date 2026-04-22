import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { esewaPayPage, khaltiPayPage, cardPayPage } from "./routes/paymentRoutes.js";
import bulkOrderRoutes from "./routes/bulkOrderRoutes.js";

import { verifySmtp } from "./services/emailService.js";
import { startSaleExpiryChecker } from "./services/cronService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Self-hosted payment gateway pages (served as HTML)
app.get("/pay/esewa", esewaPayPage);
app.get("/pay/khalti", khaltiPayPage);
app.get("/pay/card", cardPayPage);

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bulk-orders", bulkOrderRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/stats", async (req, res) => {
  try {
    const Product = (await import("./models/Product.js")).default;
    const User = (await import("./models/User.js")).default;
    const Order = (await import("./models/Order.js")).default;
    const Subscriber = (await import("./models/Subscriber.js")).default;
    const Sale = (await import("./models/Sale.js")).default;
    const Promo = (await import("./models/Promo.js")).default;
    res.json({ success: true, data: {
      totalProducts: Product.getAll().length, totalUsers: User.getAll().length,
      totalOrders: Order.getAll().length, totalSubscribers: Subscriber.getAll().length,
      totalSales: Sale.getActive().length, totalPromos: Promo.getAll().filter(p => p.active).length,
      revenue: Order.getAll().reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, async () => {
  console.log("🚀 xsow Backend running at http://localhost:" + PORT);
  console.log("📦 JSON DB | 🛒 Cart | 📋 Orders | 🏷️ Sales | 🎟️ Promos | 👥 Users | 📧 Email");
  await verifySmtp();
  startSaleExpiryChecker();
});
