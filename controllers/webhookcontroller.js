const getStripe = require("../config/stripe");
const Payment = require("../models/Payment");
const config = require("../config/payhere");
const UserSubscription = require("../models/UserSubscription");
const PricingPlan = require("../models/SubscriptionPlan");
const Notification = require('../models/Notification')
const moment = require("moment");
const generatePDF = require("../helpers/GeneratePDF");
const User = require("../models/User");
const crypto = require("crypto");
const sendTemplateEmail = require("../helpers/SendResetLink");
const Setting = require('../models/Setting')
const UserActivity = require("../models/UserActivity");
const gateway = require("../config/braintree");
const PaymentGateway = require("../models/PaymentGateway");

async function storeUserSubDetails(transactionId) {
   let plan = null;

      // Update Payment
      const payment = await Payment.findOneAndUpdate(
        { transactionId: transactionId },
        { status: "success" },
        { new: true }
      );
      
      if (payment) {
        let user = null;
      if (payment.userId) {
        const dbUser = await User.findById(payment.userId);
        if (dbUser) {
          user = {
            email: dbUser.email || "",
            firstName: dbUser.firstName || "",
            lastName: dbUser.lastName || "",
            emailNotifications: dbUser.emailNotifications
          };
        }
      }

        // Calculate subscription dates
        plan = await PricingPlan.findById(payment.productId);
        
        if (!plan) {
          return res.status(200).send("Plan not found");
        }

        const startDate = new Date();
        let endDate = new Date();

        if (payment.billingType === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (payment.billingType === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        const totalWebsite = payment.billingType === "monthly" ? plan.monthlyWebsiteLimit : plan.yearlyWebsiteLimit;
        const totalPageLimite = plan.maxPages
        const totalSectionLimite = plan.maxSectionsPerPage

        const lastActiveSubscription = await UserSubscription.findOne({
          userId: payment.userId,
          status: "active"
        }).sort({ createdAt: -1 });

        if (lastActiveSubscription) {
          lastActiveSubscription.status = "expired";
          lastActiveSubscription.endDate = startDate;
          lastActiveSubscription.expiredAt = startDate;
          await lastActiveSubscription.save();
        }

        // Upsert UserSubscription
        const newSub = await UserSubscription.create({
          userId: payment.userId,
          planId: payment.productId,
          billingType: payment.billingType,
          totalWebsite,
          websiteCreated: 0,
          features:plan?.features,
          totalPageLimite,
          totalSectionLimite,
          expiryReminderSent : false,
          startDate,
          endDate,
          status: "active",
        });
        

        await Notification.create({
          userId: payment.userId || null,
          subject: "Payment Successful",
          message: `Payment received from ${user.firstName}.`,
        });

        await UserActivity.create({
            userId: payment.userId,
            action: `${plan.name} plan activated. Enjoy your new limits!`,
            target: plan.name,
            atypes: "plan_active",
          });

        const settings = await Setting.findOne({});
        const currencySymbol = settings?.currencySymbol;
        const shortTransactionId = payment.transactionId
          ? `${payment.transactionId.slice(0, 6)}...${payment.transactionId.slice(-4)}`
          : "-";
        const pdfData = {
          WebData: [
            {
              "Method": payment.gateway || "-",

              "Transaction ID": shortTransactionId,

              "Username": user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"
                : "Unknown",

              "Email": user?.email || "-",

              "Product / Plan": plan?.name || "-",

              "Billing Type": payment.billingType || "-",

              // Base Amount
              "Amount": payment.amount != null
                ? `${currencySymbol} ${payment.amount?.toFixed(2)} ${payment.currency}`
                : "-",

              // Charge
              "Charge": payment.totals?.totalCharge != null
                ? `${currencySymbol} ${payment.totals.totalCharge?.toFixed(2)} ${payment.currency}`
                : `${currencySymbol} 0 ${payment.currency}`,

              // Final Total
              "Total Amount": payment.totals?.totalAmount != null
                ? `${currencySymbol} ${payment.totals.totalAmount?.toFixed(2)} ${payment.currency}`
                : payment.amount != null
                  ? `${currencySymbol} ${payment.amount?.toFixed(2)} ${payment.currency}`
                  : "-",

              // "Features": newSub.features || "",
               [
                payment.billingType === "monthly"
                  ? "Website per Month"
                  : "Website per Year"
              ]: newSub.totalWebsite == 0 ? "Unlimited" :newSub.totalWebsite,
              [
                payment.billingType === "monthly"
                  ? "Monthly Pages Limit"
                  : "Yearly Pages Limit"
              ]: newSub.totalPageLimite == 0 ? "Unlimited" : newSub.totalPageLimite,

              [
                payment.billingType === "monthly"
                  ? "Monthly Section Limit Per Page"
                  : "Yearly Section Limit Per Page"
              ]: newSub.totalSectionLimite == 0 ? "Unlimited" :  newSub.totalSectionLimite,

              "Status": payment.status || "-",

              "Created At": payment.createdAt
                ? new Date(payment.createdAt).toLocaleString()
                : "-",

              "Expire date": newSub.endDate
                ? new Date(newSub.endDate).toLocaleString()
                : "-"
            }
          ]
        };

        const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

        // Update Payment with invoice URL
        payment.invoiceUrl = pdfPath;
        await payment.save();

      

      if (user?.email && user?.emailNotifications === 1) {
    
        const setting = await Setting.findOne({});
        
            const emailVars = {
              firstName: user.firstName,
              site_name: setting?.companyName,
              plan_name: plan.name,
              billingType: plan.billingType,
              amount: `${currencySymbol} ${payment.totals.totalAmount} ${payment.currency}`,
              site_logo:setting?.logo ? process.env.BASE_URL+setting?.logo : "",
              invoice_url:payment.invoiceUrl ? process.env.BASE_URL+payment.invoiceUrl : ""
            };
        

        try {
          await sendTemplateEmail(
            "subscription_success",
            user.email,
            emailVars
          );
        } catch (mailErr) {
          console.error("Subscription email failed:", mailErr.message);
        }
      }
      }
}

//stripe webhook
module.exports.handleWebhook = async (req, res) => {

  const { stripe, webhookSecret } = await getStripe();
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret.trim());
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // -------------------------------
    // Payment Success
    // -------------------------------
    
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

     await storeUserSubDetails(session.id)
     
    }
    // ------------------------------------------------
    // PAYMENT FAILED 
    // ------------------------------------------------
    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "charge.failed"
    ) {
      let paymentIntentId = null;

      if (event.type === "payment_intent.payment_failed") {
        paymentIntentId = event.data.object.id;
      }

      if (event.type === "charge.failed") {
        paymentIntentId = event.data.object.payment_intent;
      }

      if (paymentIntentId) {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

        if (sessions.data.length) {
          const payment = await Payment.findOne({ transactionId: sessions.data[0].id });

          //  already failed hai toh kuch mat karo
          if (payment && payment.status === "failed") {
            return;
          }
          const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: sessions.data[0].id },
            { status: "failed", statusTimeAgo: "just now" }
          );

          if (updatedPayment && updatedPayment.userId) {
            const dbUser = await User.findById(updatedPayment.userId).select("firstName");
            await Notification.create({
              userId: updatedPayment.userId,
              subject: "Payment Failed",
              message: `Payment attempt failed for ${dbUser.firstName}.`,
            });
          }

        }
      }
    }
    // Respond to Stripe
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Webhook processing error");
  }
};

