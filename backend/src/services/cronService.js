import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

export function startSaleExpiryChecker() {
  const checkExpiry = () => {
    try {
      const sales = Sale.getAll();
      const now = new Date();
      let expired = 0;
      sales.forEach(sale => {
        if (sale.active && sale.endsAt) {
          const endDate = new Date(sale.endsAt);
          endDate.setHours(23, 59, 59, 999);
          if (now > endDate) {
            Sale.update(sale.id, { active: false });
            expired++;
            console.log(`🕐 Sale auto-expired: ${sale.id} (ended ${sale.endsAt})`);
          }
        }
      });
      if (expired > 0) console.log(`⏰ Auto-expired ${expired} sale(s)`);
    } catch (err) {
      console.error("❌ Sale expiry check failed:", err.message);
    }
  };

  const checkScheduledLaunches = () => {
    try {
      const published = Product.publishScheduled();
      if (published > 0) {
        console.log(`🚀 Auto-launched ${published} scheduled product(s)`);
      }
    } catch (err) {
      console.error("❌ Scheduled launch check failed:", err.message);
    }
  };

  checkExpiry();
  checkScheduledLaunches();
  // Check every minute for scheduled launches (for precise timing)
  setInterval(checkScheduledLaunches, 60 * 1000);
  // Check every 10 minutes for sale expiry
  setInterval(checkExpiry, 10 * 60 * 1000);
  console.log("⏰ Sale auto-expire checker started (every 10 min)");
  console.log("🚀 Scheduled product launch checker started (every 1 min)");
}
