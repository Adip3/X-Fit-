import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsAPI, cartAPI } from "../api";

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [addedToCart, setAddedToCart] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getAll();
        setProducts(res.data.data || []);
      } catch (err) {
        setError("Failed to load products. Make sure the backend is running.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Extract unique categories
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  // Filter & sort
  const filteredProducts = products
    .filter((product) => {
      const text = searchTerm.toLowerCase();
      const matchesSearch =
        product.name?.toLowerCase().includes(text) ||
        product.description?.toLowerCase().includes(text);
      const matchesCategory =
        selectedCategory === "all" ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const handleAddToCart = async (product) => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/profile";
      return;
    }
    setAddedToCart(product.id);
    try {
      await cartAPI.add({ productId: product.id, quantity: 1 });
    } catch (err) {
      console.error("Cart error:", err);
    }
    setTimeout(() => setAddedToCart(null), 1500);
  };
  // ─── LOADING STATE ───
  if (loading) {
    return (
      <section className="pt-28 padding-x pb-16 max-container">
        <div className="mb-10">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-64 bg-gray-100 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─── ERROR STATE ───
  if (error) {
    return (
      <section className="pt-28 padding-x pb-16 max-container">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-coral-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-palanquin text-2xl font-bold text-gray-900 mb-2">Unable to Load Products</h3>
          <p className="font-montserrat text-slate-gray mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 padding-x pb-16 max-container">
      {/* Toast */}
      {addedToCart && (
        <div className="fixed top-6 right-6 z-[100]" style={{ animation: "slideIn 0.3s ease-out" }}>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div className="bg-green-500 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-montserrat text-sm font-medium">Added to cart!</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-palanquin text-4xl md:text-5xl font-bold text-gray-900">
          Our <span className="text-coral-red">Products</span>
        </h1>
        <p className="font-montserrat text-slate-gray mt-3 text-lg">
          {products.length} premium shoes crafted for comfort and style
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-10">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-gray"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search shoes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red transition-all"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-coral-red/20 focus:border-coral-red bg-white cursor-pointer min-w-[160px]"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-montserrat text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-coral-red text-white shadow-md shadow-coral-red/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-montserrat text-sm text-slate-gray">
          Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span>{" "}
          {filteredProducts.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-black/8 transition-all duration-500 hover:-translate-y-1.5"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Image */}
            <Link to={`/product/${product.id}`} className="relative bg-pale-blue p-8 flex items-center justify-center h-72 overflow-hidden block">
              {/* Stock badge */}
              {product.stock <= 10 && product.stock > 0 && (
                <span className="absolute top-4 left-4 bg-amber-500 text-white font-montserrat text-[11px] font-bold px-3 py-1 rounded-full">
                  Only {product.stock} left
                </span>
              )}
              {product.stock === 0 && (
                <span className="absolute top-4 left-4 bg-gray-800 text-white font-montserrat text-[11px] font-bold px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              )}

              {/* Featured badge */}
              {product.featured && (
                <span className="absolute top-4 right-4 bg-coral-red text-white font-montserrat text-[11px] font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              )}

              {/* Rating */}
              {product.rating > 0 && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-montserrat text-xs font-semibold text-gray-700">{product.rating}</span>
                </div>
              )}

              <img
                src={`http://localhost:5001${product.image}`}
                alt={product.name}
                className="w-52 h-52 object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.src = product.image;
                  e.target.onerror = () => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23ddd'%3E%3Crect width='200' height='200' rx='16'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                  };
                }}
              />
            </Link>

            {/* Info */}
            <div className="p-6">
              {/* Category */}
              <span className="font-montserrat text-[11px] text-coral-red font-semibold uppercase tracking-widest">
                {product.category}
              </span>

              {/* Name */}
              <Link to={`/product/${product.id}`}><h3 className="font-palanquin text-xl font-bold mt-1.5 mb-2 text-gray-900 leading-tight group-hover:text-coral-red transition-colors duration-300">
                {product.name}
              </h3></Link>

              {/* Description */}
              {product.description && (
                <p className="font-montserrat text-sm text-slate-gray leading-relaxed mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Price + Add to Cart */}
              <div className="flex items-end justify-between mt-auto pt-2">
                <div>
                  <p className="font-montserrat text-xs text-slate-gray">Price</p>
                  <p className="font-palanquin text-2xl font-bold text-gray-900">
                    ${product.price}
                  </p>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-montserrat text-sm font-medium transition-all duration-300 ${
                    addedToCart === product.id
                      ? "bg-green-500 text-white"
                      : product.stock === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-coral-red hover:shadow-lg hover:shadow-coral-red/25"
                  }`}
                >
                  {addedToCart === product.id ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-palanquin text-xl font-bold text-gray-900 mb-2">No products found</h3>
          <p className="font-montserrat text-slate-gray mb-6">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="font-montserrat text-sm text-coral-red font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductCatalog;