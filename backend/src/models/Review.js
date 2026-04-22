import JsonDB from "../utils/db.js";
const db = new JsonDB("reviews");

export default {
  getAll: () => db.readAll(),
  getByProductId: (productId) =>
    db.readAll().filter((r) => r.productId === productId),
  create: (review) => db.create(review),
  delete: (id) => db.delete(id),
};
