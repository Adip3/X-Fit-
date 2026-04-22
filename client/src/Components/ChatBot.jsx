import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/config";

// Enhanced Quick Actions with Cart & Share
const quickActions = [
  { icon: "🛒", label: "Add to Cart", message: "Add Trail Runner to cart", color: "from-blue-500 to-indigo-600" },
  { icon: "📤", label: "Share Product", message: "Share the Trail Runner", color: "from-purple-500 to-pink-600" },
  { icon: "💰", label: "Shop by Budget", message: "I have a budget of $200", color: "from-green-500 to-emerald-600" },
  { icon: "🛍️", label: "View Cart", message: "View my cart", color: "from-orange-500 to-red-600" },
  { icon: "🔥", label: "Today's Deals", message: "Show me active sales", color: "from-yellow-500 to-orange-600" },
  { icon: "📦", label: "Track Order", message: "Track my order", color: "from-cyan-500 to-blue-600" },
];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // Generate or retrieve session ID
  useEffect(() => {
    let sid = localStorage.getItem("chat_session_id");
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chat_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          from: "bot",
          text: "Hey! 👋 I'm your xsow shopping assistant.\n\nI can help you:\n• 🛒 **Add items to cart**\n• 📤 **Share products** with friends\n• 💰 **Shop within budget**\n• 🔍 **Find perfect shoes**\n\nWhat would you like to do?",
          suggestions: ["🛒 Add to cart", "📤 Share product", "💰 Shop by budget", "🛍️ View cart"],
          showQuickActions: true,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };
  
  useEffect(scrollToBottom, [messages, loading]);
  
  useEffect(() => { 
    if (open) { 
      inputRef.current?.focus(); 
      setUnread(0); 
    } 
  }, [open]);

  const getImageUrl = (img) => {
    if (!img) return "/api/placeholder/120/120";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads")) return `http://localhost:5001${img}`;
    return `http://localhost:5001/images/${img}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sendMessage = useCallback(async (text, isQuickAction = false) => {
    if (!text.trim() || loading) return;
    
    const userMsg = { 
      id: Date.now(), 
      from: "user", 
      text: text.trim(), 
      timestamp: new Date() 
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (!isQuickAction) setHasInteracted(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await api.post("/chat", { 
        message: text.trim(),
        sessionId: sessionId,
        userId: user.id || null
      });
      
      const { reply, suggestions, products, cart, share } = res.data.data;
      
      const botMsg = { 
        id: Date.now() + 1,
        from: "bot", 
        text: reply, 
        suggestions: suggestions || [],
        products: products || [],
        cart: cart,
        share: share,
        timestamp: new Date(),
        showQuickActions: false,
      };
      
      setMessages((prev) => [...prev, botMsg]);
      
      // Update cart count if cart data exists
      if (cart) {
        setCartCount(cart.count || cart.items?.length || 0);
        // Handle redirects
        if (cart.redirectTo) {
          setTimeout(() => { window.location.href = cart.redirectTo; }, 1500);
        }
        if (cart.requiresLogin) {
          setTimeout(() => { window.location.href = "/profile"; }, 2000);
        }
      }
      
      // Show share modal if share data exists
      if (share) {
        setShowShareModal(share);
      }
      
      if (!open) setUnread((u) => u + 1);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now() + 1,
          from: "bot", 
          text: "Oops! Something went wrong. Please try again! 🫠\n\nTry one of these:",
          suggestions: ["🛒 Add to cart", "📤 Share product", "🛍️ View cart", "💰 Shop by budget"],
          products: [],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, open, sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        from: "bot",
        text: "Chat cleared! 🧹 Ready to help you shop. What would you like to do?\n\n• 🛒 Add items to cart\n• 📤 Share products\n• 💰 Shop by budget",
        suggestions: ["🛒 Add to cart", "📤 Share product", "💰 Shop by budget", "🛍️ View cart"],
        showQuickActions: true,
        timestamp: new Date(),
      },
    ]);
    setHasInteracted(false);
    setUnread(0);
  };

  const ShareModal = ({ shareData, onClose }) => {
    if (!shareData) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Share Product</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900">{shareData.product.name}</p>
            <p className="text-sm text-gray-600">{shareData.message}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <a
              href={shareData.platforms.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <span className="text-xl">📱</span>
              <span>WhatsApp</span>
            </a>
            
            <a
              href={shareData.platforms.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <span className="text-xl">📘</span>
              <span>Facebook</span>
            </a>
            
            <a
              href={shareData.platforms.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              <span className="text-xl">🐦</span>
              <span>Twitter</span>
            </a>
            
            <a
              href={shareData.platforms.email}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <span className="text-xl">📧</span>
              <span>Email</span>
            </a>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={shareData.platforms.copy}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(shareData.platforms.copy)}
              className="px-4 py-2 bg-coral-red text-white rounded-lg hover:bg-red-600 transition"
            >
              {copied ? "✅ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const formatMessageText = (text) => {
    if (!text) return "";
    const paragraphs = text.split("\n\n");
    
    return paragraphs.map((para, idx) => {
      let formatted = para
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>')
        .replace(/•/g, '<span class="text-coral-red font-bold mr-1">•</span>')
        .replace(/✅/g, '<span class="text-green-500">✅</span>')
        .replace(/🛒/g, '<span class="text-blue-500">🛒</span>')
        .replace(/📤/g, '<span class="text-purple-500">📤</span>');
      
      formatted = formatted.replace(/\n/g, '<br/>');
      return <p key={idx} className="mb-2 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <>
      {/* Floating Cart Counter Badge */}
      {cartCount > 0 && !open && (
        <div className="fixed bottom-24 right-6 z-40 bg-coral-red text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-bounce">
          🛒 {cartCount}
        </div>
      )}
      
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? "bg-gray-800 rotate-90 scale-95" : "bg-gradient-to-br from-coral-red to-red-500 hover:scale-110"
        }`}
        style={{ boxShadow: open ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 25px rgba(255,100,82,0.4)" }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <>
          <div
            className="fixed bottom-24 right-6 z-50 w-[450px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ height: "min(650px, calc(100vh - 140px))", animation: "chatSlideUp 0.3s ease-out" }}
          >
            {/* Header with Cart Icon */}
            <div className="bg-gradient-to-r from-coral-red to-red-500 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-montserrat text-sm font-semibold">xsow AI Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-white/80 font-montserrat text-[10px]">Online • Ready to help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Cart Button */}
                <button 
                  onClick={() => sendMessage("View my cart")}
                  className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                  title="View cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={clearChat} 
                  className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                  title="Clear chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button 
                  onClick={() => setOpen(false)} 
                  className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                  title="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} message-enter`}>
                  <div className={`max-w-[85%] ${msg.from === "user" ? "items-end" : "items-start"}`}>
                    
                    {/* Bot Message */}
                    {msg.from === "bot" && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-coral-red to-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-md border border-gray-100">
                            <div className="font-montserrat text-sm text-gray-800 leading-relaxed">
                              {formatMessageText(msg.text)}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          {msg.showQuickActions && !hasInteracted && messages.length === 1 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {quickActions.map((qa, j) => (
                                <button
                                  key={j}
                                  onClick={() => sendMessage(qa.message, true)}
                                  className={`flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r ${qa.color} text-white rounded-xl font-montserrat text-xs font-medium hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-left`}
                                >
                                  <span className="text-lg">{qa.icon}</span>
                                  <span>{qa.label}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Cart Summary Display */}
                          {msg.cart && msg.cart.items && msg.cart.items.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                              <p className="font-semibold text-blue-900 mb-2">🛒 Cart Summary</p>
                              <p className="text-sm text-blue-800">{msg.cart.items.length} item(s) • Total: {formatPrice(msg.cart.total)}</p>
                              {msg.cart.savings > 0 && (
                                <p className="text-xs text-green-600 mt-1">Saved: {formatPrice(msg.cart.savings)} 🎉</p>
                              )}
                            </div>
                          )}

                          {/* Product Cards */}
                          {msg.products && msg.products.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {msg.products.map((product) => (
                                <div key={product.id} className="product-card flex-shrink-0 w-[160px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                  <div className="h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3 relative">
                                    <img 
                                      src={getImageUrl(product.image)} 
                                      alt={product.name} 
                                      className="h-20 object-contain"
                                      onError={(e) => { e.target.src = "/api/placeholder/120/120"; }}
                                    />
                                    {product.discount && (
                                      <span className="absolute top-2 left-2 bg-coral-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        -{product.discount}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-2.5">
                                    <p className="font-montserrat text-xs font-semibold text-gray-900 truncate">{product.name}</p>
                                    <p className="font-montserrat text-[10px] text-gray-500">{product.category}{product.fabric ? ` • ${product.fabric}` : ""}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                      <span className="font-montserrat text-sm font-bold text-coral-red">
                                        {formatPrice(product.salePrice || product.price)}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                      <button
                                        onClick={() => sendMessage(`Add ${product.name} to cart`)}
                                        className="flex-1 bg-blue-500 text-white text-[10px] px-2 py-1 rounded hover:bg-blue-600 transition"
                                      >
                                        🛒 Add
                                      </button>
                                      <button
                                        onClick={() => sendMessage(`Share ${product.name}`)}
                                        className="flex-1 bg-purple-500 text-white text-[10px] px-2 py-1 rounded hover:bg-purple-600 transition"
                                      >
                                        📤 Share
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Suggestion Chips */}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.suggestions.slice(0, 5).map((suggestion, j) => (
                                <button
                                  key={j}
                                  onClick={() => sendMessage(suggestion)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-coral-red hover:text-white border border-gray-200 rounded-full font-montserrat text-xs text-gray-700 transition-all"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* User Message */}
                    {msg.from === "user" && (
                      <div className="bg-gradient-to-br from-coral-red to-red-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-md">
                        <p className="font-montserrat text-sm leading-relaxed break-words">{msg.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-start gap-2.5 message-enter">
                  <div className="w-8 h-8 bg-gradient-to-br from-coral-red to-red-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-md border border-gray-100">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-coral-red rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-coral-red rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-coral-red rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="ml-2 font-montserrat text-xs text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-coral-red focus-within:shadow-md transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Try: 'Add Trail Runner to cart' or 'Share this product'..."
                  className="flex-1 bg-transparent font-montserrat text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
                  rows={1}
                  style={{ maxHeight: "100px" }}
                  disabled={loading}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-gradient-to-br from-coral-red to-red-500 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="font-montserrat text-[9px] text-gray-400">
                  Try: 🛒 "Add to cart" • 📤 "Share product"
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => sendMessage("Add to cart")}
                    className="text-[10px] text-blue-500 hover:text-blue-600"
                  >
                    🛒 Add to cart
                  </button>
                  <button 
                    onClick={() => sendMessage("Share product")}
                    className="text-[10px] text-purple-500 hover:text-purple-600"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Share Modal */}
          {showShareModal && (
            <ShareModal shareData={showShareModal} onClose={() => setShowShareModal(null)} />
          )}
        </>
      )}
    </>
  );
};

export default ChatBot;