import JsonDB from "../utils/db.js";
const db = new JsonDB("subscribers");

export default {
  getAll: () => db.readAll(),
  create: (sub) => db.create(sub),
  getByEmail: (email) => db.readAll().find((s) => s.email === email) || null,
  delete: (id) => db.delete(id),
};
