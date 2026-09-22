const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    gateway: { type: String, required: true }, // Razorpay / Stripe / PayPal
    transactionId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    
     totals: {
      totalAmount: { type: Number }, 
      totalCharge: { type: Number } 
    },

    status: {
      type: String,
      enum: ["open", "success", "failed"],
      default: ""
    },
    

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true
    },

    billingType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
