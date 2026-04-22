import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { bulkOrderAPI, paymentAPI } from "../api";
import { useToast } from "../Components/Toast";

const statusConfig = {
  pending: { color: "bg-amber-100 text-amber-700", label: "⏳ Pending Review", desc: "We're reviewing your request and will send a quote soon." },
  quoted: { color: "bg-blue-100 text-blue-700", label: "💰 Quote Ready", desc: "We've sent you a custom bulk price! Check details below." },
  accepted: { color: "bg-green-100 text-green-700", label: "✅ Accepted", desc: "Your bulk order has been confirmed." },
  rejected: { color: "bg-red-100 text-red-700", label: "❌ Declined", desc: "This request was declined. Please contact us for details." },
};

const BulkOrders = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [paying, setPaying] = useState(null);

  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/profile"); return; }
    bulkOrderAPI.getMyRequests()
      .then(r => setOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="pt-32 padding-x pb-16 max-container">
        <div className="max-w-3xl mx-auto">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse mb-4" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-palanquin text-3xl font-bold">My Bulk Orders</h1>
            <p className="font-montserrat text-slate-gray mt-1">Track your wholesale order requests and quotes</p>
          </div>
          <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-500">
            Browse Products
          </Link>
        </div>

        {!orders.length ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-palanquin text-xl font-bold mb-2">No Bulk Orders Yet</h3>
            <p className="font-montserrat text-slate-gray mb-6">Browse our products and request wholesale pricing</p>
            <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const isExpanded = expandedId === order.id;
              const savings = order.totalBulkPrice != null ? order.totalOriginal - order.totalBulkPrice : 0;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-palanquin text-lg font-bold">{order.requestNumber}</p>
                          <span className={`px-2.5 py-0.5 rounded-full font-montserrat text-[10px] font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="font-montserrat text-xs text-slate-gray">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          {order.businessName && ` • ${order.businessName}`}
                          {` • ${order.items.length} product(s)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-montserrat text-xs text-slate-gray">Retail Total</p>
                        <p className="font-palanquin text-lg font-bold">${order.totalOriginal?.toFixed(2)}</p>
                        {order.totalBulkPrice != null && (
                          <p className="font-montserrat text-sm font-bold text-green-600">
                            Bulk: ${order.totalBulkPrice.toFixed(2)}
                            {savings > 0 && <span className="text-xs ml-1">(save ${savings.toFixed(2)})</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="font-montserrat text-xs text-slate-gray mt-2">{config.desc}</p>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5">
                      {/* Status message */}
                      {order.status === "quoted" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                          <h4 className="font-palanquin text-sm font-bold text-blue-800 mb-1">💰 Your Custom Bulk Price Quote</h4>
                          <p className="font-montserrat text-xs text-blue-700">Review the wholesale pricing below. Contact us to confirm your order.</p>
                        </div>
                      )}

                      {order.adminNote && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                          <p className="font-montserrat text-xs text-slate-gray">Note from xsow team:</p>
                          <p className="font-montserrat text-sm font-medium">{order.adminNote}</p>
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2.5 text-left font-montserrat text-xs font-semibold text-slate-gray">Product</th>
                              <th className="px-4 py-2.5 text-center font-montserrat text-xs font-semibold text-slate-gray">Qty</th>
                              <th className="px-4 py-2.5 text-right font-montserrat text-xs font-semibold text-slate-gray">Retail Price</th>
                              {order.status !== "pending" && (
                                <th className="px-4 py-2.5 text-right font-montserrat text-xs font-semibold text-slate-gray">Bulk Price</th>
                              )}
                              <th className="px-4 py-2.5 text-right font-montserrat text-xs font-semibold text-slate-gray">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => {
                              const price = item.bulkPrice || item.originalPrice;
                              const subtotal = price * item.requestedQuantity;
                              return (
                                <tr key={idx} className="border-t border-gray-100">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <img src={getImg(item.image)} alt="" className="w-8 h-8 rounded-lg object-contain bg-pale-blue p-0.5"
                                        onError={e => { e.target.style.display = "none"; }} />
                                      <div>
                                        <p className="font-montserrat text-sm font-semibold">{item.name}</p>
                                        {item.fabric && <p className="font-montserrat text-[10px] text-gray-400">{item.fabric}</p>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-montserrat text-sm font-bold">{item.requestedQuantity}</td>
                                  <td className="px-4 py-3 text-right font-montserrat text-sm ${item.bulkPrice && item.bulkPrice < item.originalPrice ? 'line-through text-gray-400' : ''}">${item.originalPrice}</td>
                                  {order.status !== "pending" && (
                                    <td className="px-4 py-3 text-right">
                                      <span className={`font-montserrat text-sm font-bold ${item.bulkPrice && item.bulkPrice < item.originalPrice ? "text-green-600" : ""}`}>
                                        ${item.bulkPrice || item.originalPrice}
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-right font-montserrat text-sm font-bold">${subtotal.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan={order.status !== "pending" ? 4 : 3} className="px-4 py-3 text-right font-palanquin text-sm font-bold">
                                {order.totalBulkPrice != null ? "Bulk Total" : "Retail Total"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-palanquin text-lg font-bold text-coral-red">
                                  ${(order.totalBulkPrice ?? order.totalOriginal)?.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                            {savings > 0 && (
                              <tr className="bg-green-50">
                                <td colSpan={order.status !== "pending" ? 4 : 3} className="px-4 py-2 text-right font-montserrat text-xs font-semibold text-green-700">You Save</td>
                                <td className="px-4 py-2 text-right font-montserrat text-sm font-bold text-green-700">${savings.toFixed(2)}</td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>

                      {order.message && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-3">
                          <p className="font-montserrat text-xs text-slate-gray">Your message:</p>
                          <p className="font-montserrat text-sm">{order.message}</p>
                        </div>
                      )}

                      {order.status === "quoted" && (
                        <div className="mt-5 space-y-3">
                          <p className="font-montserrat text-sm font-semibold text-gray-700">Choose payment method to confirm:</p>
                          <div className="flex gap-2 flex-wrap">
                            {[{id:"esewa",label:"📱 eSewa",color:"bg-green-500 hover:bg-green-600"},{id:"khalti",label:"💜 Khalti",color:"bg-purple-600 hover:bg-purple-700"},{id:"card",label:"💳 Card",color:"bg-blue-600 hover:bg-blue-700"},{id:"cod",label:"💵 COD",color:"bg-amber-500 hover:bg-amber-600"}].map(m => (
                              <button key={m.id} disabled={paying===order.id} onClick={async () => {
                                setPaying(order.id);
                                try {
                                  // Accept the bulk order first
                                  await bulkOrderAPI.updateStatus(order.id, { status: "accepted" });
                                  toast.success("Bulk order accepted!");
                                  if (m.id !== "cod") {
                                    // Create a payment session — redirect to our payment page
                                    const payRes = await paymentAPI.initiate({ orderId: order.id, method: m.id });
                                    if (payRes.data.data.paymentUrl) {
                                      window.location.href = payRes.data.data.paymentUrl;
                                      return;
                                    }
                                  }
                                  toast.success("Order confirmed with " + m.label);
                                  // Refresh
                                  const r = await bulkOrderAPI.getMyRequests();
                                  setOrders(r.data.data || []);
                                } catch (err) { toast.error(err.response?.data?.error || "Payment failed"); }
                                finally { setPaying(null); }
                              }} className={`${m.color} text-white px-4 py-2.5 rounded-xl font-montserrat text-sm font-medium disabled:opacity-50`}>
                                {paying===order.id ? "Processing..." : m.label}
                              </button>
                            ))}
                          </div>
                          <Link to="/products" className="inline-block px-5 py-2.5 border border-gray-200 rounded-xl font-montserrat text-sm hover:bg-gray-50 mt-2">Continue Shopping</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BulkOrders;
