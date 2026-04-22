import JsonDB from "../utils/db.js";
const db = new JsonDB("carts");

export default {
  getAll: () => db.readAll(),
  getByUserId: (userId) => db.readAll().find((c) => c.userId === userId) || null,
  create: (cart) => db.create(cart),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
  deleteByUserId: (userId) => {
    const carts = db.readAll();
    const filtered = carts.filter((c) => c.userId !== userId);
    db.writeAll(filtered);
    return true;
  },
};
