import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsAPI, cartAPI, bulkOrderAPI } from "../api";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ quantity: "", businessName: "", phone: "", message: "" });
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getById(id);
        const p = res.data.data;
        setProduct(p);
        // Set initial quantity to minOrder if set
        if (p.minOrder && p.minOrder > 1) setQuantity(p.minOrder);
      } catch (err) {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/profile");
      return;
    }
    setAddedToCart(true);
    try {
      await cartAPI.add({ productId: product.id, quantity });
    } catch (err) {
      console.error("Cart error:", err);
    }
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `http://localhost:5001${img}`;
  };

  if (loading) {
    return (
      <section className="pt-32 padding-x pb-16 max-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-gray-100 rounded-2xl h-[500px] animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 w-32 bg-gray-200 rounded animate-pulse mt-6" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="pt-32 padding-x pb-16 max-container text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-palanquin text-2xl font-bold mb-2">Product Not Found</h3>
        <p className="font-montserrat text-slate-gray mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500 transition-colors">
          Back to Products
        </Link>
      </section>
    );
  }

  const images = [product.image, ...(product.thumbnails || [])].filter(Boolean);

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      {/* Toast */}
      {addedToCart && (
        <div className="fixed top-6 right-6 z-[100]" style={{ animation: "slideIn 0.3s ease-out" }}>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div className="bg-green-500 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-montserrat text-sm font-medium">Added to cart!</span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-montserrat text-sm text-slate-gray mb-8">
        <Link to="/" className="hover:text-coral-red transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-coral-red transition-colors">Products</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left - Images */}
        <div>
          {/* Main Image */}
          <div className="bg-pale-blue rounded-2xl p-8 flex items-center justify-center h-[450px] mb-4 relative overflow-hidden">
            {product.featured && (
              <span className="absolute top-4 left-4 bg-coral-red text-white font-montserrat text-xs font-bold px-3 py-1.5 rounded-full z-10">Featured</span>
            )}
            {product.stock <= 10 && product.stock > 0 && (
              <span className="absolute top-4 right-4 bg-amber-500 text-white font-montserrat text-xs font-bold px-3 py-1.5 rounded-full z-10">Only {product.stock} left</span>
            )}
            <img
              src={getImageUrl(images[selectedImage])}
              alt={product.name}
              className="max-w-full max-h-full object-contain transition-all duration-500"
              onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' fill='%23ddd'%3E%3Crect width='300' height='300' rx='16'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"; }}
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? "border-coral-red" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain bg-pale-blue p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right - Info */}
        <div className="flex flex-col">
          <span className="font-montserrat text-xs text-coral-red font-semibold uppercase tracking-widest mb-2">
            {product.category}
          </span>

          <h1 className="font-palanquin text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= Math.round(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-montserrat text-sm text-slate-gray">
                {product.rating} ({product.reviews || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <p className="font-palanquin text-4xl font-bold text-gray-900">${product.price}</p>
          </div>

          {/* Description */}
          <p className="font-montserrat text-base text-slate-gray leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Fabric & Wholesale Info */}
          {(product.fabric || product.minOrder > 1) && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              {product.fabric && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-coral-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  <span className="font-montserrat text-sm"><strong className="text-gray-900">Fabric:</strong> <span className="text-slate-gray">{product.fabric}</span></span>
                </div>
              )}
              {product.minOrder > 1 && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-coral-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <span className="font-montserrat text-sm"><strong className="text-gray-900">Min. Wholesale Order:</strong> <span className="text-slate-gray">{product.minOrder} units</span></span>
                </div>
              )}
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
            <span className="font-montserrat text-sm font-medium text-gray-700">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Quantity + Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(product.minOrder || 1, quantity - 1))}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-semibold"
                >−</button>
                <span className="px-5 py-3 font-montserrat font-semibold text-gray-900 min-w-[50px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-semibold"
                >+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-montserrat text-base font-medium transition-all duration-300 ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : "bg-coral-red text-white hover:bg-red-500 shadow-lg shadow-coral-red/25"
                }`}
              >
                {addedToCart ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Added to Cart</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>Add to Cart</>
                )}
              </button>
            </div>
          )}

          {/* Request Bulk Order */}
          {product.stock > 0 && (
            <button
              onClick={() => {
                if (!localStorage.getItem("token")) { navigate("/profile"); return; }
                setBulkForm({ quantity: product.minOrder > 1 ? product.minOrder.toString() : "10", businessName: "", phone: "", message: "" });
                setShowBulkModal(true);
                setBulkSuccess(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-montserrat text-sm font-medium border-2 border-coral-red text-coral-red hover:bg-red-50 transition-all mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Request Bulk Order
            </button>
          )}

          {/* Features */}
          <div className="border-t border-gray-100 pt-6 space-y-3">
            {[
              { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", label: "Free shipping on orders over $100" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Secure payment & 30-day returns" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Ships within 2-4 business days" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-coral-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                </svg>
                <span className="font-montserrat text-sm text-slate-gray">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Order Request Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-palanquin text-xl font-bold">📦 Request Bulk Order</h3>
              <p className="font-montserrat text-sm text-slate-gray mt-1">{product.name} — ${product.price} each</p>
            </div>
            {bulkSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className="font-palanquin text-lg font-bold mb-2">Request Submitted!</h4>
                <p className="font-montserrat text-sm text-slate-gray mb-4">We'll review your bulk order request and send you a custom price quote via email.</p>
                <div className="flex gap-3 justify-center">
                  <Link to="/bulk-orders" className="bg-coral-red text-white px-5 py-2.5 rounded-xl font-montserrat text-sm font-medium hover:bg-red-500">View My Requests</Link>
                  <button onClick={() => setShowBulkModal(false)} className="px-5 py-2.5 border rounded-xl font-montserrat text-sm">Close</button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block font-montserrat text-sm font-medium mb-1">Quantity *</label>
                  <input type="number" min={product.minOrder || 1} required value={bulkForm.quantity}
                    onChange={e => setBulkForm({ ...bulkForm, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" />
                  {product.minOrder > 1 && <p className="font-montserrat text-xs text-gray-400 mt-1">Min. wholesale order: {product.minOrder} units</p>}
                </div>
                <div>
                  <label className="block font-montserrat text-sm font-medium mb-1">Business Name</label>
                  <input value={bulkForm.businessName} onChange={e => setBulkForm({ ...bulkForm, businessName: e.target.value })}
                    placeholder="Your shop/business name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" />
                </div>
                <div>
                  <label className="block font-montserrat text-sm font-medium mb-1">Phone</label>
                  <input type="tel" value={bulkForm.phone} onChange={e => setBulkForm({ ...bulkForm, phone: e.target.value })}
                    placeholder="Contact number"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" />
                </div>
                <div>
                  <label className="block font-montserrat text-sm font-medium mb-1">Message (optional)</label>
                  <textarea rows={2} value={bulkForm.message} onChange={e => setBulkForm({ ...bulkForm, message: e.target.value })}
                    placeholder="Any special requirements, preferred delivery date, etc."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red" />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-montserrat text-xs text-slate-gray">Estimated total at retail price: <strong className="text-gray-900">${(product.price * (parseInt(bulkForm.quantity) || 0)).toFixed(2)}</strong></p>
                  <p className="font-montserrat text-xs text-slate-gray mt-1">Bulk pricing will be provided by our team after review.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    disabled={bulkSubmitting || !bulkForm.quantity}
                    onClick={async () => {
                      setBulkSubmitting(true);
                      try {
                        await bulkOrderAPI.request({
                          items: [{ productId: product.id, quantity: parseInt(bulkForm.quantity) }],
                          businessName: bulkForm.businessName,
                          phone: bulkForm.phone,
                          message: bulkForm.message,
                        });
                        setBulkSuccess(true);
                      } catch (err) {
                        alert(err.response?.data?.error || "Failed to submit request");
                      } finally { setBulkSubmitting(false); }
                    }}
                    className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium disabled:opacity-50">
                    {bulkSubmitting ? "Submitting..." : "Submit Bulk Request"}
                  </button>
                  <button onClick={() => setShowBulkModal(false)} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetail;