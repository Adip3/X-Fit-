#!/bin/bash

# ═══════════════════════════════════════════════════════════
# xsow AI Chatbot v3 — Smart NLP Setup
# Run from project root (x-fit/)
# ═══════════════════════════════════════════════════════════

echo "🧠 Installing xsow AI Chatbot v3..."
echo ""

# Backend controller
cp chatController.js backend/src/controllers/chatController.js
echo "✅ backend/src/controllers/chatController.js"

# Chat Routes
cat > backend/src/routes/chatRoutes.js << 'ROUTE'
import express from "express";
import { chat } from "../controllers/chatController.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "xsow_secret_key_change_in_production";

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
};

const router = express.Router();
router.post("/", optionalAuth, chat);
export default router;
ROUTE
echo "✅ backend/src/routes/chatRoutes.js"

# Update server.js
SERVERFILE="backend/src/server.js"
if ! grep -q "chatRoutes" "$SERVERFILE"; then
  sed -i 's|import promoRoutes from "./routes/promoRoutes.js";|import promoRoutes from "./routes/promoRoutes.js";\nimport chatRoutes from "./routes/chatRoutes.js";|' "$SERVERFILE"
  sed -i 's|app.use("/api/promos", promoRoutes);|app.use("/api/promos", promoRoutes);\napp.use("/api/chat", chatRoutes);|' "$SERVERFILE"
  echo "✅ Updated server.js"
else
  echo "ℹ️  Chat route exists in server.js"
fi

# Frontend component
cp ChatBot.jsx client/src/Components/ChatBot.jsx
echo "✅ client/src/Components/ChatBot.jsx"

# Update App.jsx
APPFILE="client/src/App.jsx"
if ! grep -q "ChatBot" "$APPFILE"; then
  sed -i 's|import Nav from "./Components/Nav";|import Nav from "./Components/Nav";\nimport ChatBot from "./Components/ChatBot";|' "$APPFILE"
  sed -i 's|</BrowserRouter>|<ChatBot />\n  </BrowserRouter>|' "$APPFILE"
  echo "✅ Updated App.jsx"
else
  echo "ℹ️  ChatBot in App.jsx"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ xsow AI CHATBOT v3 INSTALLED!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🧠 SMART NLP FEATURES:"
echo ""
echo "  NATURAL LANGUAGE UNDERSTANDING:"
echo "    ✦ Fuzzy product name matching (typos OK)"
echo "    ✦ Pronoun resolution ('how much is it?')"
echo "    ✦ Context memory across messages"
echo "    ✦ Multi-entity extraction in one message"
echo "    ✦ 30+ regex intent patterns"
echo ""
echo "  CUSTOM REQUESTS HANDLED:"
echo "    'I have \$300, want 2 pairs of running shoes'"
echo "    'Is the blue one available in size 10?'"
echo "    'Something stylish for a party under \$150'"
echo "    'Compare the cheapest with the premium one'"
echo "    'Gift for my sister who likes hiking'"
echo "    'How much for 5 pairs of Trail Master?'"
echo "    'Show me casual shoes under \$120 in black'"
echo "    'Which one is better for gym?'"
echo "    'Same budget but show me casual shoes'"
echo ""
echo "  CATEGORIES: budget shop, stock check, compare,"
echo "  recommend, outfit/style, gift finder, price range,"
echo "  bulk calc, sort, new arrivals, track order,"
echo "  shipping, returns, sizing, promo, warranty, care..."
echo ""
echo "  Restart: cd backend && node src/server.js"
echo "═══════════════════════════════════════════════════════════"