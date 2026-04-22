import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cartAPI, ordersAPI, paymentAPI } from "../api";

const PAYMENT_ICONS = { cod: "💵", esewa: "📱", khalti: "💜", card: "💳" };

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const promoCode = location.state?.promoCode || null;
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "", city: "", state: "", zip: "" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentMethods, setPaymentMethods] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  useEffect(() => {
    (async () => {
      try {
        const [cartRes, methodsRes] = await Promise.all([cartAPI.get(), paymentAPI.getMethods().catch(() => ({ data: { data: [] } }))]);
        const c = cartRes.data.data;
        if (!c || c.items.length === 0) { navigate("/cart"); return; }
        setCart(c);
        setPaymentMethods(methodsRes.data.data || [{ id: "cod", name: "Cash on Delivery" }, { id: "esewa", name: "eSewa" }, { id: "khalti", name: "Khalti" }, { id: "card", name: "Card" }]);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setForm(f => ({ ...f, fullName: user.name || "", email: user.email || "" }));
      } catch { navigate("/cart"); } finally { setLoading(false); }
    })();
  }, []);

  const handlePlaceOrder = async () => {
    if (!form.fullName || !form.phone || !form.address || !form.city) { showToast("Fill all required fields"); return; }
    setPlacing(true);
    try {
      // 1. Create the order
      const res = await ordersAPI.checkout({
        shippingAddress: { fullName: form.fullName, phone: form.phone, email: form.email, address: form.address, city: form.city, state: form.state, zip: form.zip },
        paymentMethod, promoCode: promoCode || undefined,
      });
      const order = res.data.data;

      if (paymentMethod === "cod") {
        // COD — done, show confirmation
        setOrderPlaced(order);
        return;
      }

      // 2. Initiate payment — get our self-hosted payment page URL
      const payRes = await paymentAPI.initiate({ orderId: order.id, method: paymentMethod });
      const { paymentUrl } = payRes.data.data;

      // 3. Redirect user to our payment gateway page
      window.location.href = paymentUrl;
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to place order");
    } finally { setPlacing(false); }
  };

  if (loading) return <section className="pt-32 padding-x pb-16 max-container"><div className="max-w-3xl mx-auto"><div className="h-96 bg-gray-100 rounded-2xl animate-pulse" /></div></section>;

  if (orderPlaced) return (
    <section className="pt-32 padding-x pb-16 max-container"><div className="max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
      <h1 className="font-palanquin text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
      <p className="font-montserrat text-slate-gray mb-2">Thank you for shopping with xsow</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4"><p className="font-montserrat text-sm text-amber-700">Pay <strong>${orderPlaced.totalAmount.toFixed(2)}</strong> at delivery (COD)</p></div>
      <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-block"><p className="font-montserrat text-sm text-slate-gray">Order Number</p><p className="font-palanquin text-xl font-bold text-coral-red">{orderPlaced.orderNumber}</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left mb-6">
        <h3 className="font-palanquin text-lg font-bold mb-4">Order Details</h3>
        {orderPlaced.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-12 h-12 bg-pale-blue rounded-lg flex items-center justify-center flex-shrink-0"><img src={getImg(item.image)} alt="" className="w-8 h-8 object-contain" /></div>
            <div className="flex-1 min-w-0"><p className="font-montserrat text-sm font-semibold text-gray-900 truncate">{item.name}</p><p className="font-montserrat text-xs text-slate-gray">Qty: {item.quantity} × ${item.price}</p></div>
            <p className="font-montserrat text-sm font-bold">${item.subtotal.toFixed(2)}</p>
          </div>
        ))}
        <div className="pt-4 mt-2 border-t border-gray-100"><div className="flex justify-between"><span className="font-palanquin text-lg font-bold">Total</span><span className="font-palanquin text-lg font-bold text-coral-red">${orderPlaced.totalAmount.toFixed(2)}</span></div></div>
      </div>
      <div className="flex gap-4 justify-center">
        <Link to="/orders" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">View My Orders</Link>
        <Link to="/products" className="border border-gray-200 text-gray-700 font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-50">Continue Shopping</Link>
      </div>
    </div></section>
  );

  const items = cart?.items || [];
  const subtotal = cart?.total || 0;
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const finalTotal = subtotal + shipping;

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      {toast && <div className="fixed top-6 right-6 z-[100]" style={{ animation: "slideIn 0.3s ease-out" }}><style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style><div className="bg-red-500 text-white px-5 py-3.5 rounded-xl shadow-2xl font-montserrat text-sm font-medium">{toast}</div></div>}
      <h1 className="font-palanquin text-3xl md:text-4xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-palanquin text-xl font-bold mb-5">Shipping Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div>
              <div><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div>
              <div className="md:col-span-2"><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div>
              <div className="md:col-span-2"><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">Address *</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div>
              <div><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div><div><label className="block font-montserrat text-sm font-medium text-gray-700 mb-1">ZIP</label><input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" /></div></div>
            </div>
            {promoCode && <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3"><p className="font-montserrat text-sm text-green-700">Promo code <strong>{promoCode}</strong> applied</p></div>}
          </div>
          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-palanquin text-xl font-bold mb-5">Payment Method</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(paymentMethods.length ? paymentMethods : [{ id: "cod", name: "COD" }, { id: "esewa", name: "eSewa" }, { id: "khalti", name: "Khalti" }, { id: "card", name: "Card" }]).map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === m.id ? "border-coral-red bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-2xl block mb-1">{PAYMENT_ICONS[m.id] || "💳"}</span>
                  <span className="font-montserrat text-xs font-medium text-gray-700">{m.name}</span>
                </button>
              ))}
            </div>
            {paymentMethod === "esewa" && <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl"><p className="font-montserrat text-sm text-green-800">📱 You'll be redirected to eSewa payment page to complete payment.</p><p className="font-montserrat text-xs text-green-600 mt-1">Test: ID 9806800001 | Password Nepal@123 | OTP 123456</p></div>}
            {paymentMethod === "khalti" && <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl"><p className="font-montserrat text-sm text-purple-800">💜 You'll be redirected to Khalti payment page.</p><p className="font-montserrat text-xs text-purple-600 mt-1">Test: Mobile 9800000001 | PIN 1111 | OTP 987654</p></div>}
            {paymentMethod === "card" && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"><p className="font-montserrat text-sm text-blue-800">💳 You'll be redirected to secure card payment page.</p><p className="font-montserrat text-xs text-blue-600 mt-1">Test: 4242 4242 4242 4242 | Expiry 12/28 | CVV 123</p></div>}
            {paymentMethod === "cod" && <div className="mt-4 p-4 bg-amber-50 rounded-xl"><p className="font-montserrat text-sm text-amber-700">💵 Pay cash when your order is delivered.</p></div>}
          </div>
        </div>
        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-28">
            <h3 className="font-palanquin text-xl font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pale-blue rounded-lg flex items-center justify-center flex-shrink-0"><img src={getImg(item.product?.image)} alt="" className="w-8 h-8 object-contain" /></div>
                  <div className="flex-1 min-w-0"><p className="font-montserrat text-sm font-medium text-gray-900 truncate">{item.product?.name}</p><p className="font-montserrat text-xs text-slate-gray">Qty: {item.quantity} × ${item.effectivePrice}</p></div>
                  <p className="font-montserrat text-sm font-bold">${(item.effectivePrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <hr className="border-gray-100 my-4" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-montserrat text-sm"><span className="text-slate-gray">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-montserrat text-sm"><span className="text-slate-gray">Shipping</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Free" : `$${shipping}`}</span></div>
              <hr className="border-gray-100" />
              <div className="flex justify-between"><span className="font-palanquin text-lg font-bold">Total</span><span className="font-palanquin text-lg font-bold text-coral-red">${finalTotal.toFixed(2)}</span></div>
            </div>
            <button onClick={handlePlaceOrder} disabled={placing} className="w-full bg-coral-red text-white font-montserrat text-sm font-medium py-3.5 rounded-xl hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-coral-red/25">
              {placing ? "Processing..." : paymentMethod === "cod" ? "Place Order (COD)" : `Pay $${finalTotal.toFixed(2)} with ${paymentMethod === "esewa" ? "eSewa" : paymentMethod === "khalti" ? "Khalti" : "Card"}`}
            </button>
            <Link to="/cart" className="block text-center mt-3 font-montserrat text-sm text-slate-gray hover:text-coral-red">Back to Cart</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
