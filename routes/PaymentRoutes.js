import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";

const router = express.Router();

// Buy Subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

// verify payment and save refrence in database
router.route("/paymentverification").post(isAuthenticated, paymentVerification);

// get razerpay key
router.route("/razorpaykey").get(getRazorPayKey);

// cancle subscription
router.route("/subscribe/cancle").delete(isAuthenticated,cancelSubscription)
export default router;

