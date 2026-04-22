import JsonDB from "../utils/db.js";
const db = new JsonDB("bulkorders");

export default {
  getAll: () => db.readAll(),
  getById: (id) => db.findById(id),
  getByUserId: (userId) => db.readAll().filter((o) => o.userId === userId),
  getPending: () => db.readAll().filter((o) => o.status === "pending"),
  create: (order) => db.create(order),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
};
