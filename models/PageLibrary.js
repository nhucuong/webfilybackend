const mongoose = require("mongoose");

const pageLibrarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // "home"
    unique: true
  },

  label: {
    type: String,
    required: true // "Home"
  },

  category: {
    type: String,
    default: "core" // core, business, content, ecommerce
  },

  isCore: {
    type: Boolean,
    default: false // Home, About, Contact
  },

  isActive: {
    type: Boolean,
    default: true
  },

  order: {
    type: Number,
    default: 0
  },

  defaultSections: {
    type: [String], // ["hero", "features"]
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("PageLibrary", pageLibrarySchema);