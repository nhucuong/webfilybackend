const mongoose = require("mongoose");

const HeroStatSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: String,
      required: true,
    },
    iconName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroStat", HeroStatSchema);
