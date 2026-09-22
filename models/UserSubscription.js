const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
  {
    // kis user ka plan
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // konsa plan liya hai
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true
    },

    // monthly / yearly
    billingType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },

    // plan ke total leads
    totalWebsite: {
      type: Number,
      required: true
    },
    websiteCreated: {
      type: Number,
      default: 0
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

    totalPageLimite: {
      type: Number,
      default: 0,
      required: true
    },

    totalSectionLimite: {
      type: Number,
      default: 0,
      required: true
    },

    // plan start
    startDate: {
      type: Date,
      default: Date.now
    },

    // plan end
    endDate: {
      type: Date
    },

    // plan status
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    },
    isFree: {
      type: Boolean,
      default: false
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    expiryReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);



userSubscriptionSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

module.exports = mongoose.model("UserSubscription", userSubscriptionSchema);
