const mongoose = require("mongoose");

const languagesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  native: {
    type: String,
    default: "",
  },
  flag: {
    type: String,
    default: "",
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Languages", languagesSchema);
