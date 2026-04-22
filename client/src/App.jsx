import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { CustomerReviews, Footer, PopularProducts, Hero, Services, SpecialOffer, Subscribe, SuperQuality } from "./sections";
import Nav from "./Components/Nav";
import ChatBot from "./Components/ChatBot";
import AdminDashboard from "./Components/AdminDashboard";
import ProductCatalog from "./sections/ProductCatalog";
import ProductDetail from "./sections/ProductDetail";
import AboutUs from "./sections/AboutUs";
import Sales from "./sections/Sales";
import Profile from "./sections/Profile";
import Cart from "./sections/Cart";
import Checkout from "./sections/Checkout";
import Orders from "./sections/Orders";
import PrivacyPolicy from "./sections/PrivacyPolicy";
import NewArrivals from "./sections/NewArrivals";
import TopSelling from "./sections/TopSelling";
import BulkOrders from "./sections/BulkOrders";
import PaymentSuccess from "./sections/PaymentSuccess";
import PaymentFailure from "./sections/PaymentFailure";
import MaintenancePage from "./Components/MaintenancePage";
import { ToastProvider } from "./Components/Toast";
import { settingsAPI } from "./api";

const PageWrapper = ({ children }) => (
  <main className="relative">
    <Nav />
    {children}
    <section className="bg-black padding-x padding-t pb-8"><Footer /></section>
  </main>
);

const App = () => {
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic()
      .then((res) => { const s = res.data.data; setSiteEnabled(s.siteEnabled); setMaintenanceMessage(s.maintenanceMessage); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-coral-red border-t-transparent rounded-full animate-spin" /></div>;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const isMaintenance = !siteEnabled && !isAdmin;

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {isMaintenance ? (
          <Route path="*" element={<MaintenancePage message={maintenanceMessage} />} />
        ) : (<>
          <Route path="/" element={
            <main className="relative">
              <Nav />
              <section className="xl:padding-l wide:padding-r padding-b"><Hero /></section>
              <section className="padding"><PopularProducts /></section>
              <section className="padding bg-pale-blue/30"><NewArrivals /></section>
              <section className="padding"><TopSelling /></section>
              <section className="padding"><SuperQuality /></section>
              <section className="padding-x py-10"><Services /></section>
              <section className="bg-pale-blue padding"><SpecialOffer /></section>
              <section className="bg-pale-blue padding"><CustomerReviews /></section>
              <section className="padding-x sm:py-32 py-16 w-full"><Subscribe /></section>
              <section className="bg-black padding-x padding-t pb-8"><Footer /></section>
            </main>
          } />
          <Route path="/products" element={<PageWrapper><ProductCatalog /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/sales" element={<PageWrapper><Sales /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
          <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />
          <Route path="/bulk-orders" element={<PageWrapper><BulkOrders /></PageWrapper>} />
          <Route path="/payment/success" element={<PageWrapper><PaymentSuccess /></PageWrapper>} />
          <Route path="/payment/failure" element={<PageWrapper><PaymentFailure /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="/about-us" element={<PageWrapper><AboutUs /></PageWrapper>} />
          <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/new-arrivals" element={<PageWrapper><NewArrivals fullPage /></PageWrapper>} />
          <Route path="/top-selling" element={<PageWrapper><TopSelling fullPage /></PageWrapper>} />
        </>)}
      </Routes>
      {!isMaintenance && <ChatBot />}
    </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
