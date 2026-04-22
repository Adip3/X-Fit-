import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsAPI } from "../api";

const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { productsAPI.getAll({ featured: "true" }).then(r=>setProducts((r.data.data||[]).slice(0,4))).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  const img = (i) => (!i?"":i.startsWith("http")?i:`http://localhost:5001${i}`);
  if(loading||!products.length) return null;
  return (
    <section id="products" className="max-container max-sm:mt-12">
      <div className="flex flex-col justify-start gap-5">
        <h2 className="text-4xl font-palanquin font-bold">Our <span className="text-coral-red">Popular</span> Products</h2>
        <p className="lg:max-w-lg mt-2 font-montserrat text-slate-gray">Experience top-notch quality and style with our sought-after selections.</p>
      </div>
      <div className="mt-16 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 sm:gap-4 gap-14 mx-auto">
        {products.map(p=>(
          <Link to={`/product/${p.id}`} key={p.id} className="flex flex-1 flex-col max-sm:items-center w-full group">
            <div className="bg-pale-blue rounded-xl p-4 flex items-center justify-center">
              <img src={img(p.image)} alt={p.name} className="w-[280px] h-[280px] object-contain group-hover:scale-105 transition-transform duration-500" onError={e=>{e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' fill='%23ddd'%3E%3Crect width='280' height='280' rx='16'/%3E%3C/svg%3E"}}/>
            </div>
            <div className="mt-8 flex justify-start gap-2.5">
              <svg className="w-6 h-6 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <p className="font-montserrat text-xl leading-normal text-slate-gray">({p.rating||"4.5"})</p>
            </div>
            <h3 className="mt-2 text-2xl leading-normal font-semibold font-palanquin group-hover:text-coral-red transition-colors">{p.name}</h3>
            <p className="mt-2 font-semibold font-montserrat text-coral-red text-2xl leading-normal">${p.price}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
export default PopularProducts;
