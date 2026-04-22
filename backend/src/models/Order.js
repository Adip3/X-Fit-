import JsonDB from "../utils/db.js";
const db = new JsonDB("orders");

export default {
  getAll: () => db.readAll(),
  getById: (id) => db.findById(id),
  getByUserId: (userId) => db.readAll().filter((o) => o.userId === userId),
  create: (order) => db.create(order),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
};
