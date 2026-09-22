const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },

    shortDescription: {
      type: String,
      default: "",
      required: true
    },
    isFree: {
      type: Boolean,
      default: false
    },
    monthlyPrice: {
      type: Number,
      default: 0,
      required: true
    },

    yearlyPrice: {
      type: Number,
      default: 0,
      required: true
    },

    monthlyWebsiteLimit: { type: Number, default: 0, required: true },
    yearlyWebsiteLimit: { type: Number, default: 0, required: true },


    maxPages: {
      type: Number,
      default: 0,
      required: true
    },

    maxSectionsPerPage: {
      type: Number,
      default: 0,
      required: true
    },
    features: {
      logoFaviconUpload: {
        label: { type: String, default: "Logo & Favicon Upload" },
        status: { type: Boolean, default: true }
      },

      regenerateWebsite: {
        label: { type: String, default: "Regenerate Website" },
        status: { type: Boolean, default: true }
      },

      regenerateContent: {
        label: { type: String, default: "Regenerate Content" },
        status: { type: Boolean, default: true }
      },

      reorderSection: {
        label: { type: String, default: "Reorder Section" },
        status: { type: Boolean, default: true }
      },

      exportCode: {
        label: { type: String, default: "Export Code" },
        status: { type: Boolean, default: true }
      },

      editContent: {
        label: { type: String, default: "Edit Content" },
        status: { type: Boolean, default: true }
      },
    },
    status: {
      type: Boolean,
      default: true
    },
    monthlyDiscount: {
      type: Number,
      default: 0
    },
    yearlyDiscount: {
      type: Number,
      default: 0
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    billingType: {
      type: [String],
      enum: ["monthly", "yearly"],
      default: ["monthly", "yearly"]
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
