import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, "..", "data", "settings.json");

const defaults = {
  siteEnabled: true,
  maintenanceMessage: "We're currently updating our store. Please check back soon!",
  privacyPolicy: `<h2>Privacy Policy for xsow</h2><p><strong>Last updated:</strong> January 2026</p><h3>1. Information We Collect</h3><p>We collect information you provide directly, such as when you create an account, make a purchase, or subscribe to our newsletter.</p><h3>2. How We Use Your Information</h3><p>We use information to process transactions, send order confirmations, respond to requests, and improve our services.</p><h3>3. Data Security</h3><p>We implement security measures to protect your personal information.</p><h3>4. Contact Us</h3><p>Contact us at customer@xsow.com.</p>`,
  heroTitle: "The New Arrival",
  heroBrand: "xsow",
  heroSubtitle: "Discover stylish xsow arrivals, quality comfort, and innovation for your active life.",
  heroTagline: "Our Summer Collection",
  categories: ["Running", "Casual", "Hiking", "Sports", "Formal", "Clothes"],
};

function read() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) }; }
  catch { return { ...defaults }; }
}

function write(settings) {
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8"); return true; }
  catch { return false; }
}

export default {
  get: () => read(),
  update: (updates) => { const m = { ...read(), ...updates }; write(m); return m; },
  isEnabled: () => read().siteEnabled,
};
