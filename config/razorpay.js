const Razorpay = require("razorpay");
const PaymentGateway = require("../models/PaymentGateway");

const getRazorpayInstance = async () => {
  try {
      // DB se Razorpay gateway fetch karo
      const gateway = await PaymentGateway.findOne({
        name: { $regex: /^razorpay$/i }
      });


  if (!gateway || !gateway.clientId || !gateway.secretKey) {
    throw new Error("Razorpay keys not configured in PaymentGateway");
  }

    return new Razorpay({
      key_id: gateway.clientId,
      key_secret: gateway.secretKey,
    });
  } catch (error) {
    console.error("Razorpay initialization error:", error);
    throw error;
  }
};

module.exports = getRazorpayInstance;