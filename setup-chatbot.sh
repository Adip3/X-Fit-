

echo "🤖 Setting up xsow Chatbot..."



cat > backend/src/controllers/chatController.js << 'CHATCTRL'
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Order from "../models/Order.js";

const greetings = ["hi", "hello", "hey", "howdy", "sup", "yo", "namaste"];
const thankWords = ["thanks", "thank", "thx", "ty"];

function findIntent(msg) {
  const m = msg.toLowerCase().trim();
  if (greetings.some((g) => m.includes(g))) return "greeting";
  if (thankWords.some((t) => m.includes(t))) return "thanks";
  if (m.includes("order") && (m.includes("track") || m.includes("status") || m.includes("where"))) return "track_order";
  if (m.includes("my order") || m.includes("my orders")) return "my_orders";
  if (m.includes("return") || m.includes("refund") || m.includes("exchange")) return "return";
  if (m.includes("shipping") || m.includes("delivery") || m.includes("deliver")) return "shipping";
  if (m.includes("payment") || m.includes("pay") || m.includes("cod") || m.includes("cash")) return "payment";
  if (m.includes("promo") || m.includes("coupon") || m.includes("discount") || m.includes("code")) return "promo";
  if (m.includes("sale") || m.includes("deal") || m.includes("offer")) return "sales";
  if (m.includes("size") || m.includes("sizing") || m.includes("fit")) return "sizing";
  if (m.includes("contact") || m.includes("support") || m.includes("help") || m.includes("human") || m.includes("agent")) return "contact";
  if (m.includes("price") || m.includes("cost") || m.includes("how much")) return "price";
  if (m.includes("product") || m.includes("shoe") || m.includes("collection") || m.includes("catalog")) return "products";
  if (m.includes("cart") || m.includes("add to cart") || m.includes("basket")) return "cart";
  if (m.includes("account") || m.includes("register") || m.includes("sign up") || m.includes("login")) return "account";
  if (m.includes("cancel")) return "cancel";
  return "unknown";
}

