const braintree = require("braintree");
const PaymentGateway = require("../models/PaymentGateway");

const environment = process.env.BRAINTREE_ENVIRONMENT === "production"
  ? braintree.Environment.Production
  : braintree.Environment.Sandbox; // Sandbox = Test mode



const gateway  = async () => {

    const gatewaydata = await PaymentGateway.findOne({
    name: { $regex: /^braintree$/i }
  });

    if (!gatewaydata || !gatewaydata.clientId || !gatewaydata.publicKey || !gatewaydata.privateKey) {
    throw new Error("braintree keys not configured in PaymentGateway");
  }
  return new braintree.BraintreeGateway({
  environment,
  merchantId: gatewaydata.clientId,
  publicKey: gatewaydata.publicKey,
  privateKey: gatewaydata.privateKey,
});
}

module.exports = gateway;  
