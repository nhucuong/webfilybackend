const mongoose = require("mongoose");

const paymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // 🔥 Common reusable fields
    clientId: {
      type: String, // Paypal clientId / Razorpay keyId / Braintree merchantId / Payhere merchantId
      default: null
    },

    secretKey: {
      type: String, // Stripe / Paypal / Razorpay / Payhere
      default: null
    },

    // 🔥 Only for Braintree
    publicKey: {
      type: String,
      default: null
    },
    privateKey: {
      type: String,
      default: null
    },

    // 🔹 Common Fields
    webhookUrl: {
      type: String,
      required: true,
      trim: true
    },

    fixedCharge: {
      type: Number,
      required: true,
      default: 0
    },

    iconName: {
      type: String,
      required: true,
      trim: true
    },

    enabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentGateway", paymentGatewaySchema);