//paypal webhook
module.exports.paypalWebhook = async (req, res) => {
  try {
    const headers = req.headers;
    const event = JSON.parse(req.body.toString());

    // ------------------------------------------------
    // BASIC VALIDATION (production me PayPal SDK se verify hota hai)
    // ------------------------------------------------
    if (!headers["paypal-transmission-id"]) {
      console.error("Invalid PayPal webhook");
      return res.status(400).send("Invalid webhook");
    }

    // =================================================
    // PAYMENT SUCCESS
    // =================================================
    if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
      const orderId = event.resource.id;
       await storeUserSubDetails(orderId);
    }

    // =================================================
    // PAYMENT FAILED
    // =================================================
    if (
      event.event_type === "CHECKOUT.ORDER.DENIED" ||
      event.event_type === "PAYMENT.CAPTURE.DENIED"
    ) {
      const orderId = event.resource.id;

      const payment = await Payment.findOne({
        transactionId: orderId
      });

      if (!payment) {
        console.error("Failed PayPal payment not found:", orderId);
        return res.json({ received: true });
      }

      // already failed
      if (payment.status === "failed") {
        return res.json({ received: true });
      }

      // update status
      payment.status = "failed";
      payment.statusTimeAgo = "just now";
      await payment.save();

      // Failed notification
      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          subject: "Payment Failed",
          message: "Your payment has failed. Please try again.",
        });
      }

    }

    // =================================================
    res.json({ received: true });

  } catch (err) {
    console.error("PayPal webhook error:", err);
    res.status(500).json({ success: false });
  }
};

