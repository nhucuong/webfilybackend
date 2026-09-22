const getStripe = require("../config/stripe");
const paypal = require("@paypal/checkout-server-sdk");
const { getPayPalClient } = require("../config/paypal");
const gateway = require("../config/braintree");
const config = require("../config/payhere");
const Payment = require("../models/Payment");
const PricingPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const getRazorpayInstance = require("../config/razorpay");


// stripe payment creation
const createStripePayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  try {
    const { stripe } = await getStripe(); //  DB se secret key      

    const plan = await PricingPlan.findById(productId);
    if (!plan) {
      throw new Error("Pricing plan not found");
    }

    const totalPayable = Number(amount) + Number(charge);
    const stripeAmount = Math.round(totalPayable * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${plan.name} (${billingType})`,
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_BASE_URL}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/paymentfailed`,
      metadata: {
        userId: userId.toString(),
        productId: productId.toString(),
        billingType,
        amount: String(stripeAmount),
      },
    });

    await Payment.create({
      gateway: "stripe",
      transactionId: session.id,
      userId,
      productId,
      billingType,
      amount,
      currency,
      totals: {
        totalAmount: totalPayable,
        totalCharge: charge,
      },
      status: "open",
    });

    return { url: session.url, gateway: "stripe", transactionId: session.id };
  } catch (error) {
    console.error("createStripePayment error:", error);
    if (error.type === "StripeCardError") {
      throw new Error(error.message);
    }

    // Invalid request errors
    if (error.type === "StripeInvalidRequestError") {

      if (error.code === "amount_too_small") {
        throw new Error("Payment amount is too low.");
      }

      if (error.code === "amount_too_large") {
        throw new Error("Payment amount is too high.");
      }

      if (error.code === "invalid_currency") {
        throw new Error("Invalid currency selected.");
      }

      if (error.code === "parameter_missing") {
        throw new Error(`Missing parameter: ${error.param}`);
      }

      throw new Error(error.message);
    }

    if (error.type === "StripeAuthenticationError") {
      throw new Error("Stripe configuration error. Check API key.");
    }

    if (error.type === "StripeConnectionError") {
      throw new Error("Network error while connecting to Stripe.");
    }

    if (error.type === "StripeAPIError") {
      throw new Error("Stripe server error. Please try again.");
    }

    // fallback error
    throw new Error("Stripe payment failed. Please try again.");
  }
};
// paypal payment creation
const createPaypalPayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  try {
    const { client } = await getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    const totalAmount = Number(amount) + Number(charge);
    const paypalAmount = totalAmount?.toFixed(2);
    // If you don't want productName, just remove it
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency.toUpperCase(),
            value: paypalAmount
          }
          // description can be omitted if not needed
        }
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_BASE_URL}/paymentsuccess`,
        cancel_url: `${process.env.FRONTEND_BASE_URL}/paymentfailed`
      }
    });

    // Create the PayPal order
    const response = await client.execute(request);
    const order = response.result;

    await Payment.create({
      gateway: "paypal",
      transactionId: order.id,
      userId,
      productId,
      billingType,
      amount,
      currency,
      totals: {
        totalAmount: paypalAmount,
        totalCharge: charge,
      },
      status: "open",
    });

    // Find approval link
    const approveLink = order.links.find(link => link.rel === "approve")?.href;

    if (!approveLink) {
      return {
        success: false,
        message: "Unable to generate PayPal approval link."
      };
    }

    return {
      url: approveLink,
      gateway: "paypal",
      transactionId: order.id
    };
  } catch (error) {

    console.error("PayPal Payment Error:", error);
    const message =
      error?.details?.[0]?.description ||
      error?.response?.data?.details?.[0]?.description ||
      (typeof error?.message === "string" && error.message.includes("{")
        ? JSON.parse(error.message)?.details?.[0]?.description
        : error?.message) ||
      "PayPal payment failed.";

    throw new Error(message);
  }
};

// Create Braintree Payment
const createBraintreeToken = async () => {
  // Generate client token
  const gateways = await gateway();
  const response = await gateways.clientToken.generate({});
  return {
    gateway: "braintree",
    clientToken: response?.clientToken, // send to frontend
  };
};


// Create Braintree Payment
const createBraintreePayment = async ({ amount, currency, productId, billingType, userId, charge, nonce }) => {
  // Generate client token
  try {
    const gateways = await gateway();
    const plan = await PricingPlan.findById(productId);
    if (!plan) {
      throw new Error("Pricing plan not found");
    }
    const totalPayable = Number(amount) + Number(charge);
    const braintreeAmount = totalPayable?.toFixed(2);

    // 1️⃣ create DB entry (pending)
    const payment = await Payment.create({
      gateway: "braintree",
      transactionId: "#",
      userId,
      productId,
      billingType,
      amount,
      currency,
      totals: {
        totalAmount: braintreeAmount,
        totalCharge: charge,
      },
      status: "open",
    });

    // 2️⃣ create transaction
    const result = await gateways.transaction.sale({
      amount: braintreeAmount,
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (result.success) {
      // 3️⃣ update temp (processing)
      await Payment.findByIdAndUpdate(payment._id, {
        status: "open",
        transactionId: result.transaction.id,
      });

      return { url: "", gateway: "braintree", transactionId: result.transaction.id };

    } else {
      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
      });
      throw new Error(result.message);
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// Capture Braintree Payment
const captureBraintreePayment = async ({ paymentId, nonce, amount }) => {

  //  get payment first
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  const result = await gateway.transaction.sale({
    amount: amount.toString(),
    paymentMethodNonce: nonce,
    options: { submitForSettlement: true },
  });

  // ==============================
  // SUCCESS
  // ==============================
  if (result.success) {
    payment.transactionId = result.transaction.id;
    payment.status = "success";
    payment.statusTimeAgo = "just now";
    await payment.save();

    // -------------------------------
    // USER DETAILS (for PDF)
    // -------------------------------
    let user = null;
    if (payment.userId) {
      const dbUser = await User.findById(payment.userId);
      if (dbUser) {
        user = {
          email: dbUser.email || "-",
          firstName: dbUser.firstName || "-",
          lastName: dbUser.lastName || "-"
        };
      }
    }
    const plan = await PricingPlan.findById(payment.productId);
    await Notification.create({
      userId: payment.userId || null,
      subject: "Payment Successful",
      message: "Payment received.",
    });

    const pdfData = {
      leadData: [
        {
          "Payment Gateway": payment.gateway || "-",
          "Transaction ID": payment.transactionId || "-",
          "Username": user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
          "Email": user ? user.email : "-",
          "Product / Plan": plan.name || "-",
          "Billing Type": payment.billingType || "-",
          "Amount": payment.amount != null ? `${payment.currency} ${payment.amount}` : "-",
          "Conversion": payment.conversion
            ? `${payment.conversion.fromCurrency} ${payment.conversion.fromAmount} → ${payment.conversion.toCurrency} ${payment.conversion.toAmount}`
            : "-",
          "Totals": payment.totals
            ? `${payment.totals.firstAmount} ${payment.totals.fromCurrency} → ${payment.totals.secondAmount} ${payment.totals.toCurrency}`
            : "-",
          "Total After Conversion": payment.totals && payment.totals.totalAmount
            ? `${payment.totals.totalAmount} ${payment.totals.toCurrency}`
            : "-",
          "Status": payment.status || "-",
          "Initiated At": payment.initiatedAt ? moment(payment.initiatedAt).format("DD MMM YYYY, hh:mm A") : "-",
          "Time Ago": payment.initiatedAt ? moment(payment.initiatedAt).fromNow() : "-",
          "Created At": payment.createdAt ? moment(payment.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
          "Updated At": payment.updatedAt ? moment(payment.updatedAt).format("DD MMM YYYY, hh:mm A") : "-"
        }
      ]
    };

    const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

    // Update Payment with invoice URL
    payment.invoiceUrl = pdfPath;
    await payment.save();
  }
  // ==============================
  // FAILED
  // ==============================
  else {
    payment.status = "failed";
    payment.statusTimeAgo = "just now";
    await payment.save();

    //  FAILED notification (FIX)
    await Notification.create({
      userId: payment.userId || null,
      subject: "Payment Failed",
      message: "Your payment has failed. Please try again.",
    });
  }

  return result;
};


// razorpay payment creation
const createRazorpayPayment = async ({
  amount,
  currency,
  productId,
  billingType,
  userId,
  charge,
}) => {
try {
  const razorpay = await getRazorpayInstance();

 const totalAmount = Number(amount) + Number(charge);
    const payAmount = totalAmount?.toFixed(2);

  const razorpayAmount = Math.round(payAmount * 100);
// Create Razorpay order
  const order = await razorpay.orders.create({
    amount: razorpayAmount,
    currency: currency.toUpperCase(),
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: userId.toString(),
    },
  });

// Save Payment in DB
  await Payment.create({
    gateway: "razorpay",
    transactionId: order.id, 
    userId,
    productId,
    billingType,
    amount,
    currency,
    totals: {
      totalAmount: payAmount,
      totalCharge: charge,
    },
    status: "open",
  });

     if (!order.id) {
      return {
        success: false,
        message: "Unable to create payment order. Please try again later."
      };
    }
 // Return for frontend
  return {
    gateway: "razorpay",
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: razorpay.client_,
  };
  } catch (error) {
    const message =
      error?.details?.[0]?.description ||
      error?.response?.data?.details?.[0]?.description ||
      (typeof error?.message === "string" && error.message.includes("{")
        ? JSON.parse(error.message)?.details?.[0]?.description
        : error?.message) ||
      "Unable to create payment order. Please try again later.";

    throw new Error(message);
  }
};


const createPayHerePayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  // Convert currency (await if convertCurrency is async)
  const conversion = {
    fromAmount: amount,
    fromCurrency: currency,
    toAmount: amount,
    toCurrency: currency,
    totalAmount: amount + charge,
    totalCharge: charge,
  };

  // Create pending payment in DB
  const payment = await Payment.create({
    gateway: "payhere",
    transactionId: "temp_" + Date.now(), // temporary until PayHere callback updates it
    userId,
    amount,
    currency,
    productId,
    billingType,
    conversion,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount,
    },
    status: "open",
  });

  // Prepare PayHere form data
  const formData = {
    merchant_id: config.merchantId,
    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,
    order_id: payment._id.toString(), // use DB _id
    items: `Product ${productId}`,     // simple description
    currency,
    amount,
  };

  return {
    gateway: "payhere",
    paymentId: payment._id,
    formData,
    checkoutUrl: config.sandboxUrl, // frontend can POST form to this URL
  };
};

module.exports = { createStripePayment, createRazorpayPayment, createPaypalPayment, createBraintreePayment, captureBraintreePayment, createPayHerePayment, createBraintreeToken }; 