import JsonDB from "../utils/db.js";
const db = new JsonDB("users");

export default {
  getAll: () => db.readAll(),
  getById: (id) => db.findById(id),
  getByEmail: (email) => db.readAll().find((u) => u.email === email) || null,
  create: (user) => db.create(user),
  update: (id, data) => db.update(id, data),
  delete: (id) => db.delete(id),
};
