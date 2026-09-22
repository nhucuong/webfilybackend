const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema({
  type: { type: String, required: true },
    shortDescription: {
      type: String,
      trim: true,
      default: ""
    },

    iconName: {
      type: String,
      trim: true,
      default: ""
    },
  status: { type: Boolean, default: true }, 
}, { timestamps: true });

module.exports = mongoose.model("BusinessType", BusinessSchema);
