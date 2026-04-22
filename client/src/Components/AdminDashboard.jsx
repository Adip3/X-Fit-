import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { productsAPI, ordersAPI, salesAPI, promosAPI, settingsAPI, subscribersAPI, usersAPI, authAPI, bulkOrderAPI } from "../api";
import api from "../api/config";

const ADMIN_EMAIL = "admin@xsow.com";
const ADMIN_PASSWORD = "admin123";
const statusColors = { confirmed:"bg-blue-100 text-blue-700", processing:"bg-amber-100 text-amber-700", shipped:"bg-purple-100 text-purple-700", delivered:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700" };
const statusOptions = ["confirmed","processing","shipped","delivered","cancelled"];
const paymentStatusOptions = ["pending","paid","failed","refunded"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast] = useState(null);

  // Product state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [productForm, setProductForm] = useState({ name:"", category:"", price:"", stock:"", description:"", featured:false, rating:"", fabric:"", minOrder:"", launchDate:"" });

  // Sale state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [saleForm, setSaleForm] = useState({ productId:"", discount:"", salePrice:"", tag:"", endsAt:"", active:true });

  // Order state
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Promo state
  const [promos, setPromos] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({ code:"", type:"percentage", value:"", minOrder:"", maxUses:"", expiresAt:"" });

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name:"", email:"", password:"", role:"customer" });
  const [showEmailModal, setShowEmailModal] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject:"", message:"" });

  // Settings
  const [siteSettings, setSiteSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [togglingsite, setTogglingSite] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Subscribers
  const [subscribers, setSubscribers] = useState([]);

  // Bulk Orders
  const [bulkOrders, setBulkOrders] = useState([]);
  const [expandedBulk, setExpandedBulk] = useState(null);
  const [bulkQuoteForm, setBulkQuoteForm] = useState({});

  // Categories (dynamic)
  const [categories, setCategories] = useState(["Running","Casual","Hiking","Sports","Formal","Clothes"]);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null),3000); };
  const getImg = (img) => (!img?"":img.startsWith("http")?img:`http://localhost:5001${img}`);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (token && user.role === "admin") { fetchAll(); return; }
      try {
        const res = await authAPI.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        const { data: u, token: t } = res.data;
        if (u.role !== "admin") { navigate("/"); return; }
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
        showToast(`Welcome, ${u.name}!`);
        fetchAll();
      } catch { showToast("Admin login failed", "error"); navigate("/"); }
    })();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pr,or,sl,st,pm,se,sb,us,bo] = await Promise.all([
        productsAPI.getAll({admin:"true"}), ordersAPI.getAll().catch(()=>({data:{data:[]}})),
        salesAPI.getAll().catch(()=>({data:{data:[]}})), api.get("/stats"),
        promosAPI.getAll().catch(()=>({data:{data:[]}})),
        settingsAPI.getAll().catch(()=>({data:{data:{}}})),
        subscribersAPI.getAll().catch(()=>({data:{data:[]}})),
        usersAPI.getAll().catch(()=>({data:{data:[]}})),
        bulkOrderAPI.getAll().catch(()=>({data:{data:[]}})),
      ]);
      setProducts(pr.data.data||[]); setOrders(or.data.data||[]);
      setSales(sl.data.data||[]); setStats(st.data.data||null);
      setPromos(pm.data.data||[]);
      const s=se.data.data||{}; setSiteSettings(s); setSettingsForm(s);
      if(s.categories?.length) setCategories(s.categories);
      setSubscribers(sb.data.data||[]);
      setUsers(us.data.data||[]);
      setBulkOrders(bo.data.data||[]);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  // ═══ HANDLERS ═══
  const resetProductForm = () => { setProductForm({ name:"",category:"",price:"",stock:"",description:"",featured:false,rating:"",fabric:"",minOrder:"",launchDate:"" }); setImageFile(null); setImagePreview(null); setShowProductForm(false); setEditingProduct(null); };
  const handleProductSubmit = async (e) => { e.preventDefault(); try { const d=new FormData(); Object.entries(productForm).forEach(([k,v])=>d.append(k,v)); if(imageFile) d.append("image",imageFile); const t=localStorage.getItem("token"); const c={headers:{"Content-Type":"multipart/form-data",Authorization:`Bearer ${t}`}}; if(editingProduct) await api.put(`/products/${editingProduct.id}`,d,c); else await api.post("/products",d,c); showToast(editingProduct?"Updated!":"Created!"); resetProductForm(); fetchAll(); } catch(e){ showToast(e.response?.data?.error||"Failed","error"); } };
  const handleEditProduct = (p) => { setEditingProduct(p); setProductForm({ name:p.name, category:p.category||"", price:p.price?.toString()||"", stock:p.stock?.toString()||"", description:p.description||"", featured:p.featured||false, rating:p.rating?.toString()||"", fabric:p.fabric||"", minOrder:p.minOrder?.toString()||"", launchDate:p.launchDate?p.launchDate.slice(0,16):"" }); setImagePreview(p.image?getImg(p.image):null); setImageFile(null); setShowProductForm(true); };
  const handleDeleteProduct = async (id) => { if(!confirm("Delete?")) return; try{ await productsAPI.delete(id); showToast("Deleted!"); fetchAll(); }catch{ showToast("Failed","error"); } };
  const handleNotifySubscribers = async (productId) => { try { const r = await productsAPI.notifySubscribers(productId); showToast(r.data.message || "Subscribers notified!"); } catch(e) { showToast(e.response?.data?.error || "Failed to notify", "error"); } };

  const handleUpdateOrderStatus = async (id, status) => { try{ await ordersAPI.updateStatus(id,{status,note:`Admin: ${status}`}); showToast(`Order ${status}`); fetchAll(); }catch(e){ showToast(e.response?.data?.error||"Failed","error"); } };
  const handleUpdatePaymentStatus = async (id, paymentStatus) => { try{ await ordersAPI.updateStatus(id,{paymentStatus}); showToast(`Payment: ${paymentStatus}`); fetchAll(); }catch(e){ showToast("Failed","error"); } };

  const resetSaleForm = () => { setSaleForm({productId:"",discount:"",salePrice:"",tag:"",endsAt:"",active:true}); setShowSaleForm(false); setEditingSale(null); };
  const handleSaleSubmit = async (e) => { e.preventDefault(); try{ if(editingSale) await salesAPI.update(editingSale.id,saleForm); else await salesAPI.create(saleForm); showToast(editingSale?"Updated!":"Created! Subscribers notified."); resetSaleForm(); fetchAll(); }catch(e){ showToast(e.response?.data?.error||"Failed","error"); } };
  const handleEditSale = (s) => { setEditingSale(s); setSaleForm({productId:s.productId,discount:s.discount?.toString()||"",salePrice:s.salePrice?.toString()||"",tag:s.tag||"",endsAt:s.endsAt?s.endsAt.split("T")[0]:"",active:s.active}); setShowSaleForm(true); };
  const handleDeleteSale = async (id) => { if(!confirm("Delete?")) return; try{ await salesAPI.delete(id); showToast("Deleted!"); fetchAll(); }catch{ showToast("Failed","error"); } };
  const handleToggleSale = async (s) => { try{ await salesAPI.update(s.id,{active:!s.active}); showToast(s.active?"Deactivated":"Activated"); fetchAll(); }catch{ showToast("Failed","error"); } };

  const resetPromoForm = () => { setPromoForm({code:"",type:"percentage",value:"",minOrder:"",maxUses:"",expiresAt:""}); setShowPromoForm(false); setEditingPromo(null); };
  const handlePromoSubmit = async (e) => { e.preventDefault(); try{ if(editingPromo) await promosAPI.update(editingPromo.id,promoForm); else await promosAPI.create(promoForm); showToast(editingPromo?"Updated!":"Created!"); resetPromoForm(); fetchAll(); }catch(e){ showToast(e.response?.data?.error||"Failed","error"); } };
  const handleEditPromo = (p) => { setEditingPromo(p); setPromoForm({code:p.code,type:p.type,value:p.value?.toString()||"",minOrder:p.minOrder?.toString()||"",maxUses:p.maxUses?.toString()||"",expiresAt:p.expiresAt?p.expiresAt.split("T")[0]:""}); setShowPromoForm(true); };
  const handleDeletePromo = async (id) => { if(!confirm("Delete?")) return; try{ await promosAPI.delete(id); showToast("Deleted!"); fetchAll(); }catch{ showToast("Failed","error"); } };
  const handleTogglePromo = async (p) => { try{ await promosAPI.update(p.id,{active:!p.active}); showToast(p.active?"Deactivated":"Activated"); fetchAll(); }catch{ showToast("Failed","error"); } };

  // User CRUD
  const resetUserForm = () => { setUserForm({name:"",email:"",password:"",role:"customer"}); setShowUserForm(false); setEditingUser(null); };
  const handleUserSubmit = async (e) => { e.preventDefault(); try{ if(editingUser){ const u={...userForm}; if(!u.password) delete u.password; await usersAPI.update(editingUser.id,u); }else{ await usersAPI.create(userForm); } showToast(editingUser?"Updated!":"Created + welcome email sent!"); resetUserForm(); fetchAll(); }catch(e){ showToast(e.response?.data?.error||"Failed","error"); } };
  const handleEditUser = (u) => { setEditingUser(u); setUserForm({name:u.name,email:u.email,password:"",role:u.role}); setShowUserForm(true); };
  const handleDeleteUser = async (id) => { if(!confirm("Delete user?")) return; try{ await usersAPI.delete(id); showToast("Deleted!"); fetchAll(); }catch{ showToast("Failed","error"); } };
  const handleSendEmail = async () => { if(!emailForm.subject||!emailForm.message){ showToast("Fill subject & message","error"); return; } try{ const res=await usersAPI.sendEmail(showEmailModal.id,emailForm); showToast(res.data.message); setShowEmailModal(null); setEmailForm({subject:"",message:""}); }catch(e){ showToast(e.response?.data?.error||"Send failed","error"); } };

  const handleToggleSite = async () => { setTogglingSite(true); try{ const r=await settingsAPI.toggleSite(); setSiteSettings(p=>({...p,siteEnabled:r.data.data.siteEnabled})); setSettingsForm(p=>({...p,siteEnabled:r.data.data.siteEnabled})); showToast(r.data.message); }catch{ showToast("Failed","error"); } finally{ setTogglingSite(false); } };
  const handleSaveSettings = async () => { try{ const r=await settingsAPI.update({...settingsForm, categories}); setSiteSettings(r.data.data); showToast("Saved!"); }catch{ showToast("Failed","error"); } };
  const handleDeleteSubscriber = async (id) => { if(!confirm("Remove?")) return; try{ await subscribersAPI.delete(id); showToast("Removed!"); fetchAll(); }catch{ showToast("Failed","error"); } };

  // Category management
  const handleAddCategory = () => { if(newCategory.trim() && !categories.includes(newCategory.trim())) { setCategories([...categories, newCategory.trim()]); setNewCategory(""); } };
  const handleRemoveCategory = (cat) => { setCategories(categories.filter(c => c !== cat)); };

  // Bulk order quote
  const handleSendBulkQuote = async (orderId) => {
    try {
      const form = bulkQuoteForm[orderId];
      if (!form) { showToast("Set bulk prices first", "error"); return; }
      const bulkOrder = bulkOrders.find(o => o.id === orderId);
      if (!bulkOrder) return;
      const items = bulkOrder.items.map(item => ({
        productId: item.productId,
        bulkPrice: parseFloat(form[item.productId] || item.originalPrice),
        approved: true,
      }));
      await bulkOrderAPI.quote(orderId, { items, adminNote: form.adminNote || "" });
      showToast("Quote sent to customer via email!");
      fetchAll();
    } catch(e) { showToast(e.response?.data?.error || "Failed", "error"); }
  };

  const handleBulkOrderStatus = async (id, status) => {
    try { await bulkOrderAPI.updateStatus(id, { status }); showToast(`Status: ${status}`); fetchAll(); }
    catch { showToast("Failed", "error"); }
  };

  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-coral-red border-t-transparent rounded-full animate-spin"/></div>;

  const tabs = ["products","orders","bulk orders","sales","promos","users","subscribers","settings"];
  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20";
  const pendingBulk = bulkOrders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast&&<div className="fixed top-6 right-6 z-[100]" style={{animation:"slideIn .3s ease-out"}}><style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style><div className={`${toast.type==="error"?"bg-red-500":"bg-green-500"} text-white px-5 py-3.5 rounded-xl shadow-2xl font-montserrat text-sm font-medium`}>{toast.msg}</div></div>}

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div><h1 className="font-palanquin text-2xl font-bold text-gray-900">Admin Dashboard</h1><p className="font-montserrat text-sm text-slate-gray mt-0.5">Manage xsow</p></div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-montserrat text-sm text-gray-600">Site:</span>
            <button onClick={handleToggleSite} disabled={togglingsite} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${siteSettings?.siteEnabled?"bg-green-500":"bg-red-500"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${siteSettings?.siteEnabled?"translate-x-8":"translate-x-1"}`}/></button>
            <span className={`font-montserrat text-xs font-bold ${siteSettings?.siteEnabled?"text-green-600":"text-red-500"}`}>{siteSettings?.siteEnabled?"LIVE":"OFF"}</span>
          </div>
          <Link to="/" className="font-montserrat text-sm text-coral-red hover:underline">← Store</Link>
        </div>
      </div>

      {/* STATS */}
      {stats&&<div className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[{l:"Products",v:stats.totalProducts,c:"bg-blue-50 text-blue-700"},{l:"Orders",v:stats.totalOrders,c:"bg-purple-50 text-purple-700"},{l:"Sales",v:stats.totalSales||0,c:"bg-orange-50 text-orange-700"},{l:"Users",v:users.length,c:"bg-green-50 text-green-700"},{l:"Subscribers",v:subscribers.length,c:"bg-pink-50 text-pink-700"},{l:"Bulk Reqs",v:bulkOrders.length,c:"bg-cyan-50 text-cyan-700"},{l:"Revenue",v:`$${stats.revenue?.toFixed(0)||"0"}`,c:"bg-amber-50 text-amber-700"}].map(s=><div key={s.l} className={`${s.c} rounded-xl p-4`}><p className="font-montserrat text-[10px] font-semibold uppercase tracking-wider opacity-70">{s.l}</p><p className="font-palanquin text-xl font-bold mt-1">{s.v}</p></div>)}
      </div>}

      {/* TABS */}
      <div className="px-8 border-b border-gray-200"><div className="flex gap-6 overflow-x-auto">
        {tabs.map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} className={`py-3 border-b-2 font-montserrat text-sm font-medium capitalize transition-all whitespace-nowrap ${activeTab===tab?"border-coral-red text-coral-red":"border-transparent text-slate-gray hover:text-gray-700"}`}>{tab}{tab==="bulk orders"&&pendingBulk>0?<span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingBulk}</span>:""}</button>)}
      </div></div>

      <div className="px-8 py-6">

        {/* ═══ PRODUCTS ═══ */}
        {activeTab==="products"&&<div>
          <div className="flex items-center justify-between mb-6"><h2 className="font-palanquin text-xl font-bold">Products ({products.length})</h2><button onClick={()=>{resetProductForm();setShowProductForm(true)}} className="bg-coral-red text-white font-montserrat text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-500">+ Add</button></div>
          {showProductForm&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetProductForm}><div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between"><h3 className="font-palanquin text-xl font-bold">{editingProduct?"Edit":"Add"} Product</h3><button onClick={resetProductForm} className="text-gray-500 hover:text-gray-700">✕</button></div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center relative">{imagePreview?<div className="relative inline-block"><img src={imagePreview} className="w-40 h-40 object-contain rounded-lg mx-auto"/><button type="button" onClick={()=>{setImageFile(null);setImagePreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button></div>:<p className="text-slate-gray text-sm">Upload image</p>}<input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){setImageFile(f);setImagePreview(URL.createObjectURL(f))}}} className="absolute inset-0 opacity-0 cursor-pointer"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block font-montserrat text-sm font-medium mb-1">Name *</label><input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} className={inp}/></div>
                <div><label className="block font-montserrat text-sm font-medium mb-1">Category *</label>
                  <select required value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})} className={inp+" bg-white"}>
                    <option value="">Select</option>
                    {categories.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4"><div><label className="block font-montserrat text-sm font-medium mb-1">Price *</label><input type="number" required min="0" step="0.01" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})} className={inp}/></div><div><label className="block font-montserrat text-sm font-medium mb-1">Stock *</label><input type="number" required min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})} className={inp}/></div><div><label className="block font-montserrat text-sm font-medium mb-1">Rating</label><input type="number" min="0" max="5" step="0.1" value={productForm.rating} onChange={e=>setProductForm({...productForm,rating:e.target.value})} className={inp}/></div></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">Description *</label><textarea required rows={3} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} className={inp}/></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block font-montserrat text-sm font-medium mb-1">Fabric Type</label><input placeholder="e.g. Cotton, Leather, Mesh" value={productForm.fabric} onChange={e=>setProductForm({...productForm,fabric:e.target.value})} className={inp}/></div><div><label className="block font-montserrat text-sm font-medium mb-1">Min. Wholesale Order</label><input type="number" min="1" placeholder="1" value={productForm.minOrder} onChange={e=>setProductForm({...productForm,minOrder:e.target.value})} className={inp}/></div></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">Scheduled Launch Date & Time</label><input type="datetime-local" value={productForm.launchDate} onChange={e=>setProductForm({...productForm,launchDate:e.target.value})} className={inp}/><p className="font-montserrat text-xs text-gray-400 mt-1">Leave empty to publish immediately. Set future date/time to schedule.</p></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.featured} onChange={e=>setProductForm({...productForm,featured:e.target.checked})}/><span className="font-montserrat text-sm">Featured</span></label>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium">{editingProduct?"Update":"Create"}</button><button type="button" onClick={resetProductForm} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button></div>
            </form>
          </div></div>}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Product","Category","Price","Stock","Launch","Actions"].map(h=><th key={h} className={`px-5 py-3 ${h==="Actions"?"text-right":"text-left"} font-montserrat text-xs font-semibold text-slate-gray uppercase`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {products.map(p=><tr key={p.id} className="hover:bg-gray-50">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={getImg(p.image)} className="w-10 h-10 rounded-lg object-contain bg-pale-blue p-1" onError={e=>{e.target.style.display="none"}}/><div><span className="font-montserrat text-sm font-semibold block">{p.name}</span>{p.fabric&&<span className="font-montserrat text-[10px] text-gray-400">{p.fabric}</span>}</div></div></td>
              <td className="px-5 py-4 font-montserrat text-sm text-gray-600">{p.category}</td>
              <td className="px-5 py-4 font-montserrat text-sm font-semibold">${p.price}</td>
              <td className="px-5 py-4"><span className={`font-montserrat text-sm font-medium ${p.stock<=10?"text-red-500":"text-green-600"}`}>{p.stock}</span></td>
              <td className="px-5 py-4 font-montserrat text-xs text-gray-500">{p.launchDate?<span className={new Date(p.launchDate)>new Date()?"text-amber-600 font-medium":"text-green-600"}>{new Date(p.launchDate)>new Date()?"⏰ "+new Date(p.launchDate).toLocaleString():"✓ Launched"}</span>:<span className="text-green-600">Live</span>}</td>
              <td className="px-5 py-4 text-right whitespace-nowrap">
                <button onClick={()=>handleNotifySubscribers(p.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg text-xs" title="Email subscribers">📧</button>
                <button onClick={()=>handleEditProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs">Edit</button>
                <button onClick={()=>handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs">Del</button>
              </td>
            </tr>)}
            {!products.length&&<tr><td colSpan={6} className="px-5 py-12 text-center font-montserrat text-slate-gray">No products.</td></tr>}
          </tbody></table></div>
        </div>}

        {/* ═══ ORDERS ═══ */}
        {activeTab==="orders"&&<div>
          <h2 className="font-palanquin text-xl font-bold mb-6">Orders ({orders.length})</h2>
          {!orders.length?<div className="text-center py-16 font-montserrat text-slate-gray">No orders.</div>:
          <div className="space-y-4">{orders.map(order=>(
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50" onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)}>
                <div><p className="font-montserrat text-sm font-bold">{order.orderNumber||order.id?.slice(0,8)}</p><p className="font-montserrat text-xs text-slate-gray">{new Date(order.createdAt).toLocaleDateString()} • {order.items?.length||0} items</p></div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select value={order.status} onChange={e=>{e.stopPropagation();handleUpdateOrderStatus(order.id,e.target.value)}} onClick={e=>e.stopPropagation()} className={`px-3 py-1.5 rounded-full font-montserrat text-xs font-semibold border-0 cursor-pointer ${statusColors[order.status]||"bg-gray-100"}`}>{statusOptions.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select>
                  <select value={order.paymentStatus||"pending"} onChange={e=>{e.stopPropagation();handleUpdatePaymentStatus(order.id,e.target.value)}} onClick={e=>e.stopPropagation()} className={`px-3 py-1.5 rounded-full font-montserrat text-xs font-semibold border-0 cursor-pointer ${order.paymentStatus==="paid"?"bg-green-100 text-green-700":order.paymentStatus==="failed"?"bg-red-100 text-red-700":"bg-yellow-100 text-yellow-700"}`}>{paymentStatusOptions.map(s=><option key={s} value={s}>💳 {s}</option>)}</select>
                  <span className="font-montserrat text-[10px] text-gray-400">{order.paymentMethod||"cod"}</span>
                  <p className="font-palanquin text-lg font-bold">${order.totalAmount?.toFixed(2)}</p>
                </div>
              </div>
              {expandedOrder===order.id&&<div className="border-t border-gray-100 p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>{order.items?.map((item,i)=><div key={i} className="flex items-center gap-3 py-2"><img src={getImg(item.image)} className="w-8 h-8 rounded object-contain bg-pale-blue p-0.5"/><div className="flex-1"><p className="font-montserrat text-sm">{item.name}</p><p className="font-montserrat text-xs text-slate-gray">{item.quantity} × ${item.price}</p></div><p className="font-montserrat text-sm font-bold">${item.subtotal?.toFixed(2)}</p></div>)}</div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                    <p className="font-montserrat text-sm font-semibold">{order.shippingAddress?.fullName}</p>
                    <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                    <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.phone}</p>
                    <p className="font-montserrat text-sm text-slate-gray">{order.shippingAddress?.email}</p>
                    <p className="font-montserrat text-xs text-slate-gray mt-2">Payment: {order.paymentMethod||"N/A"} — <strong>{order.paymentStatus||"pending"}</strong></p>
                  </div>
                </div>
              </div>}
            </div>
          ))}</div>}
        </div>}

        {/* ═══ BULK ORDERS ═══ */}
        {activeTab==="bulk orders"&&<div>
          <h2 className="font-palanquin text-xl font-bold mb-6">Bulk Order Requests ({bulkOrders.length})</h2>
          {!bulkOrders.length?<div className="text-center py-16 font-montserrat text-slate-gray">No bulk order requests yet.</div>:
          <div className="space-y-4">{bulkOrders.map(bo=>(
            <div key={bo.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50" onClick={()=>setExpandedBulk(expandedBulk===bo.id?null:bo.id)}>
                <div>
                  <p className="font-montserrat text-sm font-bold">{bo.requestNumber}</p>
                  <p className="font-montserrat text-xs text-slate-gray">{bo.customerName} • {bo.businessName||"Individual"} • {new Date(bo.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full font-montserrat text-xs font-semibold ${bo.status==="pending"?"bg-amber-100 text-amber-700":bo.status==="quoted"?"bg-blue-100 text-blue-700":bo.status==="accepted"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{bo.status}</span>
                  <p className="font-montserrat text-sm"><span className="text-slate-gray">Original:</span> <strong>${bo.totalOriginal?.toFixed(2)}</strong></p>
                  {bo.totalBulkPrice!=null&&<p className="font-montserrat text-sm"><span className="text-slate-gray">Bulk:</span> <strong className="text-green-600">${bo.totalBulkPrice?.toFixed(2)}</strong></p>}
                </div>
              </div>
              {expandedBulk===bo.id&&<div className="border-t border-gray-100 p-5">
                {bo.message&&<div className="bg-gray-50 rounded-lg p-3 mb-4"><p className="font-montserrat text-xs text-slate-gray">Customer message:</p><p className="font-montserrat text-sm">{bo.message}</p></div>}
                <p className="font-montserrat text-xs text-slate-gray mb-1">📧 {bo.customerEmail} • 📱 {bo.phone||"—"}</p>
                <table className="w-full mt-3"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left font-montserrat text-xs text-slate-gray">Product</th><th className="px-3 py-2 text-center font-montserrat text-xs text-slate-gray">Qty</th><th className="px-3 py-2 text-right font-montserrat text-xs text-slate-gray">Retail</th><th className="px-3 py-2 text-right font-montserrat text-xs text-slate-gray">Bulk Price</th></tr></thead>
                <tbody>{bo.items.map(item=>(
                  <tr key={item.productId} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-montserrat text-sm">{item.name}{item.fabric&&<span className="text-[10px] text-gray-400 ml-1">({item.fabric})</span>}</td>
                    <td className="px-3 py-2 text-center font-montserrat text-sm font-bold">{item.requestedQuantity}</td>
                    <td className="px-3 py-2 text-right font-montserrat text-sm">${item.originalPrice}</td>
                    <td className="px-3 py-2 text-right">
                      {bo.status==="pending"?
                        <input type="number" min="0" step="0.01" placeholder={item.originalPrice} className="w-24 px-2 py-1 border rounded-lg text-sm text-right" value={bulkQuoteForm[bo.id]?.[item.productId]||""} onChange={e=>setBulkQuoteForm({...bulkQuoteForm,[bo.id]:{...bulkQuoteForm[bo.id],[item.productId]:e.target.value}})}/>
                      :
                        <span className={`font-montserrat text-sm font-bold ${item.bulkPrice<item.originalPrice?"text-green-600":""}`}>${item.bulkPrice||item.originalPrice}</span>
                      }
                    </td>
                  </tr>
                ))}</tbody></table>
                {bo.status==="pending"&&<div className="mt-4 space-y-3">
                  <textarea placeholder="Admin note to customer (optional)" className={inp} rows={2} value={bulkQuoteForm[bo.id]?.adminNote||""} onChange={e=>setBulkQuoteForm({...bulkQuoteForm,[bo.id]:{...bulkQuoteForm[bo.id],adminNote:e.target.value}})}/>
                  <div className="flex gap-3">
                    <button onClick={()=>handleSendBulkQuote(bo.id)} className="bg-coral-red text-white px-6 py-2.5 rounded-xl font-montserrat text-sm font-medium hover:bg-red-500">📧 Send Price Quote to Customer</button>
                    <button onClick={()=>handleBulkOrderStatus(bo.id,"rejected")} className="px-4 py-2.5 border rounded-xl font-montserrat text-sm text-red-500">Reject</button>
                  </div>
                </div>}
                {bo.status==="quoted"&&<div className="mt-4 flex gap-3">
                  <button onClick={()=>handleBulkOrderStatus(bo.id,"accepted")} className="bg-green-500 text-white px-5 py-2 rounded-xl font-montserrat text-sm font-medium">✓ Mark Accepted</button>
                  <button onClick={()=>handleBulkOrderStatus(bo.id,"rejected")} className="px-4 py-2 border rounded-xl font-montserrat text-sm text-red-500">Reject</button>
                </div>}
              </div>}
            </div>
          ))}</div>}
        </div>}

        {/* ═══ SALES ═══ */}
        {activeTab==="sales"&&<div>
          <div className="flex items-center justify-between mb-6"><h2 className="font-palanquin text-xl font-bold">Sales ({sales.length})</h2><button onClick={()=>{resetSaleForm();setShowSaleForm(true)}} className="bg-coral-red text-white font-montserrat text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-500">+ Add Sale</button></div>
          {showSaleForm&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetSaleForm}><div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100"><h3 className="font-palanquin text-xl font-bold">{editingSale?"Edit":"Create"} Sale</h3></div>
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              <select required value={saleForm.productId} onChange={e=>setSaleForm({...saleForm,productId:e.target.value})} className={inp+" bg-white"}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}</select>
              <div className="grid grid-cols-2 gap-4"><input type="number" required min="1" max="90" placeholder="Discount %" value={saleForm.discount} onChange={e=>setSaleForm({...saleForm,discount:e.target.value})} className={inp}/><input type="number" required min="0" step="0.01" placeholder="Sale Price" value={saleForm.salePrice} onChange={e=>setSaleForm({...saleForm,salePrice:e.target.value})} className={inp}/></div>
              <div className="grid grid-cols-2 gap-4"><input placeholder="Tag (e.g. Hot Deal)" value={saleForm.tag} onChange={e=>setSaleForm({...saleForm,tag:e.target.value})} className={inp}/><input type="date" value={saleForm.endsAt} onChange={e=>setSaleForm({...saleForm,endsAt:e.target.value})} className={inp}/></div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium">{editingSale?"Update":"Create & Notify"}</button><button type="button" onClick={resetSaleForm} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button></div>
            </form>
          </div></div>}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Product","Discount","Price","Ends","Status","Actions"].map(h=><th key={h} className={`px-5 py-3 ${h==="Actions"?"text-right":"text-left"} font-montserrat text-xs font-semibold text-slate-gray uppercase`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {sales.map(s=><tr key={s.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-montserrat text-sm font-semibold">{s.product?.name||"?"}</td><td className="px-5 py-4 font-montserrat text-sm font-bold text-coral-red">-{s.discount}%</td><td className="px-5 py-4 font-montserrat text-sm font-semibold">${s.salePrice}</td><td className="px-5 py-4 font-montserrat text-xs text-slate-gray">{s.endsAt?new Date(s.endsAt).toLocaleDateString():"—"}</td><td className="px-5 py-4"><button onClick={()=>handleToggleSale(s)} className={`px-3 py-1 rounded-full font-montserrat text-xs font-semibold ${s.active?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{s.active?"Active":"Off"}</button></td><td className="px-5 py-4 text-right"><button onClick={()=>handleEditSale(s)} className="text-blue-600 text-xs mr-2">Edit</button><button onClick={()=>handleDeleteSale(s.id)} className="text-red-500 text-xs">Del</button></td></tr>)}
            {!sales.length&&<tr><td colSpan={6} className="px-5 py-12 text-center font-montserrat text-slate-gray">No sales.</td></tr>}
          </tbody></table></div>
        </div>}

        {/* ═══ PROMOS ═══ */}
        {activeTab==="promos"&&<div>
          <div className="flex items-center justify-between mb-6"><h2 className="font-palanquin text-xl font-bold">Promos ({promos.length})</h2><button onClick={()=>{resetPromoForm();setShowPromoForm(true)}} className="bg-coral-red text-white font-montserrat text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-500">+ Create</button></div>
          {showPromoForm&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetPromoForm}><div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100"><h3 className="font-palanquin text-xl font-bold">{editingPromo?"Edit":"Create"} Promo</h3></div>
            <form onSubmit={handlePromoSubmit} className="p-6 space-y-4">
              <input required placeholder="CODE" value={promoForm.code} onChange={e=>setPromoForm({...promoForm,code:e.target.value.toUpperCase()})} className={inp+" uppercase"}/>
              <div className="grid grid-cols-2 gap-4"><select value={promoForm.type} onChange={e=>setPromoForm({...promoForm,type:e.target.value})} className={inp+" bg-white"}><option value="percentage">%</option><option value="fixed">$</option></select><input type="number" required min="1" placeholder="Value" value={promoForm.value} onChange={e=>setPromoForm({...promoForm,value:e.target.value})} className={inp}/></div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium">{editingPromo?"Update":"Create"}</button><button type="button" onClick={resetPromoForm} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button></div>
            </form>
          </div></div>}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Code","Value","Status","Actions"].map(h=><th key={h} className={`px-5 py-3 ${h==="Actions"?"text-right":"text-left"} font-montserrat text-xs font-semibold text-slate-gray uppercase`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {promos.map(p=><tr key={p.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-montserrat text-sm font-bold tracking-wider">{p.code}</td><td className="px-5 py-4 font-montserrat text-sm font-bold text-coral-red">{p.type==="percentage"?`${p.value}%`:`$${p.value}`}</td><td className="px-5 py-4"><button onClick={()=>handleTogglePromo(p)} className={`px-3 py-1 rounded-full font-montserrat text-xs font-semibold ${p.active?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{p.active?"Active":"Off"}</button></td><td className="px-5 py-4 text-right"><button onClick={()=>handleEditPromo(p)} className="text-blue-600 text-xs mr-2">Edit</button><button onClick={()=>handleDeletePromo(p.id)} className="text-red-500 text-xs">Del</button></td></tr>)}
            {!promos.length&&<tr><td colSpan={4} className="px-5 py-12 text-center font-montserrat text-slate-gray">No promos.</td></tr>}
          </tbody></table></div>
        </div>}

        {/* ═══ USERS ═══ */}
        {activeTab==="users"&&<div>
          <div className="flex items-center justify-between mb-6"><h2 className="font-palanquin text-xl font-bold">Users ({users.length})</h2><button onClick={()=>{resetUserForm();setShowUserForm(true)}} className="bg-coral-red text-white font-montserrat text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-500">+ Add User</button></div>
          {showUserForm&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetUserForm}><div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100"><h3 className="font-palanquin text-xl font-bold">{editingUser?"Edit":"Add"} User</h3></div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div><label className="block font-montserrat text-sm font-medium mb-1">Name *</label><input required value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} className={inp}/></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">Email *</label><input type="email" required value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} className={inp} disabled={!!editingUser}/></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">{editingUser?"New Password (leave blank to keep)":"Password *"}</label><input type="password" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} className={inp} required={!editingUser}/></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">Role</label><select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})} className={inp+" bg-white"}><option value="customer">Customer</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium">{editingUser?"Update":"Create"}</button><button type="button" onClick={resetUserForm} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button></div>
            </form>
          </div></div>}
          {showEmailModal&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setShowEmailModal(null)}><div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100"><h3 className="font-palanquin text-xl font-bold">📧 Email to {showEmailModal.name}</h3><p className="font-montserrat text-sm text-slate-gray mt-1">{showEmailModal.email}</p></div>
            <div className="p-6 space-y-4">
              <div><label className="block font-montserrat text-sm font-medium mb-1">Subject *</label><input value={emailForm.subject} onChange={e=>setEmailForm({...emailForm,subject:e.target.value})} className={inp} placeholder="e.g. Special offer for you!"/></div>
              <div><label className="block font-montserrat text-sm font-medium mb-1">Message *</label><textarea rows={5} value={emailForm.message} onChange={e=>setEmailForm({...emailForm,message:e.target.value})} className={inp} placeholder="Write your message..."/></div>
              <div className="flex gap-3"><button onClick={handleSendEmail} className="flex-1 bg-coral-red text-white py-3 rounded-xl font-montserrat text-sm font-medium">Send Email</button><button onClick={()=>setShowEmailModal(null)} className="px-6 py-3 border rounded-xl font-montserrat text-sm">Cancel</button></div>
            </div>
          </div></div>}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["User","Email","Role","Joined","Actions"].map(h=><th key={h} className={`px-5 py-3 ${h==="Actions"?"text-right":"text-left"} font-montserrat text-xs font-semibold text-slate-gray uppercase`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {users.map(u=><tr key={u.id} className="hover:bg-gray-50">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-coral-red flex items-center justify-center text-white font-montserrat font-semibold text-sm">{u.name?.charAt(0)?.toUpperCase()}</div><span className="font-montserrat text-sm font-semibold">{u.name}</span></div></td>
              <td className="px-5 py-4 font-montserrat text-sm text-gray-600">{u.email}</td>
              <td className="px-5 py-4"><span className={`px-3 py-1 rounded-full font-montserrat text-xs font-semibold ${u.role==="admin"?"bg-purple-100 text-purple-700":"bg-gray-100 text-gray-600"}`}>{u.role}</span></td>
              <td className="px-5 py-4 font-montserrat text-xs text-slate-gray">{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</td>
              <td className="px-5 py-4 text-right space-x-1">
                <button onClick={()=>{setShowEmailModal(u);setEmailForm({subject:"",message:""})}} className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium">📧</button>
                <button onClick={()=>handleEditUser(u)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs">Edit</button>
                {u.role!=="admin"&&<button onClick={()=>handleDeleteUser(u.id)} className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-xs">Del</button>}
              </td>
            </tr>)}
            {!users.length&&<tr><td colSpan={5} className="px-5 py-12 text-center font-montserrat text-slate-gray">No users.</td></tr>}
          </tbody></table></div>
        </div>}

        {/* ═══ SUBSCRIBERS ═══ */}
        {activeTab==="subscribers"&&<div>
          <h2 className="font-palanquin text-xl font-bold mb-6">Subscribers ({subscribers.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{["Email","Date","Remove"].map(h=><th key={h} className={`px-5 py-3 ${h==="Remove"?"text-right":"text-left"} font-montserrat text-xs font-semibold text-slate-gray uppercase`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {subscribers.map(s=><tr key={s.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-montserrat text-sm">{s.email}</td><td className="px-5 py-4 font-montserrat text-sm text-slate-gray">{s.subscribedAt?new Date(s.subscribedAt).toLocaleDateString():"—"}</td><td className="px-5 py-4 text-right"><button onClick={()=>handleDeleteSubscriber(s.id)} className="text-red-500 text-xs">Remove</button></td></tr>)}
            {!subscribers.length&&<tr><td colSpan={3} className="px-5 py-12 text-center font-montserrat text-slate-gray">No subscribers.</td></tr>}
          </tbody></table></div>
        </div>}

        {/* ═══ SETTINGS ═══ */}
        {activeTab==="settings"&&siteSettings&&<div className="max-w-3xl">
          <h2 className="font-palanquin text-xl font-bold mb-6">Settings</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6"><div className="flex items-center justify-between"><div><h3 className="font-palanquin text-lg font-bold">Site Status</h3><p className="font-montserrat text-sm text-slate-gray mt-1">Toggle on/off</p></div><div className="flex items-center gap-3"><button onClick={handleToggleSite} disabled={togglingsite} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${settingsForm.siteEnabled?"bg-green-500":"bg-red-500"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${settingsForm.siteEnabled?"translate-x-9":"translate-x-1"}`}/></button><span className={`font-montserrat text-sm font-bold ${settingsForm.siteEnabled?"text-green-600":"text-red-500"}`}>{settingsForm.siteEnabled?"LIVE":"OFF"}</span></div></div></div>

            {/* Category Management */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-palanquin text-lg font-bold mb-4">Product Categories</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(c=>(
                  <span key={c} className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full font-montserrat text-sm">
                    {c}
                    <button onClick={()=>handleRemoveCategory(c)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="New category name" value={newCategory} onChange={e=>setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),handleAddCategory())} className={inp+" flex-1"}/>
                <button onClick={handleAddCategory} className="bg-coral-red text-white px-4 py-2 rounded-xl font-montserrat text-sm font-medium hover:bg-red-500">+ Add</button>
              </div>
              <p className="font-montserrat text-xs text-gray-400 mt-2">Categories are saved when you click "Save All" below.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="font-palanquin text-lg font-bold mb-4">Maintenance Message</h3><textarea rows={3} value={settingsForm.maintenanceMessage||""} onChange={e=>setSettingsForm({...settingsForm,maintenanceMessage:e.target.value})} className={inp}/></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="font-palanquin text-lg font-bold mb-4">Homepage</h3><div className="space-y-4"><input placeholder="Tagline" value={settingsForm.heroTagline||""} onChange={e=>setSettingsForm({...settingsForm,heroTagline:e.target.value})} className={inp}/><input placeholder="Title" value={settingsForm.heroTitle||""} onChange={e=>setSettingsForm({...settingsForm,heroTitle:e.target.value})} className={inp}/><textarea rows={2} placeholder="Subtitle" value={settingsForm.heroSubtitle||""} onChange={e=>setSettingsForm({...settingsForm,heroSubtitle:e.target.value})} className={inp}/></div></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="font-palanquin text-lg font-bold mb-4">Privacy Policy (HTML)</h3><textarea rows={8} value={settingsForm.privacyPolicy||""} onChange={e=>setSettingsForm({...settingsForm,privacyPolicy:e.target.value})} className={inp+" font-mono"}/></div>
            <button onClick={handleSaveSettings} className="bg-coral-red text-white font-montserrat text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-500">Save All</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
