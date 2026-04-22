import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartAPI, promosAPI } from "../api";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchCart = async () => {
    try { const res = await cartAPI.get(); setCart(res.data.data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (!isLoggedIn) { setLoading(false); return; } fetchCart(); }, []);

  const updateQuantity = async (productId, quantity) => {
    setUpdating(productId);
    try { if (quantity <= 0) { await cartAPI.remove(productId); showToast("Removed"); } else { await cartAPI.update(productId, { quantity }); } await fetchCart(); setPromoResult(null); } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); } finally { setUpdating(null); }
  };

  const removeItem = async (productId) => {
    setUpdating(productId);
    try { await cartAPI.remove(productId); showToast("Removed"); await fetchCart(); setPromoResult(null); } catch { showToast("Failed", "error"); } finally { setUpdating(null); }
  };

  const clearAll = async () => { try { await cartAPI.clear(); showToast("Cart cleared"); await fetchCart(); setPromoResult(null); } catch { showToast("Failed", "error"); } };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true); setPromoError("");
    try {
      const res = await promosAPI.validate({ code: promoCode, subtotal: cart?.total || 0 });
      setPromoResult(res.data.data);
      setPromoError("");
    } catch (err) {
      setPromoError(err.response?.data?.error || "Invalid code");
      setPromoResult(null);
    } finally { setApplyingPromo(false); }
  };

  const removePromo = () => { setPromoResult(null); setPromoCode(""); setPromoError(""); };

  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  if (!isLoggedIn) return (
    <section className="pt-32 padding-x pb-16 max-container text-center py-20">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      <h2 className="font-palanquin text-2xl font-bold mb-2">Sign in to view your cart</h2>
      <Link to="/profile" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">Sign In</Link>
    </section>
  );

  if (loading) return (
    <section className="pt-32 padding-x pb-16 max-container">
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-8" />
      {[1, 2].map((i) => <div key={i} className="flex gap-4 p-4 mb-4 bg-white rounded-xl border border-gray-100"><div className="w-24 h-24 bg-gray-100 rounded-lg animate-pulse" /><div className="flex-1 space-y-2"><div className="h-5 w-40 bg-gray-200 rounded animate-pulse" /><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></div></div>)}
    </section>
  );

  const items = cart?.items || [];
  const total = cart?.total || 0;
  const originalTotal = cart?.originalTotal || total;
  const saleSavings = cart?.savings || 0;
  const promoDiscount = promoResult?.discount || 0;
  const shipping = total - promoDiscount >= 100 ? 0 : 9.99;
  const finalTotal = total - promoDiscount + shipping;

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      {toast && (<div className="fixed top-6 right-6 z-[100]" style={{ animation: "slideIn 0.3s ease-out" }}><style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style><div className={`${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white px-5 py-3.5 rounded-xl shadow-2xl font-montserrat text-sm font-medium`}>{toast.msg}</div></div>)}

      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-palanquin text-3xl md:text-4xl font-bold">Shopping <span className="text-coral-red">Cart</span></h1><p className="font-montserrat text-slate-gray mt-1">{items.length} {items.length === 1 ? "item" : "items"}</p></div>
        {items.length > 0 && <button onClick={clearAll} className="font-montserrat text-sm text-red-500 hover:underline">Clear All</button>}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <h3 className="font-palanquin text-xl font-bold mb-2">Your cart is empty</h3>
          <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className={`flex gap-5 p-5 bg-white rounded-2xl border border-gray-100 transition-all ${updating === item.productId ? "opacity-50" : ""}`}>
                <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                  <div className="w-28 h-28 bg-pale-blue rounded-xl flex items-center justify-center">
                    <img src={getImg(item.product?.image)} alt="" className="w-20 h-20 object-contain" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.productId}`}><h3 className="font-palanquin text-lg font-bold text-gray-900 hover:text-coral-red transition-colors truncate">{item.product?.name}</h3></Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.sale ? (
                      <>
                        <span className="font-montserrat text-sm font-bold text-coral-red">${item.effectivePrice}</span>
                        <span className="font-montserrat text-xs text-slate-gray line-through">${item.product?.price}</span>
                        <span className="bg-coral-red/10 text-coral-red font-montserrat text-[10px] font-bold px-2 py-0.5 rounded-full">-{item.sale.discount}%</span>
                      </>
                    ) : (
                      <span className="font-montserrat text-sm text-slate-gray">${item.product?.price} each</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-semibold text-sm">−</button>
                      <span className="px-4 py-1.5 font-montserrat font-semibold text-sm text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-semibold text-sm">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-palanquin text-lg font-bold text-gray-900">${(item.effectivePrice * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeItem(item.productId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-28">
              <h3 className="font-palanquin text-xl font-bold mb-5">Order Summary</h3>
              <div className="space-y-3 mb-5">
                {saleSavings > 0 && (
                  <div className="flex justify-between font-montserrat text-sm">
                    <span className="text-slate-gray">Original Total</span>
                    <span className="text-slate-gray line-through">${originalTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-montserrat text-sm">
                  <span className="text-slate-gray">Subtotal</span>
                  <span className="text-gray-900 font-medium">${total.toFixed(2)}</span>
                </div>
                {saleSavings > 0 && (
                  <div className="flex justify-between font-montserrat text-sm">
                    <span className="text-green-600">Sale Savings</span>
                    <span className="text-green-600 font-medium">-${saleSavings.toFixed(2)}</span>
                  </div>
                )}
                {promoResult && (
                  <div className="flex justify-between font-montserrat text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      Promo ({promoResult.code})
                      <button onClick={removePromo} className="text-red-400 hover:text-red-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </span>
                    <span className="text-green-600 font-medium">-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-montserrat text-sm">
                  <span className="text-slate-gray">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>{shipping === 0 ? "Free" : `$${shipping}`}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="font-palanquin text-lg font-bold">Total</span>
                  <span className="font-palanquin text-lg font-bold text-coral-red">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Code */}
              {!promoResult && (
                <div className="mb-5">
                  <p className="font-montserrat text-sm font-medium text-gray-700 mb-2">Promo Code</p>
                  <div className="flex gap-2">
                    <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }} placeholder="Enter code" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red uppercase" />
                    <button onClick={applyPromo} disabled={applyingPromo || !promoCode.trim()} className="px-4 py-2.5 bg-gray-900 text-white font-montserrat text-sm font-medium rounded-xl hover:bg-coral-red transition-colors disabled:opacity-50">
                      {applyingPromo ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="font-montserrat text-xs text-red-500 mt-1">{promoError}</p>}
                </div>
              )}
              {promoResult && (
                <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-montserrat text-sm font-semibold text-green-700">{promoResult.code}</p>
                    <p className="font-montserrat text-xs text-green-600">{promoResult.message}</p>
                  </div>
                  <button onClick={removePromo} className="text-green-600 hover:text-red-500 font-montserrat text-xs font-medium">Remove</button>
                </div>
              )}

              {finalTotal < 100 && finalTotal > 0 && (
                <p className="font-montserrat text-xs text-slate-gray mb-4 bg-amber-50 p-3 rounded-lg">Add ${(100 - finalTotal + promoDiscount).toFixed(2)} more for free shipping!</p>
              )}
              <button onClick={() => navigate("/checkout", { state: { promoCode: promoResult?.code || null } })} className="w-full bg-coral-red text-white font-montserrat text-sm font-medium py-3.5 rounded-xl hover:bg-red-500 shadow-lg shadow-coral-red/25">
                Proceed to Checkout
              </button>
              <Link to="/products" className="block text-center mt-3 font-montserrat text-sm text-slate-gray hover:text-coral-red">Continue Shopping</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Cart;