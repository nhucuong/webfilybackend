const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  companyName: { type: String, default: "" },
  contactAddress: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  emailAddress: { type: String, default: "" },
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  youtube: { type: String, default: "" },
  logo: { type: String, default: "" },
  favicon: { type: String, default: "" },
  currency: { type: String, default: "" },
  currencySymbol: { type: String, default: "" },
  supportTime: { type: String, default: "" },

  email: { type: String, required: true },
  password: { type: String, required: true },

  defaultLanguages: {
    type: String,
    required: true,
    default: "en",
  },

  mapUrl: {
    type: String,
    default: "",
  },

  aboutcompany: {
    type: String,
    required: true,
  },

  // Theme Colors
  theme: {
    primaryColor: {
      type: String,
      default: "#6B4FE6",
    },
    secondaryColor: {
      type: String,
      default: "#795EFE",
    },
  },
  dbVersion: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Setting", contactSchema);