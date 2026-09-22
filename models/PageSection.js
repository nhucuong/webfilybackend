const mongoose = require("mongoose");

const pageSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

     badge: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true,
      default: ""
    },

    shortDescription: {
      type: String,
      default: ""
    },
    features: {
      type: String,
      default: ""
    },

    labels: {
      type: [String],
      default: []
    },
    special: {
      type: String,
      default: ""
    },
    image: {
      type: String
    },
    subtitle:{
      type:String
    },
    herofetures:{
      type:[String],
      default:[]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PageSection", pageSectionSchema);
