const mongoose = require("mongoose");

const translationKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TranslationKeys",
  translationKeySchema
);