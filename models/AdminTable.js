const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  profile: {
    type: String
  },

  // Number of failed login attempts
  loginAttempts: {
    type: Number,
    default: 0
  },

  // Lock account until this time
  lockUntil: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Admin", adminSchema);