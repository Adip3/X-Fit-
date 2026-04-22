import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { salesAPI, cartAPI } from "../api";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await salesAPI.getActive();
        const data = res.data.data || [];
        setSales(data);
        // Calculate countdown from nearest end date
        if (data.length > 0) {
          const nearest = data.reduce((min, s) => new Date(s.endsAt) < new Date(min.endsAt) ? s : min);
          const diff = new Date(nearest.endsAt) - new Date();
          if (diff > 0) {
            setTimeLeft({
              days: Math.floor(diff / (1000 * 60 * 60 * 24)),
              hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
              minutes: Math.floor((diff / (1000 * 60)) % 60),
              seconds: Math.floor((diff / 1000) % 60),
            });
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSales();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (productId) => {
    if (!localStorage.getItem("token")) { window.location.href = "/profile"; return; }
    setAddedToCart(productId);
    try { await cartAPI.add({ productId, quantity: 1 }); } catch (err) { console.error(err); }
    setTimeout(() => setAddedToCart(null), 1500);
  };

  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  if (loading) {
    return (
      <section className="pt-32 padding-x pb-16 max-container">
        <div className="h-48 bg-coral-red/20 rounded-2xl animate-pulse mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      {/* Toast */}
      {addedToCart && (
        <div className="fixed top-6 right-6 z-[100]" style={{ animation: "slideIn 0.3s ease-out" }}>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div className="bg-green-500 text-white px-5 py-3.5 rounded-xl shadow-2xl font-montserrat text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Added to cart!
          </div>
        </div>
      )}

      {/* Sale Banner */}
      <div className="bg-coral-red rounded-2xl p-8 md:p-12 mb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full font-montserrat text-sm font-medium mb-4">
            {sales.length} Active {sales.length === 1 ? "Deal" : "Deals"}
          </span>
          <h1 className="font-palanquin text-4xl md:text-5xl font-bold mb-3">Season Sale</h1>
          <p className="font-montserrat text-lg text-white/80 mb-8 max-w-md">
            Grab your favorite xsow shoes at unbeatable prices before the sale ends!
          </p>
          <div className="flex gap-4">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Mins", value: timeLeft.minutes },
              { label: "Secs", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[70px]">
                <p className="font-palanquin text-2xl md:text-3xl font-bold">{String(item.value).padStart(2, "0")}</p>
                <p className="font-montserrat text-xs text-white/70 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-10">
        <h2 className="font-palanquin text-3xl md:text-4xl font-bold">
          On <span className="text-coral-red">Sale</span> Now
        </h2>
        <p className="font-montserrat text-slate-gray mt-2">Don't miss these exclusive deals</p>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          <h3 className="font-palanquin text-xl font-bold mb-2">No active sales right now</h3>
          <p className="font-montserrat text-slate-gray mb-6">Check back later for amazing deals!</p>
          <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500 transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sales.map((sale) => (
            <div key={sale.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Link to={`/product/${sale.productId}`} className="relative bg-pale-blue p-6 flex items-center justify-center h-64 block">
                <span className="absolute top-4 left-4 bg-coral-red text-white font-montserrat text-xs font-bold px-3 py-1.5 rounded-full">-{sale.discount}%</span>
                {sale.tag && <span className="absolute top-4 right-4 bg-white text-gray-700 font-montserrat text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">{sale.tag}</span>}
                <img
                  src={getImg(sale.product?.image)}
                  alt={sale.product?.name}
                  className="w-48 h-48 object-contain group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23ddd'%3E%3Crect width='200' height='200' rx='16'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"; }}
                />
              </Link>
              <div className="p-6">
                <span className="font-montserrat text-xs text-coral-red font-medium uppercase tracking-wider">{sale.product?.category}</span>
                <Link to={`/product/${sale.productId}`}>
                  <h3 className="font-palanquin text-xl font-semibold mt-1 mb-3 text-gray-900 hover:text-coral-red transition-colors">{sale.product?.name}</h3>
                </Link>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-montserrat text-2xl font-bold text-coral-red">${sale.salePrice}</span>
                  <span className="font-montserrat text-base text-slate-gray line-through">${sale.product?.price}</span>
                </div>
                <button
                  onClick={() => handleAddToCart(sale.productId)}
                  className={`w-full font-montserrat text-sm font-medium py-3 rounded-xl transition-colors duration-300 ${
                    addedToCart === sale.productId
                      ? "bg-green-500 text-white"
                      : "bg-gray-900 text-white hover:bg-coral-red"
                  }`}
                >
                  {addedToCart === sale.productId ? "✓ Added" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <Link to="/products" className="inline-flex items-center gap-2 font-montserrat text-slate-gray hover:text-coral-red transition-colors">
          View All Products
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>
      </div>
    </section>
  );
};

export default Sales;