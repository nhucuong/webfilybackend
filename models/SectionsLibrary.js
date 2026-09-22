const mongoose = require("mongoose");

const SectionsLibrarySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, // "home"
    unique: true
  },

  label: {
    type: String,
    required: true
  },
  variants: {
    type: [String],
    default: []
  },

  category: {
    type: String,
    default: "top"
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  order: {
    type: Number,
    default: 0
  },

}, { timestamps: true });



module.exports = mongoose.model("SectionsLibrary", SectionsLibrarySchema);