export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "Message required" });

    const intent = findIntent(message);
    let reply = "";
    let suggestions = [];
    let products = [];

    switch (intent) {
      case "greeting":
        reply = "Hey there! 👋 Welcome to xsow! I'm your shopping assistant. How can I help you today?";
        suggestions = ["Show me products", "Any active sales?", "Track my order", "Promo codes"];
        break;

      case "thanks":
        reply = "You're welcome! 😊 Happy to help. Anything else I can assist with?";
        suggestions = ["Browse products", "View sales", "Contact support"];
        break;

      case "products": {
        const allProducts = Product.getAll();
        reply = `We have ${allProducts.length} shoes in our collection! Here are some highlights:`;
        products = allProducts.slice(0, 4).map((p) => ({
          id: p.id, name: p.name, price: p.price, image: p.image, category: p.category,
        }));
        suggestions = ["Show running shoes", "Show casual shoes", "Any deals?"];
        break;
      }

      case "price": {
        const m = message.toLowerCase();
        const allProducts = Product.getAll();
        const found = allProducts.find((p) => m.includes(p.name.toLowerCase()));
        if (found) {
          const sale = Sale.getActive().find((s) => s.productId === found.id);
          if (sale) {
            reply = `${found.name} is on sale! Original price: $${found.price}, now just $${sale.salePrice} (${sale.discount}% off)! 🔥`;
          } else {
            reply = `${found.name} is priced at $${found.price}. Great quality for the price!`;
          }
          products = [{ id: found.id, name: found.name, price: found.price, image: found.image, category: found.category }];
        } else {
          reply = "Our shoes range from $99 to $250. Which type are you interested in?";
          suggestions = ["Running shoes", "Casual shoes", "Hiking shoes", "Show all products"];
        }
        break;
      }

      case "sales": {
        const activeSales = Sale.getActive();
        if (activeSales.length === 0) {
          reply = "No active sales right now, but check back soon! We frequently run promotions. 🏷️";
        } else {
          reply = `We have ${activeSales.length} active sale(s)! 🎉`;
          for (const sale of activeSales) {
            const product = Product.getById(sale.productId);
            if (product) {
              products.push({ id: product.id, name: product.name, price: product.price, image: product.image, salePrice: sale.salePrice, discount: sale.discount });
            }
          }
        }
        suggestions = ["Show all products", "Promo codes", "View cart"];
        break;
      }

      case "promo":
        reply = "We have some great promo codes! 🎟️ Try these:\n\n• **XSOW10** — 10% off (min $50 order)\n• **FLAT20** — $20 off (min $100 order)\n• **NEWUSER** — 15% off for new users!\n\nApply them at checkout in your cart.";
        suggestions = ["How to apply promo?", "Show me products", "View cart"];
        break;

      case "track_order":
      case "my_orders":
        if (req.user) {
          const orders = Order.getByUserId(req.user.id);
          if (orders.length === 0) {
            reply = "You don't have any orders yet. Start shopping and place your first order! 🛍️";
            suggestions = ["Browse products", "View sales"];
          } else {
            const latest = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            reply = `Your latest order **${latest.orderNumber}** is currently **${latest.status}**.\n\nYou have ${orders.length} total order(s). Visit the Orders page to see all details.`;
            suggestions = ["View all orders", "Browse products", "Contact support"];
          }
        } else {
          reply = "Please sign in to track your orders. You can log in from the Profile page.";
          suggestions = ["Sign in", "Browse products"];
        }
        break;

      case "shipping":
        reply = "📦 **Shipping Info:**\n\n• Free shipping on orders over $100\n• Standard delivery: 2-4 business days\n• We ship to 34+ countries\n• Tracking provided for all orders\n\nOrders placed before 2 PM ship the same day!";
        suggestions = ["Return policy", "Payment options", "Track order"];
        break;

      case "payment":
        reply = "💳 **Payment Options:**\n\n• Cash on Delivery (COD) — available now!\n• More payment methods coming soon (card, wallet)\n\nAll transactions are 100% secure.";
        suggestions = ["Shipping info", "Place an order", "Browse products"];
        break;

      case "return":
        reply = "🔄 **Return Policy:**\n\n• 30-day hassle-free returns\n• Item must be unworn and in original packaging\n• Free return shipping on defective items\n• Refund processed within 5-7 business days\n\nContact support to initiate a return.";
        suggestions = ["Contact support", "Track order", "Browse products"];
        break;

      case "sizing":
        reply = "📏 **Sizing Guide:**\n\n• Our shoes run true to size\n• If between sizes, we recommend going half size up\n• Check each product page for detailed size charts\n• Not sure? Order your usual size — free returns if it doesn't fit!\n\nNeed help with a specific shoe?";
        suggestions = ["Show products", "Return policy", "Contact support"];
        break;

      case "cart":
        reply = "🛒 You can view and manage your cart from the cart page. Add products from our catalog, adjust quantities, and apply promo codes before checkout!";
        suggestions = ["Browse products", "View sales", "Promo codes"];
        break;

      case "account":
        reply = "👤 You can create an account or sign in from the Profile page. With an account you can:\n\n• Track orders\n• Save your cart\n• Get exclusive promo codes\n• Faster checkout";
        suggestions = ["Sign in", "Browse products", "View sales"];
        break;

      case "cancel":
        reply = "To cancel an order, please contact our support team as soon as possible. Orders that haven't shipped yet can usually be cancelled immediately.";
        suggestions = ["Contact support", "Track order", "Return policy"];
        break;

      case "contact":
        reply = "📞 **Contact Us:**\n\n• Email: customer@xsow.com\n• Phone: +92554862344\n• We respond within 24 hours\n\nOur team is happy to help with any questions!";
        suggestions = ["Track order", "Return policy", "Browse products"];
        break;

      default:
        reply = "I'm not sure I understand that. Here are some things I can help with:";
        suggestions = ["Show products", "Active sales", "Track order", "Promo codes", "Shipping info", "Contact support"];
        break;
    }

    res.json({ success: true, data: { reply, suggestions, products } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
CHATCTRL
echo "✅ backend/src/controllers/chatController.js"

# Chat Routes
cat > backend/src/routes/chatRoutes.js << 'CHATROUTE'
import express from "express";
import { chat } from "../controllers/chatController.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "xsow_secret_key_change_in_production";

// Optional auth — works for both logged-in and guest users
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
};

const router = express.Router();
router.post("/", optionalAuth, chat);
export default router;
CHATROUTE
echo "✅ backend/src/routes/chatRoutes.js"

# Update server.js to add chat route
# Read current server.js, add chat import and route
SERVERFILE="backend/src/server.js"
if ! grep -q "chatRoutes" "$SERVERFILE"; then
  sed -i '' 's|import promoRoutes from "./routes/promoRoutes.js";|import promoRoutes from "./routes/promoRoutes.js";\nimport chatRoutes from "./routes/chatRoutes.js";|' "$SERVERFILE"
  sed -i '' 's|app.use("/api/promos", promoRoutes);|app.use("/api/promos", promoRoutes);\napp.use("/api/chat", chatRoutes);|' "$SERVERFILE"
  echo "✅ Updated backend/src/server.js with chat route"
else
  echo "ℹ️  Chat route already exists in server.js"
fi

# ──────────────────────────────────────────
# FRONTEND: Chatbot Widget Component
# ──────────────────────────────────────────

cat > client/src/Components/ChatBot.jsx << 'CHATBOT'
import { useState, useEffect, useRef } from "react";
import api from "../api/config";

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey! 👋 I'm xsow assistant. How can I help you today?", suggestions: ["Show products", "Active sales", "Track order", "Promo codes"] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { from: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: text.trim() });
      const { reply, suggestions, products } = res.data.data;
      setMessages((prev) => [...prev, { from: "bot", text: reply, suggestions, products }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I'm having trouble right now. Please try again!", suggestions: ["Try again"] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s) => sendMessage(s);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/•/g, '<span style="color:#FF6452">•</span>');
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? "bg-gray-800 rotate-0" : "bg-coral-red hover:scale-110"
        }`}
        style={{ boxShadow: open ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 25px rgba(255,100,82,0.4)" }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "min(550px, calc(100vh - 140px))", animation: "chatSlideUp 0.3s ease-out" }}
        >
          <style>{`
            @keyframes chatSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .chat-scrollbar::-webkit-scrollbar { width: 4px; }
            .chat-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
          `}</style>

          {/* Header */}
          <div className="bg-coral-red px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-montserrat text-sm font-semibold">xsow Assistant</p>
              <p className="text-white/70 font-montserrat text-[11px]">Always here to help</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "order-1" : "order-1"}`}>
                  {/* Avatar for bot */}
                  {msg.from === "bot" && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 bg-coral-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                          <div className="font-montserrat text-sm text-gray-800 leading-relaxed">{formatText(msg.text)}</div>
                        </div>

                        {/* Product Cards */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                            {msg.products.map((p) => (
                              <a key={p.id} href={`/product/${p.id}`} className="flex-shrink-0 w-36 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-24 bg-pale-blue flex items-center justify-center p-2">
                                  <img src={getImg(p.image)} alt={p.name} className="h-16 object-contain" />
                                </div>
                                <div className="p-2">
                                  <p className="font-montserrat text-[11px] font-semibold text-gray-900 truncate">{p.name}</p>
                                  <div className="flex items-center gap-1">
                                    {p.salePrice ? (
                                      <><span className="font-montserrat text-xs font-bold text-coral-red">${p.salePrice}</span><span className="font-montserrat text-[10px] text-slate-gray line-through">${p.price}</span></>
                                    ) : (
                                      <span className="font-montserrat text-xs font-bold text-gray-900">${p.price}</span>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.suggestions.map((s, j) => (
                              <button key={j} onClick={() => handleSuggestion(s)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full font-montserrat text-[11px] text-gray-700 hover:border-coral-red hover:text-coral-red transition-colors">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User message */}
                  {msg.from === "user" && (
                    <div className="bg-coral-red text-white rounded-2xl rounded-tr-md px-4 py-3">
                      <p className="font-montserrat text-sm">{msg.text}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-coral-red rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent font-montserrat text-sm text-gray-800 placeholder-gray-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-coral-red rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
CHATBOT
echo "✅ client/src/Components/ChatBot.jsx"


APPFILE="client/src/App.jsx"
if ! grep -q "ChatBot" "$APPFILE"; then
  sed -i '' 's|import Nav from "./Components/Nav";|import Nav from "./Components/Nav";\nimport ChatBot from "./Components/ChatBot";|' "$APPFILE"
  sed -i '' 's|</BrowserRouter>|<ChatBot />\n  </BrowserRouter>|' "$APPFILE"
  echo "✅ Updated App.jsx with ChatBot component"
else
  echo "ℹ️  ChatBot already in App.jsx"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ CHATBOT SETUP COMPLETE!"
echo "════════════════════════════════════════"
echo ""
echo "Restart backend:"
echo "  kill -9 \$(lsof -ti:5001) 2>/dev/null"
echo "  cd backend && node src/server.js"
echo ""
echo "The chatbot widget appears as a coral-red"
echo "bubble in the bottom-right corner of every page."
echo ""
echo "It can answer questions about:"
echo "  • Products & prices"
echo "  • Active sales & deals"
echo "  • Promo codes (XSOW10, FLAT20, NEWUSER)"
echo "  • Order tracking (for logged-in users)"
echo "  • Shipping, returns, sizing"
echo "  • Payment methods"
echo "  • Account help"
echo "════════════════════════════════════════"