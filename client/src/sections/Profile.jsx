import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";

/* ─── Toast Component ─── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className="fixed top-6 right-6 z-[100]"
      style={{ animation: "slideIn 0.35s ease-out" }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div
        className={`${colors[type]} text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[420px]`}
      >
        <span className="flex-shrink-0">{icons[type]}</span>
        <p className="font-montserrat text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showToast("Please fill in all fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(loginForm);
      const { data, token } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setIsLoggedIn(true);
      showToast(`Welcome back, ${data.name}!`, "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid email or password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (registerForm.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });
      const { data, token } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setIsLoggedIn(true);
      showToast("Account created successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setLoginForm({ email: "", password: "" });
    showToast("You have been signed out", "info");
  };

  // ─── LOGGED IN VIEW ───
  if (isLoggedIn && user) {
    return (
      <section className="pt-28 padding-x pb-16 max-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-coral-red h-32 relative">
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                  <span className="font-palanquin text-3xl font-bold text-coral-red">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8">
              <div className="mb-6">
                <h1 className="font-palanquin text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="font-montserrat text-slate-gray mt-1">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 font-montserrat text-xs font-medium rounded-full capitalize">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <button onClick={() => navigate("/products")} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-coral-red hover:bg-red-50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-coral-red flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-montserrat font-semibold text-sm text-gray-900">Browse Products</p>
                    <p className="font-montserrat text-xs text-slate-gray">Explore our collection</p>
                  </div>
                </button>

                <button onClick={() => navigate("/sales")} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-coral-red hover:bg-red-50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-coral-red flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-montserrat font-semibold text-sm text-gray-900">View Sales</p>
                    <p className="font-montserrat text-xs text-slate-gray">Check latest deals</p>
                  </div>
                </button>

                {user.role === "admin" && (
                  <button onClick={() => navigate("/admin")} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-coral-red hover:bg-red-50 transition-all group sm:col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-coral-red flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-montserrat font-semibold text-sm text-gray-900">Admin Dashboard</p>
                      <p className="font-montserrat text-xs text-slate-gray">Manage store & products</p>
                    </div>
                  </button>
                )}
              </div>

              <button onClick={handleLogout} className="mt-8 w-full py-3 border-2 border-gray-200 rounded-xl font-montserrat text-sm font-medium text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── LOGIN / REGISTER VIEW ───
  return (
    <section className="pt-28 padding-x pb-16 max-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-md mx-auto">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-3 rounded-lg font-montserrat text-sm font-medium transition-all ${
              activeTab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-slate-gray hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-3 rounded-lg font-montserrat text-sm font-medium transition-all ${
              activeTab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-slate-gray hover:text-gray-700"
            }`}
          >
            Create Account
          </button>
        </div>

        {activeTab === "login" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="font-palanquin text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="font-montserrat text-slate-gray text-sm mb-8">Sign in to your xsow account</p>
            <div className="space-y-5">
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <button onClick={handleLogin} disabled={loading} className="w-full bg-coral-red text-white font-montserrat text-sm font-medium py-3.5 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
            <p className="text-center font-montserrat text-sm text-slate-gray mt-6">
              Don't have an account?{" "}
              <button onClick={() => setActiveTab("register")} className="text-coral-red font-medium hover:underline">Create one</button>
            </p>
          </div>
        )}

        {activeTab === "register" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="font-palanquin text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="font-montserrat text-slate-gray text-sm mb-8">Join xsow for the best shoe deals</p>
            <div className="space-y-5">
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Min 6 characters" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <div>
                <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-coral-red/30 focus:border-coral-red transition-all" />
              </div>
              <button onClick={handleRegister} disabled={loading} className="w-full bg-coral-red text-white font-montserrat text-sm font-medium py-3.5 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
            <p className="text-center font-montserrat text-sm text-slate-gray mt-6">
              Already have an account?{" "}
              <button onClick={() => setActiveTab("login")} className="text-coral-red font-medium hover:underline">Sign in</button>
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;