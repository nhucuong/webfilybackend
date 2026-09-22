const nodemailer = require("nodemailer");
const Setting = require("../models/Setting");

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const setting = await Setting.findOne().lean();

  if (!setting || !setting.email || !setting.password) {
    throw new Error("Email credentials not found in Setting");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: setting.email,
      pass: setting.password
    }
  });

  return cachedTransporter;
}

module.exports = getTransporter;