//paypal webhook
module.exports.braintreeWebhook = async (req, res) => {
  try {
        const btSignature = req.body.bt_signature;
  const btPayload = req.body.bt_payload;
    const gateways = await gateway();

 const webhookNotification = await gateways.webhookNotification.parse(btSignature, btPayload);

    const kind = webhookNotification.kind;

  // =================================================
    // PAYMENT SUCCESS
    // =================================================
  
    if (kind === "transaction_settled") {
      const transaction = webhookNotification.transaction;

        const orderId = transaction.id;
       await storeUserSubDetails(orderId);
      
    }




    // =================================================
    // PAYMENT FAILED
    // =================================================

    if (kind === "transaction_settlement_declined") {
      const transaction = webhookNotification.transaction;

        const orderId = transaction;

      const payment = await Payment.findOne({
        transactionId: orderId
      });

      if (!payment) {
        console.error("Failed PayPal payment not found:", orderId);
        return res.json({ received: true });
      }

      // already failed
      if (payment.status === "failed") {
        return res.json({ received: true });
      }

      // update status
      payment.status = "failed";
      payment.statusTimeAgo = "just now";
      await payment.save();

      // Failed notification
      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          subject: "Payment Failed",
          message: "Your payment has failed. Please try again.",
        });
      }

    }
    // =================================================
    res.json({ received: true });

  } catch (err) {
    console.error("PayPal webhook error:", err);
    res.status(500).json({ success: false });
  }
};

// ========================
// RAZORPAY WEBHOOK
// ========================
module.exports.razorpayWebhook = async (req, res) => {
  try {
    // -------------------------------
    // Verify Signature
    // -------------------------------

        const gateway = await PaymentGateway.findOne({
            name: { $regex: /^razorpay$/i }
          });


    const secret = gateway?.webhookUrl;
    const signature = req.headers["x-razorpay-signature"];

    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(body);
    // =====================================
    // PAYMENT SUCCESS
    // =====================================
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      if (orderId) {
        const payment = await Payment.findOneAndUpdate(
          { transactionId: orderId },
          {
            paymentId: paymentEntity.id,
            status: "success",
            statusTimeAgo: "just now",
          },
          { new: true }
        );

        await storeUserSubDetails(orderId);
      }
    }

    // =====================================
    // PAYMENT FAILED
    // =====================================
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        transactionId: orderId,
      });

      if (!payment) {
        console.error("Failed payment not found:", orderId);
        return res.json({ received: true });
      }

      //  already failed
      if (payment.status === "failed") {
        return res.json({ received: true });
      }

      //  update status
      payment.status = "failed";
      payment.statusTimeAgo = "just now";
      await payment.save();

      //  Failed notification
      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          subject: "Payment Failed",
          message: "Your payment has failed. Please try again.",
        });
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    res.status(500).json({ success: false });
  }
};

// payhere webhook
module.exports.payhereWebhook = async (req, res) => {
  try {
    const data = req.body;

    // ---------------------------------
    // Verify hash / signature
    // ---------------------------------
    const hashString = `${data.merchant_id}${data.order_id}${data.amount}${data.currency}${config.secret}`;
    const expectedHash = crypto.createHash("md5").update(hashString).digest("hex");

    if (expectedHash !== data.hash) {
      return res.status(400).send("Invalid signature");
    }
    // ---------------------------------
    // Update Payment
    // ---------------------------------

           await storeUserSubDetails(data.order_id);
    // =================================================
    // PAYMENT FAILED
    // =================================================
    if (data.status !== "2") {
    const payment = await Payment.findOneAndUpdate(
      {
        transactionId: data.order_id
      });

    if (!payment) {
      console.error("Payment not found:", data.order_id);
      return res.send("OK");
    }
      // already failed
      if (payment.status !== "failed") {
        payment.status = "failed";
        payment.statusTimeAgo = "just now";
        await payment.save();

        if (payment.userId) {
          await Notification.create({
            userId: payment.userId,
            subject: "Payment Failed",
            message: "Your payment has failed. Please try again.",
          });
        }

      }

      return res.send("OK");
    }
   
    res.send("OK");
  } catch (err) {
    console.error("PayHere webhook error:", err);
    res.status(500).send("Webhook error");
  }
};
