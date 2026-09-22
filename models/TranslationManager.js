const mongoose = require("mongoose");

const translationManagerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

     translations: [
        {
          key: {
            type: String,
            required: true,
            trim: true,
          },

          value: {
            type: String,
            default: "",
          },
        },
      ],

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TranslationManagers",
  translationManagerSchema
);