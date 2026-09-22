const mongoose = require("mongoose");


const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: "default"
  },
  visible: {
    type: Boolean,
    default: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const pageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    default: ""
  },
  sections: {
    type: [sectionSchema],
    default: []
  }
}, { _id: false });

const preferenceSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  subscriptionId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSubscription",
    required: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusinessType",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  isActive : {
    type : Boolean,
    default : true,
  },

   // =========================
  // 🔥 USER SELECTION (NEW)
  // =========================
  userInput: {
    pages: {
      type: [String], // ["home", "about", "contact"]
      default: []
    },

    sections: {
      type: [String], // ["hero", "features", "faq"]
      default: []
    }
  },
  // 🔥 USER + FINAL CONFIG
  config: {

    // ===== USER INPUT =====
    site: {
      websiteName: { type: String, default: "" },
      description: { type: String, default: "" },
      industry: { type: String, default: "" }
    },

    theme: {
      primaryColor: { type: String, default: "" },
      secondaryColor: { type: String, default: "" },
      accent: { type: String, default: "" },
      backgroundColor: { type: String, default: "" }
    },

    typography: {
      font: { type: String, default: "" },
      headingSize: { type: String, default: "" },
      fontWeight: { type: String, default: "" },
      lineSpacing: { type: String, default: "" }
    },

    layout: {
      containerWidth: { type: String, default: "" },
      sectionSpacing: { type: String, default: "" },
      borderRadius: { type: String, default: "" }
    },

    branding: {
      logo: { type: String, default: "" },
      favicon: { type: String, default: "" }
    },

    ui: {
      buttonStyle: { type: String, default: "" },
      brandTone: { type: String, default: "" },
      designStyle: { type: String, default: "" },
      contentLength: { type: String, default: "" }
    },

    animations: {
      style: { type: String, default: "" }
    },

    // ===== AI GENERATED =====
    pages: {
      type: [pageSchema],
      default: []
    }
  },

  // Export
  zipUrl: {
    type: String,
    default: ""
  },
    // Export
  thumbnail: {
    type: String,
    default: ""
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
