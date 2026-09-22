const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    avatar: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: {
      type: String,
      // This makes password required ONLY IF googleId does not exist
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    country: { type: String },
    state: { type: String },

    otp: { type: String }, // OTP STORE
    otpExpiry: { type: Date }, // OTP EXPIRY TIME
    bio: { type: String },
    ip: { type: String },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    emailNotifications: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    marketingEmails: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    loginProvider: {
      type: String,
      default: "email",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
