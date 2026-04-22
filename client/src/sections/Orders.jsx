import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI, paymentAPI } from "../api";
import { useToast } from "../Components/Toast";

const statusColors = {
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const Orders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [invoiceHtml, setInvoiceHtml] = useState(null);
  const isLoggedIn = !!localStorage.getItem("token");

  const handleViewInvoice = async (orderId) => { try { const r = await paymentAPI.getInvoice(orderId); setInvoiceHtml(r.data.data.html); } catch { toast.error("Failed to load invoice"); } };
  const handleEmailInvoice = async (orderId, email) => { try { await paymentAPI.emailInvoice(orderId, { email }); toast.success("Invoice sent to " + email); } catch { toast.error("Failed to send invoice"); } };

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    const fetchOrders = async () => {
      try {
        const res = await ordersAPI.getMyOrders();
        setOrders(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const getImg = (img) => (!img ? "" : img.startsWith("http") ? img : `http://localhost:5001${img}`);

  if (!isLoggedIn) {
    return (
      <section className="pt-32 padding-x pb-16 max-container text-center py-20">
        <h2 className="font-palanquin text-2xl font-bold mb-2">Sign in to view orders</h2>
        <Link to="/profile" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500 transition-colors">Sign In</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="pt-32 padding-x pb-16 max-container">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        {[1, 2].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse mb-4" />)}
      </section>
    );
  }

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      <h1 className="font-palanquin text-3xl md:text-4xl font-bold mb-2">My <span className="text-coral-red">Orders</span></h1>
      <p className="font-montserrat text-slate-gray mb-8">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h3 className="font-palanquin text-xl font-bold mb-2">No orders yet</h3>
          <p className="font-montserrat text-slate-gray mb-6">Start shopping to place your first order.</p>
          <Link to="/products" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500 transition-colors">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Order Header */}
              <div className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-10 h-10 bg-pale-blue rounded-lg border-2 border-white flex items-center justify-center">
                        <img src={getImg(item.image)} alt="" className="w-6 h-6 object-contain" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center font-montserrat text-xs font-bold text-gray-500">+{order.items.length - 3}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-montserrat text-sm font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="font-montserrat text-xs text-slate-gray">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full font-montserrat text-xs font-semibold capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                  <p className="font-palanquin text-lg font-bold">${order.totalAmount.toFixed(2)}</p>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-5">
                  {/* Items */}
                  <div className="space-y-3 mb-5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-pale-blue rounded-lg flex items-center justify-center">
                          <img src={getImg(item.image)} alt={item.name} className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="font-montserrat text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="font-montserrat text-xs text-slate-gray">{item.quantity} × ${item.price}</p>
                        </div>
                        <p className="font-montserrat text-sm font-bold">${item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-montserrat text-xs font-semibold text-slate-gray uppercase tracking-wider mb-2">Shipping To</p>
                      <p className="font-montserrat text-sm font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                      <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.address}</p>
                      <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.city} {order.shippingAddress?.zip}</p>
                      <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.phone}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-montserrat text-xs font-semibold text-slate-gray uppercase tracking-wider mb-2">Payment</p>
                      <p className="font-montserrat text-sm text-gray-900 capitalize">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  {order.timeline && order.timeline.length > 0 && (
                    <div>
                      <p className="font-montserrat text-xs font-semibold text-slate-gray uppercase tracking-wider mb-3">Order Timeline</p>
                      <div className="space-y-3">
                        {order.timeline.map((event, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-coral-red" : "bg-gray-300"}`} />
                            <div>
                              <p className="font-montserrat text-sm font-medium text-gray-900 capitalize">{event.status}</p>
                              <p className="font-montserrat text-xs text-slate-gray">{event.note} • {new Date(event.date).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoice Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => handleViewInvoice(order.id)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl font-montserrat text-xs font-medium hover:bg-gray-800">📄 View Invoice</button>
                    <button onClick={() => handleEmailInvoice(order.id, order.shippingAddress?.email)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl font-montserrat text-xs font-medium hover:bg-gray-50">📧 Email Invoice</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceHtml && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInvoiceHtml(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-palanquin text-lg font-bold">Invoice</h3>
              <button onClick={() => setInvoiceHtml(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-4" dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;