import JsonDB from "../utils/db.js";
const db = new JsonDB("promos");

export default {
  getAll: () => db.readAll(),
  getById: (id) => db.findById(id),
  getByCode: (code) => db.readAll().find((p) => p.code.toUpperCase() === code.toUpperCase()) || null,
  create: (promo) => db.create(promo),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
};
