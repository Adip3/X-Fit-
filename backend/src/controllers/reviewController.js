import Review from "../models/Review.js";
import { v4 as uuidv4 } from "uuid";

export const getProductReviews = (req, res) => {
  const reviews = Review.getByProductId(req.params.productId);
  res.json({ success: true, data: reviews });
};

export const createReview = (req, res) => {
  try {
    const review = {
      id: uuidv4(),
      productId: req.params.productId,
      userId: req.user.id,
      userName: req.body.userName || "Anonymous",
      rating: parseInt(req.body.rating),
      comment: req.body.comment,
      createdAt: new Date().toISOString(),
    };
    Review.create(review);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
