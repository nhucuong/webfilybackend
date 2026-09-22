const paypal = require("@paypal/checkout-server-sdk");
const PaymentGateway = require("../models/PaymentGateway");


let client = null;
let notifications = null;
let cachedWebhookId = null;

async function getPayPalClient() {
  if (client && notifications && cachedWebhookId) return { client, notifications, webhook_id: cachedWebhookId };

  // DB se PayPal gateway fetch karo
  const gateway = await PaymentGateway.findOne({
    name: { $regex: /^paypal$/i }
  });

  if (!gateway || !gateway.clientId || !gateway.secretKey) {
    throw new Error("PayPal keys not configured in PaymentGateway");
  }

const environment = new paypal.core.SandboxEnvironment(
    gateway.clientId,
    gateway.secretKey
);

 client = new paypal.core.PayPalHttpClient(environment);

class VerifyWebhookSignatureRequest {
  constructor() {
    this.path = "/v1/notifications/verify-webhook-signature";
    this.verb = "POST";
    this.body = null;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  requestBody(body) {
    this.body = body;
    return this;
  }
}

 notifications = {
  VerifyWebhookSignatureRequest: VerifyWebhookSignatureRequest,
};
  cachedWebhookId = gateway.webhookUrl; 

 return { client, notifications, webhook_id: cachedWebhookId  };
}
// =========================================================
// CHANGE END
// =========================================================

module.exports =  { getPayPalClient };