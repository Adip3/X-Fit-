import JsonDB from "../utils/db.js";
const db = new JsonDB("products");

export default {
  // Returns ALL products (including hidden/scheduled) — for admin use
  getAll: () => db.readAll(),
  // Returns only visible/launched products — for public-facing endpoints
  getVisible: () => {
    const now = new Date();
    return db.readAll().filter((p) => {
      if (p.isVisible === false) return false;
      if (p.launchDate && new Date(p.launchDate) > now) return false;
      return true;
    });
  },
  getById: (id) => db.findById(id),
  create: (product) => db.create(product),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
  getFeatured: () => db.readAll().filter((p) => p.featured),
  getByCategory: (cat) =>
    db.readAll().filter((p) => p.category && p.category.toLowerCase() === cat.toLowerCase()),
  // Get upcoming scheduled launches
  getScheduled: () => {
    const now = new Date();
    return db.readAll().filter((p) => p.launchDate && new Date(p.launchDate) > now);
  },
  // Auto-publish products whose launch time has passed
  publishScheduled: () => {
    const now = new Date();
    const all = db.readAll();
    let published = 0;
    all.forEach((p) => {
      if (p.launchDate && new Date(p.launchDate) <= now && p.isVisible === false) {
        db.update(p.id, { isVisible: true });
        published++;
      }
    });
    return published;
  },
};
