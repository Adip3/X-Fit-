import { useState, useEffect, useRef } from "react";
import headerLogo from "../assets/images/sow.png";
import { hamburger } from "../assets/icons";
import { navLinks } from "../constants";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cartAPI } from "../api";

const Nav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsLoggedIn(true);
      try { setUser(JSON.parse(userData)); } catch { setUser(null); }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setCartCount(0);
    }
  }, [location]);

  // Fetch cart count
  useEffect(() => {
    if (!isLoggedIn) return;
    cartAPI.get().then((res) => {
      const items = res.data?.data?.items || [];
      setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
    }).catch(() => {});
  }, [isLoggedIn, location]);

  // Scroll listener for background change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setProfileDropdown(false);
    navigate("/");
  };

  const isActive = (href) => location.pathname === href;

  return (
    <header
      className={`padding-x py-5 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-8"
      }`}
    >
      <nav className="flex justify-between items-center max-container">
        <Link to="/">
          <img src={headerLogo} alt="xsow Logo" width={130} height={29} />
        </Link>

        <ul className="flex-1 flex justify-center items-center gap-12 max-lg:hidden">
          {navLinks.map((item) => (
            <li key={item.label}>
              <Link
                to={item.href}
                className={`font-montserrat leading-normal text-lg transition-all duration-300 ${
                  isActive(item.href)
                    ? "text-coral-red font-semibold"
                    : "text-slate-gray hover:text-coral-red"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5 max-lg:hidden">
          {/* Cart Icon */}
          <Link to="/cart" className="relative group">
            <svg className="w-6 h-6 text-slate-gray group-hover:text-coral-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-coral-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </Link>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-coral-red flex items-center justify-center text-white font-montserrat font-semibold text-sm transition-transform duration-200 group-hover:scale-110">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="font-montserrat text-sm text-slate-gray group-hover:text-coral-red transition-colors">
                  {user?.name || "Profile"}
                </span>
                <svg className={`w-4 h-4 text-slate-gray transition-transform duration-200 ${profileDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdown && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-montserrat font-semibold text-sm text-gray-900">{user?.name}</p>
                    <p className="font-montserrat text-xs text-slate-gray mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setProfileDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 font-montserrat text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setProfileDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 font-montserrat text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    My Orders
                  </Link>
                  <Link to="/bulk-orders" onClick={() => setProfileDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 font-montserrat text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Bulk Orders
                  </Link>
                  {user?.role === "admin" && (
                    <Link to="/admin/dashboard" onClick={() => setProfileDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 font-montserrat text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Admin Panel
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 font-montserrat text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/profile" className="flex items-center gap-2 font-montserrat text-lg text-slate-gray hover:text-coral-red transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Sign In
            </Link>
          )}
        </div>

        <div className="hidden max-lg:block cursor-pointer" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <img src={hamburger} alt="Menu" width={25} height={25} />
        </div>
      </nav>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <span className="font-montserrat font-bold text-lg text-gray-900">Menu</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {isLoggedIn && user && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-coral-red flex items-center justify-center text-white font-montserrat font-semibold">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div>
                <p className="font-montserrat font-semibold text-sm text-gray-900">{user.name}</p>
                <p className="font-montserrat text-xs text-slate-gray">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <ul className="p-6 space-y-1">
          {navLinks.map((item) => (
            <li key={item.label}>
              <Link to={item.href} onClick={() => setMobileMenuOpen(false)} className={`block py-3 px-4 rounded-lg font-montserrat text-base transition-all ${isActive(item.href) ? "text-coral-red bg-red-50 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>{item.label}</Link>
            </li>
          ))}
          <hr className="my-3 border-gray-100" />
          {isLoggedIn ? (
            <>
              <li><Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg font-montserrat text-base text-gray-700 hover:bg-gray-50">My Profile</Link></li>
              {user?.role === "admin" && <li><Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg font-montserrat text-base text-gray-700 hover:bg-gray-50">Admin Panel</Link></li>}
              <li><button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left py-3 px-4 rounded-lg font-montserrat text-base text-red-500 hover:bg-red-50">Sign Out</button></li>
            </>
          ) : (
            <li><Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg font-montserrat text-base text-coral-red font-semibold hover:bg-red-50">Sign In / Register</Link></li>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Nav;