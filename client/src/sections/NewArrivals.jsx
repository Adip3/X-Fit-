import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsAPI, cartAPI } from "../api";

const NewArrivals = ({ fullPage }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(null);
  useEffect(() => {
    productsAPI.getAll().then(r => { const sorted = [...(r.data.data||[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); setProducts(fullPage?sorted:sorted.slice(0,4)); }).catch(()=>{}).finally(()=>setLoading(false));
  }, [fullPage]);
  const handleAdd = async (p) => { if(!localStorage.getItem("token")){window.location.href="/profile";return;} setAddedToCart(p.id); try{await cartAPI.add({productId:p.id,quantity:1})}catch{} setTimeout(()=>setAddedToCart(null),1500); };
  const img = (i) => (!i?"":i.startsWith("http")?i:`http://localhost:5001${i}`);
  if(loading) return <section className={`${fullPage?"pt-28 padding-x pb-16":""} max-container`}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i=><div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden"><div className="h-56 bg-gray-100 animate-pulse"/><div className="p-5 space-y-3"><div className="h-5 w-32 bg-gray-200 rounded animate-pulse"/></div></div>)}</div></section>;
  if(!products.length) return null;
  return (
    <section className={`${fullPage?"pt-28 padding-x pb-16":""} max-container`}>
      <div className="flex items-end justify-between mb-10">
        <div><h2 className="font-palanquin text-4xl font-bold">New <span className="text-coral-red">Arrivals</span></h2><p className="font-montserrat text-slate-gray mt-2">Fresh styles just dropped</p></div>
        {!fullPage&&<Link to="/new-arrivals" className="hidden md:flex items-center gap-2 font-montserrat text-sm font-medium text-coral-red hover:underline">View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(p=>(
          <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <Link to={`/product/${p.id}`} className="relative bg-pale-blue p-6 flex items-center justify-center h-56 overflow-hidden block">
              <span className="absolute top-3 left-3 bg-green-500 text-white font-montserrat text-[10px] font-bold px-2.5 py-1 rounded-full">NEW</span>
              <img src={img(p.image)} alt={p.name} className="w-40 h-40 object-contain group-hover:scale-110 transition-transform duration-700" onError={e=>{e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='%23ddd'%3E%3Crect width='160' height='160' rx='16'/%3E%3C/svg%3E"}}/>
            </Link>
            <div className="p-5">
              <span className="font-montserrat text-[10px] text-coral-red font-semibold uppercase tracking-widest">{p.category}</span>
              <Link to={`/product/${p.id}`}><h3 className="font-palanquin text-lg font-bold mt-1 text-gray-900 group-hover:text-coral-red transition-colors truncate">{p.name}</h3></Link>
              <div className="flex items-center justify-between mt-3">
                <p className="font-palanquin text-xl font-bold text-gray-900">${p.price}</p>
                <button onClick={()=>handleAdd(p)} disabled={p.stock===0} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-montserrat text-xs font-medium transition-all ${addedToCart===p.id?"bg-green-500 text-white":p.stock===0?"bg-gray-200 text-gray-400":"bg-gray-900 text-white hover:bg-coral-red"}`}>
                  {addedToCart===p.id?"✓ Added":p.stock===0?"Sold Out":"+ Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!fullPage&&<div className="mt-8 text-center md:hidden"><Link to="/new-arrivals" className="font-montserrat text-sm font-medium text-coral-red hover:underline">View All →</Link></div>}
    </section>
  );
};
export default NewArrivals;
