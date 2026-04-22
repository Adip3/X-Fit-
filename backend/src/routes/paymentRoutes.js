import express from "express";
import { initiatePayment, verifyPayment, getPaymentMethods, getInvoice, emailInvoice, esewaPayPage, khaltiPayPage, cardPayPage } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/methods", getPaymentMethods);
router.post("/initiate", authenticate, initiatePayment);
router.post("/verify", authenticate, verifyPayment);
router.get("/invoice/:id", authenticate, getInvoice);
router.post("/invoice/:id/email", authenticate, emailInvoice);

export default router;
export { esewaPayPage, khaltiPayPage, cardPayPage };
