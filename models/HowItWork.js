const mongoose = require("mongoose");

const HowItWorkSchema = new mongoose.Schema(
  {
    iconName: {
      type: String,
      trim: true,
      default: ""
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
     features: {
      type: [String],
      default: []
    }
      ,
    image: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HowItWork", HowItWorkSchema);
