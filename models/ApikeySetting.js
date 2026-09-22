const mongoose = require("mongoose");

const ApikeySettingSchema = new mongoose.Schema({
  geminiApi: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  },
  openAi: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  }
}, { timestamps: true });

module.exports = mongoose.model("Apikeysetting", ApikeySettingSchema);
