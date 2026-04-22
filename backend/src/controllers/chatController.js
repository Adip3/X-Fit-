import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════
// SESSION MEMORY
// ═══════════════════════════════════════════
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function getSession(id) {
  if (!id) return null;
  const s = sessions.get(id);
  if (s && Date.now() - s.ts > SESSION_TTL) { sessions.delete(id); return null; }
  return s;
}

function saveSession(id, data) {
  if (!id) return;
  const s = getSession(id) || { history: [], context: {}, ts: Date.now() };
  Object.assign(s, data, { ts: Date.now() });
  s.history.push({ role: "user", content: data.lastMsg, intent: data.intent });
  if (s.history.length > 20) s.history = s.history.slice(-20);
  sessions.set(id, s);
}

// ═══════════════════════════════════════════
// BUDGET EXTRACTION (with operators)
// Returns: { operator: "below"|"above"|"exact"|"between", min, max, value, raw }
// ═══════════════════════════════════════════
function extractBudget(msg) {
  const m = msg.toLowerCase();

  // 1) BETWEEN / RANGE — e.g. "between $100 and $200", "$100 to $200", "100-200"
  const betweenRx = [
    /(?:between|from|range)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-|–|~)\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /\$\s*(\d+(?:\.\d+)?)\s*(?:to|-|–|~)\s*\$\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(?:dollars|usd|bucks|\$)/i,
  ];
  for (const rx of betweenRx) {
    const x = msg.match(rx);
    if (x) {
      const a = parseFloat(x[1]), b = parseFloat(x[2]);
      const min = Math.min(a, b), max = Math.max(a, b);
      return { operator: "between", min, max, value: max, raw: `${min}-${max}` };
    }
  }

  // 2) ABOVE / OVER / MORE THAN — e.g. "above $200", "more than 150", "premium over $300"
  const aboveRx = /(?:above|over|more\s+than|greater\s+than|higher\s+than|starting\s+(?:from|at)|minimum|at\s+least|from)\s*\$?\s*(\d+(?:\.\d+)?)/i;
  const aboveMatch = msg.match(aboveRx);
  if (aboveMatch) {
    const v = parseFloat(aboveMatch[1]);
    return { operator: "above", min: v, max: null, value: v, raw: `>${v}` };
  }

  // 3) EXACT / AROUND / APPROXIMATELY — e.g. "around $150", "exactly 100", "about $200"
  const exactRx = /(?:exactly|exact|around|about|approximately|approx|roughly|near|close\s+to|nearly)\s*\$?\s*(\d+(?:\.\d+)?)/i;
  const exactMatch = msg.match(exactRx);
  if (exactMatch) {
    const v = parseFloat(exactMatch[1]);
    // ±15% tolerance or at least ±$20
    const tolerance = Math.max(v * 0.15, 20);
    return {
      operator: "exact",
      min: Math.max(0, v - tolerance),
      max: v + tolerance,
      value: v,
      raw: `~${v}`,
    };
  }

  // 4) BELOW / UNDER / WITHIN — e.g. "under $100", "budget $200", "less than 150"
  const belowRx = /(?:below|under|within|less\s+than|lower\s+than|max(?:imum)?|up\s*to|at\s+most|no\s+more\s+than|budget|afford|spend|have|cheaper\s+than)\s*\$?\s*(\d+(?:\.\d+)?)/i;
  const belowMatch = msg.match(belowRx);
  if (belowMatch) {
    const v = parseFloat(belowMatch[1]);
    return { operator: "below", min: null, max: v, value: v, raw: `<${v}` };
  }

  // 5) PLAIN amount — "$200", "200 dollars" → default to "below"
  const plainRx = [/\$\s*(\d+(?:\.\d+)?)/, /(\d+(?:\.\d+)?)\s*(?:dollars|usd|bucks)\b/i];
  for (const rx of plainRx) {
    const x = msg.match(rx);
    if (x) {
      const v = parseFloat(x[1]);
      return { operator: "below", min: null, max: v, value: v, raw: `<${v}` };
    }
  }

  return null;
}

// ═══════════════════════════════════════════
// KEYWORD EXTRACTION (for deep attribute search)
// ═══════════════════════════════════════════
const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","am",
  "i","me","my","we","us","our","you","your","he","she","it","they","them",
  "this","that","these","those","there","here",
  "show","find","search","get","give","want","need","have","has","had","looking",
  "please","can","could","would","should","will","shall","may","might",
  "with","for","about","of","to","in","on","at","by","from","into","onto",
  "and","or","but","if","so","as","than","then","also","too",
  "some","any","all","every","each","few","more","most","less","least",
  "do","does","did","done","make","made",
  "what","which","who","whom","where","when","why","how",
  "hi","hello","hey","thanks","thank","ok","okay","yes","no",
  "products","product","items","item","shoe","shoes","pair","pairs","unit","units",
  "me","us","something","anything","stuff","things","thing",
  "tell","know","like","want",
  "dollar","dollars","usd","bucks","buck","price","priced",
]);

