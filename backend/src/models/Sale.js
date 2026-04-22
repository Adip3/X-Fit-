import JsonDB from "../utils/db.js";
const db = new JsonDB("sales");

export default {
  getAll: () => db.readAll(),
  getActive: () => db.readAll().filter((s) => s.active && new Date(s.endsAt) > new Date()),
  getById: (id) => db.findById(id),
  create: (sale) => db.create(sale),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
};