function extractKeywords(msg) {
  return msg
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")         // strip punctuation
    .replace(/\b\d+(?:\.\d+)?\b/g, " ") // strip numbers (prices/qty handled separately)
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

// ═══════════════════════════════════════════
// ENTITY EXTRACTION (Semantic Search)
// ═══════════════════════════════════════════
function extractEntities(msg, allProducts) {
  const m = msg.toLowerCase().trim();
  const e = {};

  // Budget (with operator)
  e.budget = extractBudget(msg);

  // Quantity
  const qtyPats = [
    /(\d+)\s*(?:pairs?|units?|pieces?|pcs|qty|nos)/i,
    /(?:buy|want|need|order|add|get)\s+(\d+)\b/i,
    /(\d+)\s*(?:of\s+them|of\s+those)/i,
  ];
  for (const p of qtyPats) { const x = msg.match(p); if (x) { e.quantity = parseInt(x[1]); break; } }

  // Category
  const cats = [
    { key: "Running", words: ["running","run","jog","jogging","marathon"] },
    { key: "Casual",  words: ["casual","everyday","street","sneaker","lifestyle"] },
    { key: "Hiking",  words: ["hiking","hike","trek","trail","outdoor","mountain"] },
    { key: "Sports",  words: ["sport","training","gym","workout","fitness","athletic"] },
    { key: "Formal",  words: ["formal","dress","office","business","oxford","loafer"] },
    { key: "Clothes", words: ["clothes","clothing","shirt","t-shirt","tshirt","jacket","hoodie","pants","track suit"] },
  ];
  for (const c of cats) { if (c.words.some(w => m.includes(w))) { e.category = c.key; break; } }

  // Fabric
  const fabrics = ["cotton","polyester","leather","suede","canvas","mesh","knit","denim","silk","wool","nylon","gore-tex","waterproof","breathable"];
  e.fabric = fabrics.find(f => m.includes(f)) || null;

  // Color
  const colors = ["black","white","red","blue","green","grey","gray","brown","navy","pink","yellow","orange","purple","beige","cream","tan","olive","maroon"];
  e.color = colors.find(c => m.includes(c)) || null;

  // Sort
  if (m.match(/cheapest|lowest\s+price|most\s+affordable/i)) e.sort = "price_asc";
  else if (m.match(/expensive|premium|highest\s+price|luxury|top\s+end/i)) e.sort = "price_desc";
  else if (m.match(/popular|best\s+sell|trending|top\s+rated|bestseller/i)) e.sort = "popular";
  else if (m.match(/newest|latest|new\s+arrival|just\s+in|recently\s+added/i)) e.sort = "newest";

  // Fuzzy product match (now includes description)
  e.product = fuzzyMatch(m, allProducts);

  // Keywords for deep search across all attributes
  e.keywords = extractKeywords(msg);

  // Bulk detection
  e.isBulk = !!(m.match(/\b(bulk|wholesale|100\s*units|50\s*units|large\s*order|business|retailer|resell)/i) || (e.quantity && e.quantity >= 10));

  // Order ID
  const oid = msg.match(/\b(XS-[A-Z0-9]{8})\b/i) || msg.match(/(?:order|#|id)\s*:?\s*([A-Za-z0-9-]{6,})/i);
  if (oid) e.orderId = oid[1];

  return e;
}

// ═══════════════════════════════════════════
// FUZZY PRODUCT MATCH — searches ALL attributes
// ═══════════════════════════════════════════
function fuzzyMatch(text, products) {
  let best = null, bestScore = 0.35;
  const words = text.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));

  for (const p of products) {
    const name     = (p.name || "").toLowerCase();
    const desc     = (p.description || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const fabric   = (p.fabric || "").toLowerCase();
    const color    = (p.color || "").toLowerCase();
    const brand    = (p.brand || "").toLowerCase();
    const tags     = (p.tags || []).join(" ").toLowerCase();

    let score = 0;

    // Full name match is strongest
    if (name && text.includes(name.trim())) score += 0.95;

    // Per-keyword matching across all fields
    for (const w of words) {
      if (name.includes(w))     score += 0.35;
      if (desc.includes(w))     score += 0.20;  // NEW: description match
      if (category.includes(w)) score += 0.15;
      if (fabric.includes(w))   score += 0.15;
      if (color.includes(w))    score += 0.15;
      if (brand.includes(w))    score += 0.25;
      if (tags.includes(w))     score += 0.15;
    }

    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

// ═══════════════════════════════════════════
// INTENT DETECTION
// ═══════════════════════════════════════════
const INTENTS = [
  { id: "greeting",      rx: [/^(hi|hello|hey|yo|namaste|sup|howdy|good\s*(morning|afternoon|evening))[!.\s]*$/i] },
  { id: "bye",           rx: [/\b(bye|goodbye|see you|later|cya|take care)\b/i] },
  { id: "thanks",        rx: [/\b(thanks?|thank you|thx|ty|appreciated)\b/i], short: true },
  { id: "help",          rx: [/\b(help|support|what can you|how to use|guide)\b/i] },
  { id: "add_to_cart",   rx: [/\b(add to cart|add.*cart|buy this|i want this|i.ll take|put in cart|add to bag)\b/i] },
  { id: "view_cart",     rx: [/\b(view cart|show cart|my cart|what.*in.*cart|see cart|cart items|open cart)\b/i] },
  { id: "remove_cart",   rx: [/\b(remove from cart|delete from cart|remove item|take out.*cart)\b/i] },
  { id: "clear_cart",    rx: [/\b(clear cart|empty cart|remove all|delete all items)\b/i] },
  { id: "checkout",      rx: [/\b(checkout|check out|place order|complete purchase|proceed to pay|buy now)\b/i] },
  { id: "track_order",   rx: [/\b(track|where is|order status|my order|delivery status|shipping status|order history)\b/i] },
  // Budget — now covers above / below / exact / between
  { id: "budget_shop",   rx: [
      /\b(budget|under|within|less than|afford|spend)\b/i,
      /\b(above|over|more than|greater than|higher than|at least)\s*\$?\s*\d+/i,
      /\b(exactly|around|about|approximately|roughly|near|close to)\s*\$?\s*\d+/i,
      /\b(between|from)\s*\$?\s*\d+\s*(?:and|to|-)/i,
  ]},
  { id: "bulk_order",    rx: [/\b(bulk|wholesale|large order|100 units|50 units|business price|resell|moq|minimum order)\b/i] },
  { id: "fabric_search", rx: [/\b(fabric|material|made of|cotton|leather|suede|mesh|what.*fabric|cloth type)\b/i] },
  { id: "recommend",     rx: [/\b(recommend|suggest|best for|good for|what should i|ideal|popular)\b/i] },
  { id: "product_info",  rx: [/\b(tell me about|details|specs|features|describe|info about|what is)\b/i] },
  { id: "stock_check",   rx: [/\b(stock|available|in stock|out of stock|how many left|availability)\b/i] },
  { id: "search",        rx: [/\b(show|list|browse|view|see|find|search|display)\s*(me\s*)?(products?|shoes?|items?|collection|catalog)/i] },
  { id: "new_arrivals",  rx: [/\b(new|latest|fresh|just dropped|recently|arrivals)\b/i] },
  { id: "deals",         rx: [/\b(sale|deal|discount|offer|promo|clearance|on sale)\b/i] },
  { id: "shipping",      rx: [/\b(shipping|delivery|delivery time|ship|free shipping)\b/i] },
  { id: "return_policy", rx: [/\b(return|refund|exchange|return policy|money back)\b/i] },
  { id: "size_guide",    rx: [/\b(size|sizing|fit|measurement|true to size|size chart)\b/i] },
  { id: "care_guide",    rx: [/\b(care|clean|wash|maintain|how to clean)\b/i] },
];

function detectIntent(msg, entities, session) {
  const m = msg.toLowerCase().trim();

  if (m.match(/clear cart|empty cart/i)) return "clear_cart";
  if (entities.orderId || m.match(/track.*order|order.*status|my order/i)) return "track_order";

  for (const { id, rx, short } of INTENTS) {
    if (short && m.split(/\s+/).length > 6) continue;
    for (const r of rx) { if (r.test(m)) return id; }
  }

  if (entities.isBulk)   return "bulk_order";
  if (entities.budget)   return "budget_shop";
  if (entities.fabric)   return "fabric_search";
  if (entities.product)  return "product_info";
  if (entities.category) return "recommend";
  if (entities.sort)     return "search";

  // If we have any meaningful keyword, try a deep search
  if (entities.keywords?.length > 0) return "search";

  return "unknown";
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
const fmt = (n) => `$${Number(n).toFixed(2)}`;

function productCard(p, sale) {
  return {
    id: p.id, name: p.name, price: p.price, image: p.image,
    category: p.category || "", fabric: p.fabric || "",
    salePrice: sale?.salePrice || null, discount: sale?.discount || null,
    rating: p.rating || 0, inStock: p.stock > 0, stock: p.stock || 0,
    minOrder: p.minOrder || 1, description: p.description || "",
  };
}

// Describe the budget filter in plain English
function describeBudget(b) {
  if (!b) return "";
  if (b.operator === "below")   return `under ${fmt(b.max)}`;
  if (b.operator === "above")   return `above ${fmt(b.min)}`;
  if (b.operator === "exact")   return `around ${fmt(b.value)}`;
  if (b.operator === "between") return `between ${fmt(b.min)} and ${fmt(b.max)}`;
  return "";
}

// Check if a unit price passes a budget filter (for the requested quantity)
function priceMatchesBudget(unitPrice, budget, qty = 1) {
  if (!budget) return true;
  const total = unitPrice * qty;
  if (budget.operator === "below")   return total <= budget.max;
  if (budget.operator === "above")   return total >= budget.min;
  if (budget.operator === "exact")   return total >= budget.min && total <= budget.max;
  if (budget.operator === "between") return total >= budget.min && total <= budget.max;
  return true;
}

// ═══════════════════════════════════════════
// SEARCH — now searches ALL product attributes
// and honours budget operators.
// ═══════════════════════════════════════════
function searchProducts(allProducts, activeSales, filters) {
  const { category, budget, fabric, color, sort, quantity, keywords } = filters;
  let results = [...allProducts].filter(p => p.stock > 0);

  // 1) Exact attribute filters
  if (category) results = results.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  if (fabric)   results = results.filter(p => p.fabric?.toLowerCase().includes(fabric));
  if (color) {
    results = results.filter(p => {
      const hay = [p.color, p.name, p.description].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(color.toLowerCase());
    });
  }

  // 2) Deep keyword search across ALL attributes (incl. description)
  if (keywords && keywords.length > 0) {
    const scored = results.map(p => {
      const hay = [
        p.name, p.description, p.category, p.fabric, p.color,
        p.brand, (p.tags || []).join(" "), p.gender, p.style,
      ].filter(Boolean).join(" ").toLowerCase();
      const hits = keywords.filter(kw => hay.includes(kw)).length;
      return { p, hits };
    }).filter(x => x.hits > 0);

    // Only apply keyword filter if we actually match something
    if (scored.length > 0) {
      scored.sort((a, b) => b.hits - a.hits);
      results = scored.map(x => x.p);
    }
  }

  // 3) Budget (supports below / above / exact / between)
  if (budget) {
    const qty = quantity || 1;
    results = results.filter(p => {
      const sale = activeSales.find(s => s.productId === p.id);
      const unit = sale ? sale.salePrice : p.price;
      return priceMatchesBudget(unit, budget, qty);
    });
  }

  // 4) Sort
  if (sort === "price_asc")  results.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") results.sort((a, b) => b.price - a.price);
  else if (sort === "newest")     results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === "popular")    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return results.slice(0, 5).map(p => productCard(p, activeSales.find(s => s.productId === p.id)));
}

function getUserCart(userId) {
  if (!userId) return null;
  const cart = Cart.getByUserId(userId);
  if (!cart || !cart.items?.length) return null;
  const activeSales = Sale.getActive();
  let total = 0, count = 0;
  const items = cart.items.map(item => {
    const p = Product.getById(item.productId);
    if (!p) return null;
    const sale = activeSales.find(s => s.productId === item.productId);
    const price = sale ? sale.salePrice : p.price;
    total += price * item.quantity;
    count += item.quantity;
    return { ...item, name: p.name, price, originalPrice: p.price, image: p.image, fabric: p.fabric, discount: sale?.discount || 0 };
  }).filter(Boolean);
  return { id: cart.id, items, total, count, savings: items.reduce((s, i) => s + (i.originalPrice - i.price) * i.quantity, 0) };
}

// ═══════════════════════════════════════════
// MAIN CHAT HANDLER
// ═══════════════════════════════════════════
export const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, error: "Message required" });

    const userId = req.user?.id || req.body.userId || null;
    const sid = sessionId || `s_${Date.now()}`;
    const session = getSession(sid);

    const allProducts = Product.getVisible();
    const activeSales = Sale.getActive();

    const entities = extractEntities(message, allProducts);
    const intent = detectIntent(message, entities, session);

    // Pronoun resolution from session context
    if (!entities.product && session?.context?.lastProduct) {
      const m = message.toLowerCase();
      if (m.match(/\b(it|this|that|the one|same one)\b/)) {
        entities.product = Product.getById(session.context.lastProduct);
      }
    }
    if (!entities.budget && session?.context?.lastBudget && message.toLowerCase().match(/same budget|like that/)) {
      entities.budget = session.context.lastBudget;
    }

    let reply = "";
    let suggestions = [];
    let products = [];
    let cartData = null;

    switch (intent) {

      // ─── GREETING ───
      case "greeting": {
        const h = new Date().getHours();
        const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
        const totalProducts = allProducts.length;
        const activeDeals = activeSales.length;
        reply = `${greet}! 👋 Welcome to **xsow**!\n\nWe have **${totalProducts} products** in stock${activeDeals > 0 ? ` and **${activeDeals} deals** running` : ""}.\n\nHow can I help you today?`;
        suggestions = ["Show products", "Today's deals", "Track my order", "Help"];
        break;
      }

      // ─── ADD TO CART ───
      case "add_to_cart": {
        const p = entities.product || (session?.context?.lastProduct ? Product.getById(session.context.lastProduct) : null);
        const qty = entities.quantity || 1;

        if (!p) {
          reply = "🛒 Which product would you like to add?\n\nTell me the product name, e.g.:\n• \"Add Trail Blazer to cart\"\n• \"Add 2 SB Dunk\"";
          suggestions = ["Show products", "New arrivals", "Today's deals"];
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
          break;
        }

        if (p.stock <= 0) {
          reply = `❌ **${p.name}** is currently out of stock (0 available).\n\nWould you like to see similar products?`;
          suggestions = ["Similar products", "Show all products"];
          break;
        }

        if (!userId) {
          reply = `👟 **${p.name}** — ${fmt(p.price)}\n\nPlease **log in** to add items to your cart. You can also click "Add to Cart" on the product page.`;
          suggestions = ["Login", "View product"];
          products = [productCard(p, activeSales.find(s => s.productId === p.id))];
          cartData = { action: "add_request", productId: p.id, quantity: qty, requiresLogin: true };
          break;
        }

        let cart = Cart.getByUserId(userId);
        if (!cart) {
          cart = { id: uuidv4(), userId, items: [], createdAt: new Date().toISOString() };
          Cart.create(cart);
        }
        const existIdx = cart.items.findIndex(i => i.productId === p.id);
        if (existIdx >= 0) cart.items[existIdx].quantity += qty;
        else cart.items.push({ productId: p.id, quantity: qty, addedAt: new Date().toISOString() });
        Cart.update(cart.id, { items: cart.items });

        const sale = activeSales.find(s => s.productId === p.id);
        const price = sale ? sale.salePrice : p.price;
        const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
        const cartTotal = cart.items.reduce((s, i) => {
          const pr = Product.getById(i.productId);
          const sl = activeSales.find(x => x.productId === i.productId);
          return s + ((sl ? sl.salePrice : pr?.price) || 0) * i.quantity;
        }, 0);

        reply = `✅ **Added to Cart!**\n\n` +
                `**${qty}× ${p.name}**\n` +
                `${p.fabric ? `🧵 Fabric: ${p.fabric}\n` : ""}` +
                `💰 ${fmt(price)}${sale ? ` ~~${fmt(p.price)}~~ (${sale.discount}% OFF)` : ""} each\n` +
                `📦 Stock: ${p.stock} available\n\n` +
                `🛒 **Cart: ${cartCount} item${cartCount > 1 ? "s" : ""} — ${fmt(cartTotal)}**\n` +
                `${cartTotal >= 100 ? "✨ FREE shipping!" : `Add ${fmt(100 - cartTotal)} more for free shipping`}`;
        suggestions = ["🛍️ View cart", "🚀 Checkout", "➕ Add more", "Continue shopping"];
        products = [productCard(p, sale)];
        cartData = { action: "added", productId: p.id, quantity: qty };
        break;
      }

      // ─── VIEW CART ───
      case "view_cart": {
        if (!userId) { reply = "🛒 Please **log in** to view your cart."; suggestions = ["Login"]; break; }

        const uc = getUserCart(userId);
        if (!uc) {
          reply = "🛒 **Your cart is empty!**\n\nLet me help you find something great:";
          suggestions = ["Show products", "New arrivals", "Today's deals", "Shop by budget"];
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
          break;
        }

        reply = "🛒 **Your Cart**\n\n";
        uc.items.forEach((item, i) => {
          reply += `${i + 1}. **${item.name}**\n`;
          reply += `   ${item.quantity}× ${fmt(item.price)}${item.discount ? ` (-${item.discount}%)` : ""} = ${fmt(item.price * item.quantity)}\n`;
          if (item.fabric) reply += `   🧵 ${item.fabric}\n`;
          reply += "\n";
        });
        reply += `**Total: ${fmt(uc.total)}**\n`;
        if (uc.savings > 0) reply += `💚 Savings: ${fmt(uc.savings)}\n`;
        reply += uc.total >= 100 ? "🚚 FREE shipping!\n" : `Add ${fmt(100 - uc.total)} more for free shipping\n`;

        suggestions = ["🚀 Checkout", "🗑️ Remove item", "Clear cart", "Continue shopping"];
        cartData = { items: uc.items, total: uc.total, count: uc.count, savings: uc.savings };
        break;
      }

      // ─── REMOVE FROM CART ───
      case "remove_cart": {
        if (!userId) { reply = "Please **log in** to manage your cart."; suggestions = ["Login"]; break; }
        const cart = Cart.getByUserId(userId);
        if (!cart || !cart.items?.length) { reply = "🛒 Cart is already empty!"; suggestions = ["Show products"]; break; }

        const p = entities.product;
        if (!p) {
          reply = "🗑️ **Which item to remove?**\n\n";
          cart.items.forEach((item, i) => {
            const pr = Product.getById(item.productId);
            if (pr) reply += `${i + 1}. **${pr.name}** — Qty: ${item.quantity}\n`;
          });
          reply += "\nTell me the product name, or say **clear cart** to remove all.";
          suggestions = [...cart.items.slice(0, 3).map(i => { const pr = Product.getById(i.productId); return pr ? `Remove ${pr.name}` : null; }).filter(Boolean), "Clear cart"];
          break;
        }

        const idx = cart.items.findIndex(i => i.productId === p.id);
        if (idx === -1) { reply = `❌ **${p.name}** is not in your cart.`; suggestions = ["View cart"]; break; }

        const removed = cart.items.splice(idx, 1)[0];
        Cart.update(cart.id, { items: cart.items });
        const remaining = cart.items.reduce((s, i) => s + i.quantity, 0);
        reply = `🗑️ Removed **${p.name}** (Qty: ${removed.quantity})\n\n🛒 ${remaining} item${remaining !== 1 ? "s" : ""} remaining.`;
        suggestions = ["View cart", "Checkout", "Add more items"];
        cartData = { action: "removed", productId: p.id };
        break;
      }

      // ─── CLEAR CART ───
      case "clear_cart": {
        if (!userId) { reply = "Please log in first."; suggestions = ["Login"]; break; }
        const cart = Cart.getByUserId(userId);
        if (cart) Cart.update(cart.id, { items: [] });
        reply = "🗑️ **Cart cleared!** All items removed.\n\nReady to shop again?";
        suggestions = ["Show products", "New arrivals", "Today's deals"];
        cartData = { action: "cleared" };
        break;
      }

      // ─── CHECKOUT ───
      case "checkout": {
        if (!userId) { reply = "Please **log in** to checkout."; suggestions = ["Login"]; cartData = { requiresLogin: true }; break; }
        const uc = getUserCart(userId);
        if (!uc) { reply = "🛒 Cart is empty! Add items first."; suggestions = ["Show products"]; break; }
        reply = `🚀 **Ready to Checkout!**\n\n🛒 ${uc.count} item${uc.count > 1 ? "s" : ""} — **${fmt(uc.total)}**\n🚚 ${uc.total >= 100 ? "FREE shipping" : "Shipping: $9.99"}\n\n💳 Payment: COD, eSewa, Khalti, Card\n\nClick below to proceed!`;
        suggestions = ["Go to checkout"];
        cartData = { action: "checkout", total: uc.total, count: uc.count, redirectTo: "/checkout" };
        break;
      }

      // ─── TRACK ORDER ───
      case "track_order": {
        if (entities.orderId) {
          const allOrders = Order.getAll();
          const order = allOrders.find(o => o.orderNumber === entities.orderId || o.id === entities.orderId || o.orderNumber?.includes(entities.orderId) || o.id?.startsWith(entities.orderId));

          if (order) {
            const statusIcon = { confirmed: "✅", processing: "🔄", shipped: "🚚", delivered: "📦", cancelled: "❌" };
            reply = `📦 **Order: ${order.orderNumber || order.id.slice(0, 8)}**\n\n` +
                    `${statusIcon[order.status] || "📋"} **Status:** ${order.status?.toUpperCase()}\n` +
                    `💳 **Payment:** ${order.paymentStatus || "pending"} (${order.paymentMethod || "COD"})\n` +
                    `💰 **Total:** ${fmt(order.totalAmount)}\n` +
                    `📅 **Date:** ${new Date(order.createdAt).toLocaleDateString()}\n\n` +
                    `**Items:**\n`;
            (order.items || []).forEach(i => { reply += `  • ${i.name} × ${i.quantity} — ${fmt(i.price)}\n`; });
            reply += `\n📍 **Ship to:** ${order.shippingAddress?.fullName || "—"}, ${order.shippingAddress?.city || "—"}`;
            if (order.timeline?.length) {
              reply += "\n\n**Timeline:**\n";
              order.timeline.slice(-4).forEach(t => { reply += `  • ${t.status} — ${new Date(t.date).toLocaleString()}\n`; });
            }
            suggestions = ["Track another", "View all orders", "Reorder"];
          } else {
            reply = `❌ Order **${entities.orderId}** not found.\n\nPlease check the order number (format: XS-XXXXXXXX). You can find it in your confirmation email.`;
            suggestions = ["View my orders", "Help"];
          }
        } else if (userId) {
          const userOrders = Order.getAll().filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          if (userOrders.length > 0) {
            const statusIcon = { confirmed: "✅", processing: "🔄", shipped: "🚚", delivered: "📦", cancelled: "❌" };
            reply = `📦 **Your Orders** (${userOrders.length} total)\n\n`;
            userOrders.slice(0, 5).forEach(o => {
              reply += `${statusIcon[o.status] || "📋"} **${o.orderNumber || o.id.slice(0, 8)}** — ${o.status} — ${fmt(o.totalAmount)} — ${new Date(o.createdAt).toLocaleDateString()}\n`;
            });
            reply += "\nTo track a specific order, tell me the order number.";
            suggestions = userOrders.slice(0, 3).map(o => `Track ${o.orderNumber || o.id.slice(0, 8)}`);
          } else {
            reply = "📦 **No orders yet.** Start shopping to place your first order!";
            suggestions = ["Show products", "Today's deals"];
          }
        } else {
          reply = "📦 **Track Order**\n\nPlease provide your order number:\n• \"Track XS-A1B2C3D4\"\n\nOr **log in** to see all your orders.";
          suggestions = ["Login", "Help"];
        }
        break;
      }

      // ─── PRODUCT SEARCH (deep attribute search) ───
      case "search": {
        const results = searchProducts(allProducts, activeSales, entities);
        const budgetDesc = describeBudget(entities.budget);
        const keywordDesc = entities.keywords?.length ? ` matching "${entities.keywords.join(", ")}"` : "";

        if (results.length === 0) {
          reply = `No products found${entities.category ? ` in "${entities.category}"` : ""}${keywordDesc}${budgetDesc ? ` ${budgetDesc}` : ""}.\n\nHere are some popular items instead:`;
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
        } else {
          reply = `👟 **${results.length} product${results.length > 1 ? "s" : ""} found**${entities.category ? ` in ${entities.category}` : ""}${keywordDesc}${budgetDesc ? ` ${budgetDesc}` : ""}:`;
          products = results;
        }
        suggestions = ["Add to cart", "Under $100", "Above $200", "Around $150", "Show deals"];
        break;
      }

      // ─── BUDGET SHOPPING (above / below / exact / between) ───
      case "budget_shop": {
        const budget = entities.budget || session?.context?.lastBudget;

        if (!budget) {
          reply = "💰 **Budget Shopping**\n\nTell me your budget — I support 4 styles:\n" +
                  "• **Below:** \"Under $150\", \"Budget $200\"\n" +
                  "• **Above:** \"Above $200\", \"More than $300\"\n" +
                  "• **Around:** \"Around $150\", \"About $100\"\n" +
                  "• **Range:** \"Between $100 and $250\"";
          suggestions = ["Under $100", "Above $200", "Around $150", "Between $100 and $300"];
          break;
        }

        const qty = entities.quantity || 1;
        const results = searchProducts(allProducts, activeSales, { ...entities, budget, quantity: qty });
        const desc = describeBudget(budget);

        if (results.length === 0) {
          // Tailored fallback by operator
          let suggestion = "";
          if (budget.operator === "below") {
            suggestion = `Try a higher budget, e.g. "under ${fmt(budget.max * 1.5)}".`;
          } else if (budget.operator === "above") {
            suggestion = `Try a lower threshold, e.g. "above ${fmt(budget.min * 0.5)}".`;
          } else if (budget.operator === "exact") {
            suggestion = `Try a wider range, e.g. "between ${fmt(budget.value * 0.7)} and ${fmt(budget.value * 1.3)}".`;
          } else if (budget.operator === "between") {
            suggestion = `Try widening the range.`;
          }
          reply = `No products ${desc}${qty > 1 ? ` for ${qty} pairs` : ""}. ${suggestion}`;
          suggestions = ["Show all products", "Today's deals", "Help"];
        } else {
          reply = `💰 **${results.length} product${results.length > 1 ? "s" : ""} ${desc}**${qty > 1 ? ` (for ${qty} pairs)` : ""}:`;
          products = results;
          suggestions = ["Add to cart", "Sort by cheapest", "Sort by premium", "Show deals"];
        }
        break;
      }

      // ─── BULK / WHOLESALE ───
      case "bulk_order": {
        const p = entities.product;
        const qty = entities.quantity || 50;

        if (p) {
          const moq = p.minOrder || 1;
          const basePrice = p.price;
          let discount = 0, bulkPrice = basePrice;
          if (qty >= 100)     { discount = 15; bulkPrice = basePrice * 0.85; }
          else if (qty >= 50) { discount = 10; bulkPrice = basePrice * 0.90; }
          else if (qty >= 20) { discount = 5;  bulkPrice = basePrice * 0.95; }

          reply = `📦 **Bulk Order: ${p.name}**\n\n` +
                  `📋 **Product Details:**\n` +
                  `• Retail Price: ${fmt(basePrice)}\n` +
                  `• Stock Available: ${p.stock} units\n` +
                  `${p.fabric ? `• Fabric: ${p.fabric}\n` : ""}` +
                  `• MOQ: ${moq} units\n\n` +
                  `💰 **Wholesale Pricing (${qty} units):**\n` +
                  `• Unit Price: ${fmt(bulkPrice)}${discount > 0 ? ` (${discount}% off retail)` : ""}\n` +
                  `• Total: ${fmt(bulkPrice * qty)}\n` +
                  `• You Save: ${fmt((basePrice - bulkPrice) * qty)}\n\n` +
                  `**Tiered Discounts:**\n` +
                  `• 20+ units: 5% off → ${fmt(basePrice * 0.95)}/unit\n` +
                  `• 50+ units: 10% off → ${fmt(basePrice * 0.90)}/unit\n` +
                  `• 100+ units: 15% off → ${fmt(basePrice * 0.85)}/unit\n\n` +
                  `Want to submit a bulk order request?`;
          suggestions = ["Request bulk quote", "View more products", "Add to cart"];
          products = [productCard(p, activeSales.find(s => s.productId === p.id))];
        } else {
          const topBulk = allProducts.filter(p => p.stock >= 20).sort((a, b) => b.stock - a.stock).slice(0, 5);
          reply = "📦 **Wholesale / Bulk Orders**\n\n" +
                  "We offer tiered wholesale pricing:\n• 20+ units: **5% off**\n• 50+ units: **10% off**\n• 100+ units: **15% off**\n\n" +
                  "**Best products for bulk orders** (high stock):";
          products = topBulk.map(p => productCard(p, activeSales.find(s => s.productId === p.id)));
          suggestions = ["Request bulk quote", "Show all products", "Contact us"];
        }
        break;
      }

      // ─── FABRIC SEARCH ───
      case "fabric_search": {
        const p = entities.product || (session?.context?.lastProduct ? Product.getById(session.context.lastProduct) : null);

        if (p) {
          reply = `🧵 **${p.name}**\n\n• Fabric: **${p.fabric || "Not specified"}**\n• Price: ${fmt(p.price)}\n• Stock: ${p.stock} available\n• Category: ${p.category}`;
          products = [productCard(p, activeSales.find(s => s.productId === p.id))];
          suggestions = ["Add to cart", "Show similar fabric", "Other products"];
        } else if (entities.fabric) {
          const results = allProducts.filter(p => p.fabric?.toLowerCase().includes(entities.fabric)).slice(0, 5);
          if (results.length > 0) {
            reply = `🧵 **"${entities.fabric}" products** (${results.length} found):`;
            products = results.map(p => productCard(p, activeSales.find(s => s.productId === p.id)));
          } else {
            const allFabrics = [...new Set(allProducts.filter(p => p.fabric).map(p => p.fabric))];
            reply = `No "${entities.fabric}" products found.\n\n**Available fabrics:** ${allFabrics.join(", ") || "Various"}`;
          }
          suggestions = ["Show all products", "Shop by budget", "Add to cart"];
        } else {
          const allFabrics = [...new Set(allProducts.filter(p => p.fabric).map(p => p.fabric))];
          reply = "🧵 **Shop by Fabric**\n\n" + (allFabrics.length > 0
            ? allFabrics.map(f => `• **${f}** — ${allProducts.filter(p => p.fabric === f).length} product(s)`).join("\n")
            : "Fabric details are being updated.");
          suggestions = allFabrics.slice(0, 4).map(f => `Show ${f}`);
        }
        break;
      }

      // ─── PRODUCT INFO ───
      case "product_info": {
        const p = entities.product;
        if (!p) {
          reply = "🔍 Which product would you like to know about?\n\nTell me the product name or browse:";
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
          suggestions = ["Show products", "New arrivals"];
          break;
        }
        const sale = activeSales.find(s => s.productId === p.id);
        reply = `👟 **${p.name}**\n\n` +
                `💰 **Price:** ${sale ? `${fmt(sale.salePrice)} ~~${fmt(p.price)}~~ (${sale.discount}% OFF!)` : fmt(p.price)}\n` +
                `📁 **Category:** ${p.category || "—"}\n` +
                `🧵 **Fabric:** ${p.fabric || "Standard"}\n` +
                `⭐ **Rating:** ${p.rating || "—"}/5\n` +
                `📦 **Stock:** ${p.stock > 0 ? `${p.stock} available` : "Out of stock"}\n` +
                `${p.minOrder > 1 ? `📋 **Min Order:** ${p.minOrder} units\n` : ""}` +
                `\n${p.description || "Premium quality product."}`;
        products = [productCard(p, sale)];
        suggestions = ["Add to cart", "Request bulk order", "Similar products", "Check stock"];
        break;
      }

      // ─── STOCK CHECK ───
      case "stock_check": {
        const p = entities.product || (session?.context?.lastProduct ? Product.getById(session.context.lastProduct) : null);
        if (p) {
          const sale = activeSales.find(s => s.productId === p.id);
          reply = `📦 **${p.name}**: ${p.stock > 0 ? `✅ **${p.stock} in stock**` : "❌ **Out of stock**"}\n` +
                  `${p.fabric ? `🧵 Fabric: ${p.fabric}\n` : ""}` +
                  `💰 ${sale ? `${fmt(sale.salePrice)} (${sale.discount}% OFF)` : fmt(p.price)}`;
          products = [productCard(p, sale)];
          suggestions = p.stock > 0 ? ["Add to cart", "Bulk order", "Similar products"] : ["Similar products", "Notify me"];
        } else {
          reply = "📦 Which product to check? Tell me the name.";
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
          suggestions = ["Show products"];
        }
        break;
      }

      // ─── RECOMMEND ───
      case "recommend": {
        const results = searchProducts(allProducts, activeSales, entities);
        if (results.length > 0) {
          reply = `⭐ **Recommended${entities.category ? ` ${entities.category}` : ""} Products:**\n\n`;
          results.forEach((p, i) => {
            reply += `${i + 1}. **${p.name}** — ${p.salePrice ? `${fmt(p.salePrice)} ~~${fmt(p.price)}~~` : fmt(p.price)}`;
            if (p.fabric) reply += ` • ${p.fabric}`;
            reply += ` • ${p.stock} in stock\n`;
          });
          products = results;
        } else {
          reply = "Here are our top picks:";
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
        }
        suggestions = ["Add to cart", "More details", "Shop by budget", "Bulk order"];
        break;
      }

      // ─── NEW ARRIVALS ───
      case "new_arrivals": {
        products = searchProducts(allProducts, activeSales, { sort: "newest" });
        reply = `🆕 **New Arrivals** (${products.length} latest):`;
        suggestions = ["Add to cart", "Show all products", "Today's deals"];
        break;
      }

      // ─── DEALS ───
      case "deals": {
        if (activeSales.length === 0) {
          reply = "No active deals right now. Check back later!\n\nHere are our popular products:";
          products = searchProducts(allProducts, activeSales, { sort: "popular" });
        } else {
          reply = `🔥 **${activeSales.length} Active Deal${activeSales.length > 1 ? "s" : ""}:**\n\n`;
          const dealProducts = activeSales.slice(0, 5).map(sale => {
            const p = Product.getById(sale.productId);
            if (!p) return null;
            reply += `• **${p.name}** — ${fmt(sale.salePrice)} ~~${fmt(p.price)}~~ (**${sale.discount}% OFF**)\n`;
            return productCard(p, sale);
          }).filter(Boolean);
          products = dealProducts;
        }
        suggestions = ["Add to cart", "Show all products", "Shop by budget"];
        break;
      }

      // ─── SHIPPING ───
      case "shipping": {
        reply = "🚚 **Shipping Info**\n\n" +
                "• Standard: 3–5 business days\n• Express: 1–2 business days\n• **FREE** on orders over $100\n• Standard fee: $9.99\n\n" +
                "Track your order anytime — just give me the order number!";
        suggestions = ["Track order", "View cart", "Help"];
        break;
      }

      // ─── RETURN POLICY ───
      case "return_policy": {
        reply = "🔄 **Return Policy**\n\n• 30-day returns on unworn items\n• Original packaging required\n• Free returns on defective products\n• Refunds in 5–7 business days\n\nContact us with your order number to start a return.";
        suggestions = ["Track order", "Help", "Show products"];
        break;
      }

      // ─── SIZE GUIDE ───
      case "size_guide": {
        reply = "📏 **Size Guide**\n\n• Most styles run **true to size**\n• Wide feet → size up 0.5\n• Narrow feet → size down 0.5\n• Boots → size up 0.5 for thick socks\n\nCheck product reviews for fit feedback!";
        suggestions = ["Show products", "Add to cart", "Help"];
        break;
      }

      // ─── CARE GUIDE ───
      case "care_guide": {
        const p = entities.product || (session?.context?.lastProduct ? Product.getById(session.context.lastProduct) : null);
        if (p?.fabric) {
          reply = `🧹 **Care for ${p.name}** (${p.fabric})\n\n`;
          const f = p.fabric.toLowerCase();
          if (f.includes("leather"))      reply += "• Condition every 2–3 months\n• Wipe with damp cloth\n• Store with shoe trees";
          else if (f.includes("mesh") || f.includes("knit")) reply += "• Hand wash cold\n• Air dry only\n• Remove insoles before washing";
          else if (f.includes("canvas"))  reply += "• Spot clean with mild soap\n• Machine wash gentle cycle\n• Air dry away from heat";
          else if (f.includes("suede"))   reply += "• Use suede brush regularly\n• Apply water repellent spray\n• Never machine wash";
          else if (f.includes("cotton"))  reply += "• Machine wash cold\n• Tumble dry low\n• Iron inside out";
          else                            reply += "• Clean with soft damp cloth\n• Air dry\n• Store in cool, dry place";
        } else {
          reply = "🧹 **General Care Tips**\n\n• Clean with soft cloth\n• Air dry — avoid direct heat\n• Rotate pairs regularly\n• Use shoe trees for shape\n\nTell me a specific product for targeted advice!";
        }
        suggestions = ["Show products", "View cart", "Help"];
        break;
      }

      // ─── HELP ───
      case "help": {
        reply = "🆘 **I can help with:**\n\n" +
                "🛒 **Cart:** \"Add Nike to cart\", \"View cart\", \"Remove item\"\n" +
                "🔍 **Search:** \"Show running shoes\", \"Waterproof leather boots\" (I search names, descriptions & tags!)\n" +
                "💰 **Budget:** \"Under $200\", \"Above $300\", \"Around $150\", \"Between $100 and $250\"\n" +
                "📦 **Orders:** \"Track XS-A1B2C3D4\", \"My orders\"\n" +
                "🏭 **Bulk:** \"Bulk price for 50 Nike\", \"Wholesale\"\n" +
                "🧵 **Fabric:** \"Cotton products\", \"What fabric is Nike?\"\n" +
                "📏 **Info:** \"Size guide\", \"Return policy\", \"Shipping\"";
        suggestions = ["Show products", "View cart", "Track order", "Today's deals", "Bulk order"];
        break;
      }

      // ─── THANKS / BYE ───
      case "thanks": {
        reply = "You're welcome! 😊 Anything else I can help with?";
        suggestions = ["Show products", "View cart", "Help"];
        break;
      }
      case "bye": {
        reply = "Goodbye! Thanks for visiting **xsow**. See you next time! 👋";
        suggestions = ["Show products"];
        break;
      }

      // ─── UNKNOWN (fallback deep search) ───
      default: {
        if (entities.product) {
          const p = entities.product;
          const sale = activeSales.find(s => s.productId === p.id);
          reply = `👟 **${p.name}** — ${sale ? `${fmt(sale.salePrice)} (${sale.discount}% OFF!)` : fmt(p.price)}\n` +
                  `${p.fabric ? `🧵 ${p.fabric} | ` : ""}📦 ${p.stock} in stock\n\nWhat would you like to do?`;
          products = [productCard(p, sale)];
          suggestions = ["Add to cart", "More details", "Bulk order", "Similar products"];
        } else if (entities.category || entities.keywords?.length) {
          const results = searchProducts(allProducts, activeSales, entities);
          reply = results.length
            ? `👟 Found ${results.length} matching product${results.length > 1 ? "s" : ""}:`
            : "I couldn't find an exact match. Here are some popular picks:";
          products = results.length ? results : searchProducts(allProducts, activeSales, { sort: "popular" });
          suggestions = ["Add to cart", "Shop by budget", "Show deals"];
        } else {
          reply = "I'm here to help! Try:\n• \"Show waterproof hiking boots\"\n• \"Under $100\" or \"Above $200\" or \"Around $150\"\n• \"Add Nike to cart\"\n• \"Track my order\"";
          suggestions = ["Show products", "View cart", "Track order", "Help", "Today's deals"];
        }
      }
    }

    // ─── Save session context ───
    const ctx = { lastMsg: message, intent };
    const mergedContext = { ...session?.context };
    if (entities.product)  mergedContext.lastProduct  = entities.product.id;
    if (entities.budget)   mergedContext.lastBudget   = entities.budget;
    if (entities.category) mergedContext.lastCategory = entities.category;
    ctx.context = mergedContext;
    saveSession(sid, ctx);

    res.json({ success: true, data: { reply, suggestions, products, cart: cartData, share: null } });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({
      success: false,
      data: {
        reply: "Something went wrong. Please try again!",
        suggestions: ["Show products", "Help", "View cart"],
        products: [], cart: null, share: null,
      },
    });
  }
};