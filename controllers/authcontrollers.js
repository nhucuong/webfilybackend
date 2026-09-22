const Blog = require("../models/Blog");
const Tag = require("../models/Tag");
const Feature = require("../models/Features");
const HowItWork = require("../models/HowItWork");
const Faq = require("../models/Faq");
const Testimonial = require("../models/Testimonial");
const Setting = require("../models/Setting");
const PricingPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const UserResetPasswordToken = require("../models/UserResetPasswordToken");
const Inquiry = require("../models/Inquiry");
const BusinessType = require("../models/BusinessType");
const Country = require("../models/Countrie");
const State = require("../models/States");
const SupportTicket = require("../models/Ticket");
const Admin = require("../models/AdminTable");
const Payment = require("../models/Payment");
const Newsletter = require("../models/NewsLetter");
const UserSubscription = require("../models/UserSubscription");
const Notification = require("../models/Notification");
const Portfolio = require("../models/Portfolio"); // Add this import
const PageSection = require("../models/PageSection"); // Add this import
const PaymentGateway = require("../models/PaymentGateway");
const Preference = require("../models/Preferance");
const Seo = require("../models/Seo");
const Pagedetails = require("../models/PageDetails");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const geoip = require("geoip-lite");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const HeroStat = require("../models/HeroStat");
const UserActivity = require("../models/UserActivity");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AuthkeySetting = require("../models/AuthkeySetting");
const sendTemplateEmail = require("../helpers/SendResetLink");
const Languages = require("../models/Languages");
const TranslationManager = require("../models/TranslationManager");
const { assignFreePlanOnce } = require("../helpers/subscriptionHelper");

// -----------------------------
// GET SIGNUP PAGE SECTION
// -----------------------------
module.exports.getSignupData = async (req, res) => {
  try {
    // -----------------------------
    // GET SIGNUP PAGE SECTION
    // -----------------------------
    const pageSection = await PageSection.findOne(
      { type: "signup" },
      {
        _id: 0,
        title: 1,
        shortDescription: 1,
        image: 1,
        features: 1,
        labels: 1,
      },
    );

    if (!pageSection) {
      return res.json({ success: true, data: null });
    }

    // -----------------------------
    // SPLIT FEATURES STRING
    // -----------------------------
    const featureDescArr = pageSection.features
      ? pageSection.features.split(",").map((f) => f.trim())
      : [];

    const labelArr = Array.isArray(pageSection.labels)
      ? pageSection.labels
      : [];

    // -----------------------------
    // MAP FEATURES (LABEL -> TITLE, FEATURE -> DESC)
    // -----------------------------
    const formattedFeatures = labelArr.map((label, index) => ({
      title: label || "",
      desc: featureDescArr[index] || "",
    }));

    const setting = await Setting.findOne(
      {},
      {
        logo: 1,
      },
    );

      const authSetting = await AuthkeySetting.findOne({});

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------
    res.json({
      success: true,
      data: {
        logo: setting?.logo,
        bgimage: pageSection.image || "",
        title: pageSection.title || "",
        description: pageSection.shortDescription || "",
        features: formattedFeatures,
        authSetting: {
        google: authSetting?.google?.enabled,
        github: authSetting?.github?.enabled,
      }
      },
    });
  } catch (err) {
    console.error("Signup Section API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Sign Up
// ==========================================
module.exports.signup = async (req, res) => {
  try {
    const {
      profileImage,
      name,
      lastName,
      email,
      password,
      phone,
      bio,
      timezone,
      ip,
      state,
    } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(200).json({
        success: false,
        message: "name, email & password are required",
      });
    }

    let otp = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    let otpExpiry = Date.now() + 10 * 60 * 1000;

    let user = await User.findOne({ email });

    if (user && user?.status === 0) {
      return res.status(200).json({
        success: false,
        message: "Your account has been banned. Please contact support.",
      });
    }
    if (user && user.loginProvider === "google") {
      return res.status(200).json({
        success: false,
        message: "This email is registered using Google. Please log in with Google.",
      });
    }
    if (user && user.loginProvider === "github") {
      return res.status(200).json({
        success: false,
        message: "This email is registered using Github. Please log in with Github.",
      });
    }
    const setting = await Setting.findOne({});
    const emailVars = {
      firstName: name,
      site_name: setting?.companyName,
      otp,
      site_logo: setting?.logo ? process.env.BASE_URL + setting?.logo : ""
    };
    if (user) {
      if (user && user.emailVerified === 0) {
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendTemplateEmail("resend_otp", email, emailVars);

        return res.json({
          success: true,
          message: "OTP resend to your email.",
          status: "1",
          userId: user._id,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "Email already registered plese login",
        });
      }
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // -----------------------------
    // Get IP & Location
    // -----------------------------
    const { cleanIP, country } = await ipData(req)

    // user create (optional fields included)
    user = new User({
      profileImage,
      firstName: name,
      lastName: lastName || "",
      email,
      password: hashedPassword,
      phone: phone || "",
      bio: bio || "",
      timezone: timezone || "",
      ip: cleanIP,
      country: country || "",
      state: state || "",
      otp,
      otpExpiry,
      emailVerified: false,
    });

    await user.save();
    // Send OTP Email
    await sendTemplateEmail("signup_otp", email, emailVars);

    await Notification.create({
      userId: user._id,
      subject: "New User Registered",
      message: `${name} has registered on the platform.`,
    });

    res.json({
      success: true,
      message: "Signup successful. OTP sent to your email.",
      userId: user._id,
      status: "1",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const axios = require("axios");
const UAParser = require("ua-parser-js");

const ipData = async (req) => {
  // -----------------------------
  // 1. Get Real Client IP
  // -----------------------------
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.ip ||
    "";

  // Handle multiple IPs (proxy case)
  if (ip.includes(",")) {
    const ips = ip.split(",").map(i => i.trim());

    // Prefer IPv4 if available
    const ipv4 = ips.find(i => i.includes("."));
    ip = ipv4 || ips[0];
  }

  // Clean IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  const cleanIP = ip;

  console.log("🌍 Final IP:", cleanIP);

  // -----------------------------
  // 2. Get Location
  // -----------------------------
  let geo = null;
  let location = "";
  let country = "";

  // ❌ Skip local/private IPs
  const isLocalIP =
    cleanIP === "127.0.0.1" ||
    cleanIP === "::1" ||
    cleanIP.startsWith("192.168") ||
    cleanIP.startsWith("10.") ||
    cleanIP.startsWith("172.");

  if (!isLocalIP) {
    // 2.1 Try geoip-lite (fast but limited)
    geo = geoip.lookup(cleanIP);

    if (geo && geo.city) {
      location = `${geo.city}, ${geo.country}`;
      country = `${geo.country}`;
    } else {
      // 2.2 Fallback to IPv6 supported API
      try {
        const res = await axios.get(`https://ipapi.co/${cleanIP}/json/`);

        if (res.data && res.data.city) {
          geo = res.data;
          location = `${res.data.city}, ${res.data.country_name}`;
          country = `${res.data.country_name}`;
        }
      } catch (err) {
        console.log("⚠️ Location API failed");
      }
    }
  } else {
    location = "Localhost";
    country = "";
  }

  // -----------------------------
  // 3. Browser & OS
  // -----------------------------
  const userAgent = req.headers["user-agent"] || "";

  const parser = new UAParser(userAgent);
  const ua = parser.getResult();

  const browser = ua.browser.name || "";
  const browserVersion = ua.browser.version || "";
  const os = ua.os.name || "";
  const osVersion = ua.os.version || "";
  const deviceType = ua.device.type || "desktop";

  // -----------------------------
  // Final Response
  // -----------------------------
  return {
    cleanIP,
    location,
    geo,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    userAgent,
    isLocalIP,
    country
  };
};

const tokenGenerate = async (user) => {
  const token = jwt.sign(
    {
      id: user._id,
      name: `${user.firstName}`,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return token;
};
// ==========================================
// Verify Otp
// ==========================================
module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!email) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    // OTP compare
    if (user.otp !== String(otp).trim()) {
      return res.status(200).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(200).json({
        success: false,
        message: "OTP expired",
      });
    }

    // UPDATE VERIFY
    user.emailVerified = 1;
    user.status = 1;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    await assignFreePlanOnce(user)

    const token = await tokenGenerate(user);
    const { location, cleanIP,browser,os } = await ipData(req)

    res.json({
      success: true,
      message: "Email verified successfully",
       token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        status: user.status,
        bio: user.bio || "",
        timezone: user.timezone || "",
        registeredAt: user.createdAt,
        avatar: user.avatar,
        ip: cleanIP,
        location,
        browser,
        os,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Login
// ==========================================

module.exports.login = async (req, res) => {
  try {
    const { email, password, browser, os } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password are required",
      });
    }

    // -----------------------------
    // Find User
    // -----------------------------
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (user?.emailVerified === 0) {
      return res.status(200).json({
        success: false,
        message: "Account not verified. Please verify your email or contact support.",
      });
    }
    if (user && user?.status === 0) {
      return res.status(200).json({
        success: false,
        message: "Your account has been banned. Please contact support.",
      });
    }
    if (user && user.loginProvider === "google" && user.password == null) {
      return res.status(200).json({
        success: false,
        message: "This email is registered using Google. Please log in with Google.",
      });
    }
    if (user && user.loginProvider === "github" && user.password == null) {
      return res.status(200).json({
        success: false,
        message: "This email is registered using Github. Please log in with Github.",
      });
    }

    // -----------------------------
    // Compare Password
    // -----------------------------
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(200).json({
        success: false,
        message: "Invalid password",
      });
    }
    // -----------------------------
    // Get IP & Location
    // -----------------------------
    const { location, cleanIP } = await ipData(req)
    // -----------------------------
    // Save Login History
    // -----------------------------
    await LoginHistory.create({
      userId: user._id,
      loginAt: new Date(),
      ip: cleanIP,
      location,
      browser,
      os,
    });
    user.lastLogin = new Date();
    user.ip = cleanIP;
    await user.save();
    // -----------------------------
    // JWT Token
    // -----------------------------
    const token = await tokenGenerate(user);
    // -----------------------------
    // FULL RESPONSE (As requested)
    // -----------------------------
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        status: user.status,
        bio: user.bio || "",
        timezone: user.timezone || "",
        registeredAt: user.createdAt,
        avatar: user.avatar,
        ip: cleanIP,
        location,
        browser,
        os,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// -----------------------------
// GET LOGIN PAGE SECTION
// -----------------------------
module.exports.getLoginData = async (req, res) => {
  try {
    // -----------------------------
    // GET LOGIN PAGE SECTION
    // -----------------------------
    const pageSection = await PageSection.findOne(
      { type: "login" },
      {
        _id: 0,
        title: 1,
        shortDescription: 1,
        image: 1,
        labels: 1,
      },
    );

    if (!pageSection) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // -----------------------------
    // SPLIT FEATURES STRING
    // -----------------------------

    const setting = await Setting.findOne(
      {},
      {
        logo: 1,
      },
    );

      const authSetting = await AuthkeySetting.findOne({});

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------
    res.json({
      success: true,
      data: {
        logo: setting?.logo,
        bgimage: pageSection.image || "",
        title: pageSection.title || "",
        description: pageSection.shortDescription || "",
        features: pageSection.labels || "",
        authSetting: {
        google: authSetting?.google?.enabled,
        github: authSetting?.github?.enabled,
      }
      },
    });
  } catch (err) {
    console.error("Login Section API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Update Profile
// ==========================================
module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { firstName, lastName, email, phone, bio, timezone, country, state } =
      req.body;

    let updateData = {
      firstName,
      lastName,
      email,
      phone,
      bio,
      timezone,
      country,
      state,
    };

    //  Fetch user ONLY if new image is uploaded
    if (req.file && req.file.filename) {
      const user = await User.findById(userId);

      //  Delete old image ONLY when new image is uploaded
      if (user && user.avatar) {
        const oldImagePath = path.join(__dirname, "..", user.avatar);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Set new image path
      updateData.avatar = `/uploads/profileimage/${req.file.filename}`;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// Get Profile
// ==========================================
module.exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "-otp -otpExpiry  -ip ",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // -------------------------
    //  Get active subscription
    // -------------------------
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    }).populate("planId");

    let subscriptionInfo = null;

    if (subscription && subscription.planId) {
      const plan = subscription.planId;
      const billingType = subscription.billingType;

      const totalWebsite = subscription.totalWebsite || 0;
      const websiteCreated = subscription.websiteCreated || 0;
      const maxPages = subscription.planId.maxPages;
      const websiteremaining = totalWebsite === 0 ? totalWebsite : totalWebsite - websiteCreated;

      const maxSectionsPerPage = subscription.planId.maxSectionsPerPage;
      const formattedFeatures = {};

      Object.keys(plan.features || {}).forEach((key) => {
        formattedFeatures[key] = plan.features[key].status;
      });

      subscriptionInfo = {
        planId: subscription.planId?._id,
        planName: subscription.planId?.name,
        billingType: subscription.billingType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        isActive: true,
        totalWebsite,
        websiteCreated,
        websiteremaining: websiteremaining,
        features: formattedFeatures,
        maxPages,
        maxSectionsPerPage,
      };
    }
    res.json({
      success: true,
      data: {
        badge: "Profile",
        title: "Profile Setting",
        description: "Manage your account settings and preferences",

        user: {
          id: user?._id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          timezone: user.timezone || "",
          bio: user.bio || "",
          avatar: user.avatar || null,
          country: user.country || "",
          state: user.state || "",
          status: user.status || 0,
          emailVerified: user.emailVerified || 0,
          emailNotifications: user.emailNotifications || 0,
          marketingEmails: user.marketingEmails || 0,
          isPass: (user.password == null || user.password == "") ? false : true,
        },

        subscription: subscriptionInfo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ==========================================
// Get Blogs
// ==========================================
module.exports.getBlogs = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne(
      { type: "blogs" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );

    const blogs = await Blog.find(
      {},
      {
        title: 1,
        shortDescription: 1,
        author: 1,
        category: 1,
        image: 1,
        thumbnail: 1,
        createdAt: 1,
        _id: 1,
      },
    ).sort({ createdAt: -1 });

    const posts = blogs.map((blog) => ({
      id: blog._id,
      title: blog.title,
      excerpt: blog.shortDescription,
      category: blog.category,
      date: new Date(blog.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      author: blog.author,
      image: blog.image,
      thumbnail: blog.thumbnail,
    }));

    res.json({
      success: true,
      badge: pageSection?.badge,
      title: pageSection?.title,
      description: pageSection?.shortDescription,
      posts,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// Change password
// ==========================================
module.exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!newPassword || !confirmPassword) {
      return res.status(200).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ===============================
    // FIND USER
    // ===============================
    const user = await User.findById(userId);
  if ((user.password != null) && !currentPassword) {
      return res.status(200).json({
        success: false,
        message: "Current Password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(200).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }


    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    // ===============================
    // CHECK CURRENT PASSWORD
    // ===============================
    if(user.password != null){
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(200).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
  }

    // ===============================
    // HASH NEW PASSWORD
    // ===============================
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // ===============================
    // UPDATE PASSWORD
    // ===============================
    user.password = hashedPassword;
    await user.save();

    // ===============================
    // RESPONSE
    // ===============================
    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Get Blog Details
// ==========================================
module.exports.getBlogDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------
    // Page Section
    // -----------------------------
    const pageSection = await PageSection.findOne(
      { type: "blogs" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );

    // -----------------------------
    // Get Blog Details FIRST
    // -----------------------------
    const blog = await Blog.findById(id, {
      title: 1,
      shortDescription: 1,
      description: 1,
      author: 1,
      category: 1, // STRING name
      image: 1,
      thumbnail: 1,
      createdAt: 1,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // -----------------------------
    // Get SAME category blogs
    // -----------------------------
    const relatedPostsData = await Blog.find(
      {
        category: blog.category, //  name based
        _id: { $ne: blog._id },
      },
      {
        title: 1,
        category: 1,
        _id: 1,
        createdAt: 1,
        thumbnail: 1,
      },
    ).sort({ createdAt: -1 });

    // -----------------------------
    // Map Related Posts
    // -----------------------------
    const relatedPosts = relatedPostsData.map((item) => ({
      id: item._id,
      title: item.title,
      category: item.category,
      image: item.thumbnail,
    }));

    // -----------------------------
    // Final Response (UNCHANGED)
    // -----------------------------
    res.json({
      success: true,
      badge: pageSection?.badge,
      title: pageSection?.title,
      description: pageSection?.shortDescription,
      blogdetails: {
        title: blog.title,
        category: blog.category,
        date: new Date(blog.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        author: blog.author,
        image: blog.image,
        content: blog.description,
        relatedPosts,
      },
    });
  } catch (err) {
    console.error("Blog Combined Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Get Tagline data
// ==========================================
module.exports.getTaglinedata = async (req, res) => {
  try {
    const tags = await Tag.find({}, { tag: 1, _id: 0 }).sort({ createdAt: -1 });

    // ===============================
    // ONLY TITLE ARRAY
    // ===============================
    const data = tags.map((n) => n.tag);

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Tagline API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ===============================
// Get Portfolio Data
// ===============================
module.exports.getPortfolioData = async (req, res) => {
  try {
    // ===============================
    // PAGE SECTION (PORTFOLIO HEADER)
    // ===============================
    const pageSection = await PageSection.findOne(
      { type: "portfolio" },
      {
        badge: 1,
        title: 1,
        special: 1,
        shortDescription: 1,
      },
    );

    // ===============================
    // PORTFOLIO ITEMS
    // ===============================
    const portfolioItems = await Portfolio.find(
      {},
      {
        title: 1,
        description: 1,
        image: 1,
      },
    ).sort({ createdAt: 1 });

    // ===============================
    // FORMAT DATA ARRAY
    // ===============================
    const data = portfolioItems.map((item) => ({
      title: item.title,
      desc: item.description,
      image: item.image,
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.json({
      success: true,
      badge: pageSection?.badge || "Dream Web",
      special: pageSection?.special || "",
      title: pageSection?.title || "Create Your Dream Website",
      description:
        pageSection?.shortDescription ||
        "Choose from professionally designed templates",
      data,
    });
  } catch (err) {
    console.error("Portfolio API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ===============================
// Feature Data
// ===============================
module.exports.getFeatureData = async (req, res) => {
  try {
    // ===============================
    // PAGE SECTION (FEATURE HEADER)
    // ===============================
    const pageSection = await PageSection.findOne(
      { type: "feature" },
      {
        badge: 1,
        title: 1,
        special: 1,
        shortDescription: 1,
      },
    );

    // ===============================
    // FEATURES LIST
    // ===============================
    const featureList = await Feature.find(
      {},
      {
        iconName: 1,
        title: 1,
        description: 1,
      },
    ).sort({ createdAt: 1 });

    // ===============================
    // FORMAT FEATURES
    // ===============================
    const features = featureList.map((item) => ({
      icon: item.iconName,
      title: item.title,
      description: item.description,
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.json({
      success: true,
      badge: pageSection?.badge,
      title: pageSection?.title,
      special: pageSection?.special,
      description: pageSection?.shortDescription,
      features,
      stats: [
        { stat: "99.9%", label: "Uptime" },
        { stat: "< 2min", label: "Generation Time" },
        { stat: "24/7", label: "Support" },
      ],
    });
  } catch (err) {
    console.error("Feature API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ===============================
// HOW IT WORK
// ===============================
module.exports.getHowItWorkData = async (req, res) => {
  try {
    // ===============================
    // PAGE SECTION (HOW IT WORK HEADER)
    // ===============================
    const pageSection = await PageSection.findOne(
      { type: "howitwork" },
      {
        badge: 1,
        title: 1,
        special: 1,
        shortDescription: 1,
        labels: 1,
      },
    );

    // ===============================
    // HOW IT WORK STEPS
    // ===============================
    const stepsData = await HowItWork.find(
      {},
      {
        iconName: 1,
        title: 1,
        description: 1,
        features: 1,
        image: 1,
      },
    ).sort({ createdAt: 1 });

    // ===============================
    // FORMAT STEPS
    // ===============================
    const steps = stepsData.map((step) => ({
      icon: step.iconName,
      title: step.title,
      desc: step.description,
      features: step.features || [],
      image: step.image,
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.json({
      success: true,
      badge: pageSection?.badge,
      special: pageSection?.special,
      title: pageSection?.title,
      description: pageSection?.shortDescription,
      features: pageSection?.labels,
      steps,
    });
  } catch (err) {
    console.error("How It Work API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Get Faq
// ==========================================
module.exports.getFaq = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne(
      { type: "faq" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );
    const faq = await Faq.find(
      {},
      {
        question: 1,
        answer: 1,
        _id: 0,
      },
    );

    res.json({
      success: true,
      badge: pageSection?.badge,
      title: pageSection?.title,
      description: pageSection?.shortDescription,
      items: faq,
    });
  } catch (err) {
    console.error("Faq API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ==========================================
// Get Review
// ==========================================
module.exports.getReview = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne(
      { type: "testimonials" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );
    const reviews = await Testimonial.find(
      {},
      {
        name: 1,
        username: 1,
        image: 1,
        review: 1,
        rating: 1,
        _id: 0,
      },
    );

    let totalRating = 0;

    const formattedReviews = reviews.map((r) => {
      totalRating += Number(r.rating || 0);

      return {
        name: r.name || "",
        role: r.username || "",
        avatar: r.image || "",
        rating: r.rating || 0,
        review: r.review || "",
      };
    });

    // ===============================
    // RATING SUMMARY
    // ===============================
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0.0";

    const ratingSummary = {
      score: Math.round(averageRating),
      text: `${averageRating}/5 from ${totalReviews}+ reviews`,
    };

    // ===============================
    // ACTIVE USERS COUNT (NEW)
    // ===============================
    const activeUsers = await User.countDocuments({
      status: 1,
      emailVerified: 1,
    });

    res.json({
      success: true,
      badge: pageSection?.badge,
      title: pageSection?.title,
      description: pageSection?.shortDescription,
      ratingSummary,
      reviews: formattedReviews,
      activeUsers,
    });
  } catch (err) {
    console.error("Review API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Get Setting
// ==========================================
module.exports.getGeneralData = async (req, res) => {
  try {
    // -----------------------------
    // SETTINGS DATA
    // -----------------------------
    const setting = await Setting.findOne({});

    // -----------------------------
    // PAGE SECTION (CONTACT)
    // -----------------------------
    const pageSection = await PageSection.findOne(
      { type: "contact" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );

    // -----------------------------
    // SAFE RESPONSE
    // -----------------------------
    const response = {
      logo: setting?.logo || "",
      favicon: setting?.favicon || "",
      companyname: setting?.companyName || "",
      email: setting?.emailAddress || "",
      phone: setting?.contactNumber || "",
      defaultLanguages: setting?.defaultLanguages,
      theme: setting?.theme,
      linkedin: setting?.linkedin || "",
      twiter: setting?.twitter || "",
      facebook: setting?.facebook || "",
      instagram: setting?.instagram || "",
      youtube: setting?.youtube || "",

      address: setting?.contactAddress || "",
      supportTime: setting?.supportTime || " ",

      badge: pageSection?.badge || "",
      title: pageSection?.title || "",
      description: pageSection?.shortDescription || "",
      aboutcompany: setting?.aboutcompany || " ",

      map: setting?.mapUrl || "",
      currencysymbol: setting?.currencySymbol || "",
      Currency: setting?.currency || "",
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("General Data API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Get Pricing Plans
// ==========================================
const getPlanButtonLabel = require("../helpers/GetPlanButtonLabel");

function calculatePercentageDiscount(price, percentage) {
  if (!percentage || percentage <= 0) return price;

  const discountAmount = (price * percentage) / 100;
  let finalPrice = price - discountAmount;

  // Safety (negative avoid)
  if (finalPrice < 0) finalPrice = 0;

  return Math.round(finalPrice);
}



const featureLabels = {
  logoFaviconUpload: "Upload your own logo and favicon",
  regenerateWebsite: "Regenerate full website layout",
  regenerateContent: "Regenerate content instantly",
  reorderSection: "Reorder sections easily",
  editContent: "Edit and update section content",
  exportCode: "Download website as HTML package"
};
function getPlanFeatures(plan) {
  const enabledFeatures = Object.entries(plan.features)
    .filter(([_, value]) => value.status === true)
    .map(([key]) => featureLabels[key]);
  return enabledFeatures;
}

function getPlanIncludes(plan, type = "M") {
  const list = [];
  let websiteslimit = (type == "Y") ? plan.yearlyWebsiteLimit : plan.monthlyWebsiteLimit;
  let textcont = (type == "Y") ? "Year" : "Month";

  // 🔹 Limits
  if (websiteslimit === 0) {
    list.push("Unlimited website creation");
  } else {
    if (plan?.isFree) {
      list.push(`Build up to ${websiteslimit} websites every month`);
    } else {
      list.push(`Create up to ${websiteslimit} websites per ${textcont}`);
    }
  }

  if (plan.maxPages === 0) {
    list.push("Unlimited pages per website");
  } else {
    list.push(`Up to ${plan.maxPages} pages per website`);
  }

  if (plan.maxSectionsPerPage === 0) {
    list.push("Unlimited sections per page");
  } else {
    list.push(`Up to ${plan.maxSectionsPerPage} sections per page`);
  }

  // 🔹 Features
  const features = getPlanFeatures(plan);
  features.push("Responsive layouts for all devices");
  features.push("Standard user support");

  return [...list, ...features];
}
exports.getPricingPlans = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne(
      { type: "subscriptions" },
      {
        _id: 0,
        badge: 1,
        title: 1,
        shortDescription: 1,
      },
    );

    const setting = await Setting.findOne({});
    const currencySymbol = setting?.currencySymbol;

    let plans = await PricingPlan.find({ status: true }).sort({ order: 1 });

    const userId = req.query.userId || null;

    let activePlanId = null;
    let activeBillingType = null;
    let isLoggedIn = false;

    if (userId) {
      const activeSub = await UserSubscription.findOne({
        userId,
        status: "active",
      }).lean();

      if (activeSub) {
        activePlanId = String(activeSub.planId);
        activeBillingType = activeSub.billingType;
        isLoggedIn = true;
      }
    }

    const maxYearlyDiscount = Math.max(
      ...plans.map((plan) => plan.yearlyDiscount || 0),
    );

    // MONTHLY ARRAY
    const monthly = plans
      .map((plan) => {
        const price = plan.monthlyPrice || 0;

        let cta = getPlanButtonLabel(plan.name, price);
        let isactive = false;

       if (isLoggedIn) {
  cta = `Get ${plan.name}`;

 if (String(plan._id) === activePlanId && activeBillingType === "monthly") {
            cta = "Active Plan";
            isactive = true;
          } else {
            if (String(plan._id) === activePlanId && plan?.isFree) {
              cta = "Active Plan";
              isactive = true;
            }
          }
        }

        const features = getPlanIncludes(plan, "M");
        let discounts = plan.monthlyDiscount;
        let finalprice = calculatePercentageDiscount(price, discounts);
        return {
          id: plan._id,
          name: plan.name,
          description: plan.shortDescription,
          price: `${currencySymbol}${finalprice}`,
          period: "monthly",
          discount: discounts,
          discountprice: `${currencySymbol}${price}`,
          savings: discounts ? `${discounts}%` : "",
          features,
          cta,
          popular: plan.isPremium || false,
          isactive,
          isfree: plan?.isFree,
        };
      });
    // ANNUAL ARRAY
    const yearly = plans
      .map((plan) => {
        const price = plan.yearlyPrice || 0;

        let cta = getPlanButtonLabel(plan.name, price);
        let isactive = false;
        if (isLoggedIn) {
          cta = `Get ${plan.name}`;

          if (String(plan._id) === activePlanId && activeBillingType === "yearly") {
            cta = "Active Plan";
            isactive = true;
          } else {
            if (String(plan._id) === activePlanId && plan?.isFree) {
              cta = "Active Plan";
              isactive = true;
            }
          }
        }
        const features = getPlanIncludes(plan, "Y");
        let discounts = plan.yearlyDiscount;
        let finalprice = calculatePercentageDiscount(price, discounts);
        return {
          id: plan._id,
          name: plan.name,
          description: plan.shortDescription,
          price: `${currencySymbol}${finalprice}`,
          period: "yearly",
          discount: discounts,
          discountprice: `${currencySymbol}${price}`,
          savings: discounts ? `${discounts}%` : "",
          features,
          cta,
          popular: plan.isPremium || false,
          isactive,
          isfree: plan?.isFree,
        };
      });

    // FINAL RESPONSE
    res.json({
      badge: pageSection?.badge || "Pricing",
      title: pageSection?.title || "",
      description: pageSection?.shortDescription || "",
      toggle: {
        monthly: "Monthly",
        yearly: "Yearly",
        discountBadge: maxYearlyDiscount,
      },
      plans: {
        monthly,
        yearly,
      },
    });
  } catch (err) {
    console.error("Pricing API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Send Reset Link
// ==========================================
module.exports.sendresetlink = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ success: false, message: "Email not found" });

    // Delete old tokens
    await UserResetPasswordToken.deleteMany({ userId: user._id });

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await new UserResetPasswordToken({
      userId: user._id,
      token,
      expiresAt,
    }).save();

    // Link that your UI (frontend) will open
    const frontendURL = process.env.FRONTEND_BASE_URL;
    const resetLink = `${frontendURL}/setnewpassword?token=${token}`;
    const setting = await Setting.findOne({});

    const emailVars = {
      firstName: user.firstName,
      site_name: setting?.companyName,
      reset_link: resetLink,
      site_logo: setting?.logo ? process.env.BASE_URL + setting?.logo : ""
    };

    await sendTemplateEmail("reset_password", email, emailVars);

    res.json({
      success: true,
      message: "Password reset link sent to your email!",
    });
  } catch (err) {
    console.error("Error sending reset link:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send reset link" });
  }
};

// ==========================================
// Reset Password
// ==========================================
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
      return res
        .status(200)
        .json({ success: false, message: "Passwords do not match" });

    const tokenDoc = await UserResetPasswordToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc)
      return res
        .status(200)
        .json({ success: false, message: "Invalid or expired token" });

    const user = await User.findById(tokenDoc.userId);
    if (!user)
      return res
        .status(200)
        .json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await UserResetPasswordToken.findByIdAndDelete(tokenDoc._id);

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// User Contact Us
// ==========================================
module.exports.contactUs = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // VALIDATION
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(200).json({
        success: false,
        message: "All required fields must be filled!",
      });
    }

    const newInquiry = await Inquiry.create({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
    });

    res.json({
      success: true,
      message: "Message submitted successfully!",
      data: {
        id: newInquiry._id,
        firstName: newInquiry.firstName,
        lastName: newInquiry.lastName,
        email: newInquiry.email,
        phone: newInquiry.phone,
        subject: newInquiry.subject,
        message: newInquiry.message,
        createdAt: newInquiry.createdAt,
      },
    });
  } catch (err) {
    console.error("Error submitting message:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// =====================
// GET ALL CATEGORIES
// =====================
module.exports.getBusinessTypeData = async (req, res) => {
  try {
    const BusinessTypeData = await BusinessType.find(
      { status: true },
      {
        _id: 1,
        type: 1,
        iconName: 1,
        shortDescription: 1,
      },
    );

    res.json({
      success: true,
      data: BusinessTypeData,
    });
  } catch (err) {
    console.error("Get Categories Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================================
// Get Category Data (STATIC)
// ================================
module.exports.getCategoryData = async (req, res) => {
  try {
    const response = {
      success: true,
      items: [
        "All",
        "AI & Automation",
        "No-Code",
        "Tutorials",
        "Design & UX",
        "Business & Startups",
        "SEO & Marketing",
        "eCommerce",
      ],
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("getCategoryDataData error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// =====================
// GET CTA DATA
// =====================
module.exports.getCtaData = async (req, res) => {
  try {
    // -----------------------------
    // GET CTA PAGE SECTION
    // -----------------------------
    const pageSection = await PageSection.findOne(
      { type: "cta" },
      {
        _id: 0,
        title: 1,
        shortDescription: 1,
        subtitle: 1,
      },
    );

    // -----------------------------
    // SAFE RESPONSE
    // -----------------------------
    res.json({
      success: true,
      cta: {
        title: pageSection?.title || "",
        description: pageSection?.shortDescription || "",
        subtitle: pageSection?.subtitle || "",
      },
    });
  } catch (err) {
    console.error("CTA API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================
// GET ALL COUNTRIES
// =====================
module.exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find(
      { status: true },
      { _id: 1, name: 1 },
    ).sort({ name: 1 });

    res.json({
      success: true,
      data: countries,
    });
  } catch (err) {
    console.error("Get Countries Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// GET STATES BY COUNTRY
// =====================
module.exports.getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const states = await State.find(
      {
        country: countryId,
        status: true,
      },
      { _id: 1, name: 1 },
    ).sort({ name: 1 });

    res.json({
      success: true,
      data: states,
    });
  } catch (err) {
    console.error("Get States Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// Create Ticket
// =====================
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(200).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(200).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Fetch actual user details
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "User not found" });
    }

    // Handle attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((f) => ({
        file: f.filename,
        url: "/uploads/tickets/" + f.filename,
      }));
    }

    // Sender object
    const senderData = {
      _id: user._id,
      name: user.firstName + " " + user.lastName,
      username: user.username,
      email: user.email,
    };

    const ticketData = new SupportTicket({
      subject,
      submittedBy: user._id,
      status: "open",
      messages: [
        {
          sender: senderData,
          senderModel: "User",
          message,
          attachments,
        },
      ],
    });

    if (priority) {
      ticketData.priority = priority.toLowerCase();
    }
    const ticket = new SupportTicket(ticketData);
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket submitted",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
// =====================
// REPLY TO TICKET
// =====================
exports.replyToTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message)
      return res
        .status(400)
        .json({ success: false, message: "Message required" });

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    // Handle attachments
    const attachments = (req.files || []).map((f) => ({
      file: f.filename,
      url: "/uploads/tickets/" + f.filename,
    }));

    // Check sender type
    const isAdmin = !!req.session?.adminId;
    const senderId = isAdmin ? req.session.adminId : req.user._id;

    let senderData;

    if (isAdmin) {
      const admin = await Admin.findById(senderId).lean();
      if (!admin) {
        return res
          .status(404)
          .json({ success: false, message: "Admin not found" });
      }
      senderData = {
        _id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
      };
    } else {
      const user = await User.findById(senderId).lean();
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      senderData = {
        _id: user._id,
        name: user.firstName + " " + user.lastName,
        username: user.username,
        email: user.email,
      };
    }

    // Create message
    const newMessage = {
      sender: senderData,
      senderModel: isAdmin ? "Admin" : "User",
      message,
      attachments,
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage);

    // Update status
    ticket.status =
      ticket.submittedBy.toString() === senderId.toString()
        ? "open"
        : "answered";
    ticket.lastReply = new Date();

    await ticket.save();

    const savedMessage = ticket.messages[ticket.messages.length - 1];

    res.json({ success: true, newMessage: savedMessage, ticketId });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// USER GET TICKETS
// =====================
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";
    const statusFilter = req.query.status?.trim() || "";

    // Base filter
    let filter = { submittedBy: userId };

    if (statusFilter && statusFilter !== "all") {
      filter.status = statusFilter.toLowerCase();
    }

    if (search !== "") {
      filter = {
        submittedBy: userId,
        $or: [
          { subject: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Sorting
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Total Documents
    const totalRecords = await SupportTicket.countDocuments({
      submittedBy: userId,
    });

    // Filtered count
    const filteredRecords = await SupportTicket.countDocuments(filter);

    // Fetch paginated data BUT only selected fields
    const tickets = await SupportTicket.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const statsAggregation = await SupportTicket.aggregate([
      { $match: { submittedBy: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert aggregation to easy object
    const statusCount = {
      open: 0,
      answered: 0,
      closed: 0,
    };

    statsAggregation.forEach((item) => {
      statusCount[item._id] = item.count;
    });

    const formattedTickets = tickets.map((ticket, index) => {
      const repliesCount = ticket.messages?.length
        ? ticket.messages.length - 1 // first message excluded
        : 0;

      const updatedAt =
        ticket.lastReply || ticket.updatedAt || ticket.createdAt;

      return {
        id: ticket._id,
        subject: ticket.subject,
        status: ticket.status
          ? ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)
          : "-",
        priority: ticket.priority
          ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)
          : "-",
        created: moment(ticket.createdAt).fromNow(),
        updated: moment(updatedAt).fromNow(),
        replies: repliesCount,
      };
    });

    // Response
    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords,
        filteredRecords,
        totalPages: Math.ceil(filteredRecords / limit),
      },
      tickets: formattedTickets,
      stats: [
        {
          label: "Open Tickets",
          value: String(statusCount.open),
          icon: "AlertCircle",
        },
        {
          label: "Closed Tickets",
          value: String(statusCount.closed),
          icon: "XCircle",
        },
        {
          label: "Answered Tickets",
          value: String(statusCount.answered),
          icon: "Clock",
        },
      ],
    });
  } catch (err) {
    console.error("Get User Tickets Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// USER GET TICKETS DETAILS
// =====================
exports.getSingleTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    // Populate sender (User/Admin)

    const ticket = await SupportTicket.findById(ticketId).lean();

    if (!ticket) {
      return res.status(200).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ===============================
    // FORMAT HISTORY (MESSAGES)
    // ===============================
    const history = ticket.messages.map((msg, index) => {
      const isAdmin = msg.senderModel === "Admin";

      return {
        id: index + 1,
        role: isAdmin ? "admin" : "user",
        name: msg.sender?.name || (isAdmin ? "Support Team" : "User"),
        attachments: msg.attachments?.map((a) => a.url) || [],
        message: msg.message,
        timestamp: moment(msg.createdAt).format("hh:mm A"),
      };
    });

    // Final response
    res.json({
      success: true,
      data: {
        id: ticket._id,
        subject: ticket.subject,
        status: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1),
        priority:
          ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),
        created: moment(ticket.createdAt).format("MMM DD, YYYY [at] hh:mm A"),
        history,
      },
    });
  } catch (err) {
    console.error("Get Single Ticket Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// USER GET DATA PAYMENT
// =====================
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const statusQuery = req.query.status?.trim() || "";

    let filter = {
      userId,
      status: { $ne: "open" },
    };

    if (statusQuery !== "") {
      const statusMap = {
        success: "success",
        failed: "failed",
      };

      if (statusMap[statusQuery]) {
        filter.status = statusMap[statusQuery];
      }
    }
    if (search !== "") {
      const matchingPlans = await PricingPlan.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const planIds = matchingPlans.map((plan) => plan._id);

      filter.$or = [
        { gateway: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },

        { productId: { $in: planIds } },

        {
          "totals.totalAmount": !isNaN(search) ? Number(search) : null,
        },
      ].filter(Boolean);
    }

    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // ===============================
    // METRICS
    // ===============================
    const result = await Payment.aggregate([
      {
        $match: {
          userId: userId,
          status: { $in: ["success", "failed"] },
        },
      },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$totals.totalAmount" },
        },
      },
    ]);

    let successAmount = 0;
    let failedAmount = 0;

    result.forEach((item) => {
      if (item._id === "success") {
        successAmount = item.totalAmount;
      }
      if (item._id === "failed") {
        failedAmount = item.totalAmount;
      }
    });

    const totalpayment = {
      totalAmount: successAmount + failedAmount,
      successAmount,
      failedAmount,
    };

    const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Jan 1
    const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1); // Next Jan 1

    const yearlyResult = await Payment.aggregate([
      {
        $match: {
          userId: userId,
          status: "success",
          createdAt: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totals.totalAmount" },
        },
      },
    ]);

    const thisYearPayment = {
      totalAmount: yearlyResult.length > 0 ? yearlyResult[0].totalAmount : 0,
    };

    const totalRecords = await Payment.countDocuments({ userId });
    const filteredRecords = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(filteredRecords / limit);

    const payments = await Payment.find(filter)
      .populate("productId", "name")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const settings = await Setting.findOne({});

    const currencySymbol = settings?.currencySymbol || "";
    const currency = settings?.currency || "";

    const transactions = (payments || []).map((p, index) => {
      // Custom readable payment id
      const shortTransactionId = p.transactionId
        ? `${p.transactionId.slice(0, 6)}...${p.transactionId.slice(-4)}`
        : "-";

      return {
        _id: p._id,
        id: shortTransactionId,

        // Date formatted
        date: moment(p.createdAt).format("MMM DD, YYYY"),

        // Amount with currency
        amount:
          `${currencySymbol || ""} ${p?.amount?.toFixed(2)} ${currency || ""}`.trim(),

        charge:
          `${currencySymbol || ""} ${p?.totals?.totalCharge?.toFixed(2)}`.trim(),

        totalAmount:
          `${currencySymbol || ""} ${p?.totals?.totalAmount?.toFixed(2)} ${currency || ""}`.trim(),
        // Plan name
        plan: p.productId?.name || "N/A",

        // Status mapping
        status: p.status === "success" ? "Success" : "Failed",

        // Payment method (static mask – no schema change)
        method: p.gateway,

        // Invoice file/url
        invoice: p.invoiceUrl || null,

        // Subscription or One-time
        type:
          p.billingType === "yearly" || p.billingType === "monthly"
            ? "Subscription"
            : "One-time",
      };
    });

    res.json({
      success: true,
      data: {
        metrics: {
          successful: totalpayment.successAmount,
          failed: totalpayment.failedAmount,
          yearly: thisYearPayment.totalAmount,
          totalpayment: totalpayment.totalAmount,
        },
        transactions: transactions,
        pagination: {
          totalRecords,
          filteredRecords,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    });
  } catch (err) {
    console.error("Get User Payments Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// FRONTEND DASHBOARD
// =====================
module.exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalWebsites = await Preference.countDocuments({ userId });
    const totalSupportticket = await SupportTicket.countDocuments({
      submittedBy: userId,
    });
    const result = await Payment.aggregate([
      { $match: { userId: userId, status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totals.totalAmount" },
        },
      },
    ]);
    const totalpayment = {
      totalAmount: result.length > 0 ? result[0].totalAmount : 0,
    };

    const activePlan = await UserSubscription.findOne({
      userId: userId,
      status: "active",
    }).populate("planId", "name");

    const settings = await Setting.findOne({});

    const currencySymbol = settings?.currencySymbol || "";
    const currency = settings?.currency || "";

    const dashboardData = {
      stats: [
        {
          label: "Total Websites",
          value: totalWebsites.toString(),
          change: totalWebsites.toString(),
        },
        {
          label: "Total Suppport Ticket",
          value: totalSupportticket.toString(),
          change: totalSupportticket.toString(),
        },
        {
          label: "Total Payment",
          value: `${currencySymbol || ""} ${totalpayment.totalAmount} `,
          change: `${currencySymbol || ""} ${totalpayment.totalAmount}`,
        },
        {
          label: "Active Plan",
          value: activePlan?.planId?.name || "No Active Plan",
          change: activePlan?.endDate
            ? new Date(activePlan.endDate).toLocaleDateString("en-IN")
            : "N/A",
        },
      ],
    };

    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    dashboardData.activities = activities.map((act) => ({
      action: act.action,
      target: act.target,
      time: new Date(act.createdAt).toLocaleString(),
      atypes: act.atypes
    }));

    // --------------------- RESPONSE ---------------------
    return res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// =====================
// Newsletter Subscription
// =====================
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(200).json({
        success: false,
        message: "Email is required.",
      });

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing)
      return res.status(200).json({
        success: false,
        message: "This email is already subscribed!",
      });

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the newsletter!",
      data: newSubscriber,
    });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    res.status(200).json({
      success: false,
      message: "Server error while subscribing.",
    });
  }
};

// ================================
//payment gateway integration file
// ================================
const {
  createStripePayment,
  createRazorpayPayment,
  createPaypalPayment,
  createBraintreePayment,
  captureBraintreePayment,
  createPayHerePayment,
  createBraintreeToken,
} = require("../helpers/Payment");

module.exports.createPayment = async (req, res) => {
  try {
    const { amount, currency, productId, gateway, billingType, charge, nonce } =
      req.body;
    const userId = req.user._id;

    if (!userId || !amount || !currency || !productId || !gateway)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    let paymentData;

    switch (gateway.toLowerCase()) {
      case "stripe":
        paymentData = await createStripePayment({
          amount,
          currency,
          productId,
          billingType,
          userId,
          charge,
        });
        break;

      case "paypal":
        paymentData = await createPaypalPayment({
          amount,
          currency,
          productId,
          billingType,
          userId,
          charge,
        });
        break;

      case "razorpay":
        paymentData = await createRazorpayPayment({
          amount,
          currency,
          productId,
          billingType,
          userId,
          charge,
        });
        break;

      case "braintree":
        paymentData = await createBraintreePayment({
          amount,
          currency,
          productId,
          billingType,
          userId,
          charge,
          nonce
        });
        break;

      case "payhere":
        paymentData = await createPayHerePayment({
          amount,
          currency,
          productId,
          billingType,
          userId,
          charge,
        });
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment gateway" });
    }

    res.json({ success: true, ...paymentData });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message || "Payment creation error" });
  }
};


// ================================
// Verify Payment
// ================================
module.exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(200).json({
        success: false,
        message: "Invalid payment response",
      });
    }

    // Get Razorpay config from DB
    const razorpayConfig = await PaymentGateway.findOne({
      name: "razorpay",
      enabled: true,
    });

    if (!razorpayConfig) {
      return res.status(200).json({
        success: false,
        message: "Razorpay configuration not found",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", razorpayConfig.secretKey)
      .update(body)
      .digest("hex");

   
    if (expectedSignature !== razorpay_signature) {
      return res.status(200).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const transaction = await Payment.findOneAndUpdate(
      {
        transactionId: razorpay_order_id,
      },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      transactionId: razorpay_order_id,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Verification error",
      error: error.message,
    });
  }
};


// ================================
// get endpoint for Braintree token
// ================================
module.exports.getBraintreeToken = async (req, res) => {
  try {
    let paymentData = await createBraintreeToken();
    res.json({ success: true, ...paymentData });
  } catch (err) {
    console.error("Braintree capture error:", err);
    res
      .status(500)
      .json({ success: false, message: "Braintree capture error" });
  }
};
// ================================
// Capture endpoint for Braintree
// ================================
module.exports.captureBraintree = async (req, res) => {
  try {
    const { paymentId, nonce, amount } = req.body;
    if (!paymentId || !nonce || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const result = await captureBraintreePayment({ paymentId, nonce, amount });
    res.json({ success: result.success, result });
  } catch (err) {
    console.error("Braintree capture error:", err);
    res
      .status(500)
      .json({ success: false, message: "Braintree capture error" });
  }
};

// ==========================================
// Resend code
// ==========================================
module.exports.resendcode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({
        success: false,
        message: "Email is required.",
        status: "0",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found.",
        status: "0",
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: false,
        message: "Email already verified.",
        status: "0",
      });
    }

    // Generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save OTP and expiry
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const setting = await Setting.findOne({});
    const emailVars = {
      firstName: user.firstName,
      site_name: setting?.companyName,
      otp,
      site_logo: setting?.logo ? process.env.BASE_URL + setting?.logo : ""
    };
    //  Send via template
    await sendTemplateEmail("resend_otp", email, emailVars);

    return res.json({
      success: true,
      message: "OTP resent to your email.",
      status: "1",
      userId: user._id,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      status: "0",
    });
  }
};

// ==========================================
// Get Hero Section
// ==========================================
module.exports.getHeroSection = async (req, res) => {
  try {
    const heroSection = await PageSection.findOne(
      { type: "hero" },
      {
        title: 1,
        shortDescription: 1,
        herofetures: 1,
        labels: 1,
        special: 1,
      },
    );

    const heroStats = await HeroStat.find().sort({ createdAt: -1 });

    const data = {
      headline: {
        prefix: heroSection.title || "",
        suffix: heroSection.special || "",
      },
      description: heroSection.shortDescription || "",
      features: heroSection.herofetures || [],
      stats: heroStats.map((item, index) => ({
        id: index + 1,
        label: item.label || "",
        value: item.count || "",
        icon: item.iconName || "",
      })),
      trendingBadge: heroSection.labels || [],
    };

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("Hero Section API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// Get All PaymentGateway
// ==========================================
module.exports.getAllGateways = async (req, res) => {
  try {
    const settings = await Setting.findOne({});

    const currencySymbol = settings?.currencySymbol || "$";
    const currency = settings?.currency || "USD";
    const gateways = await PaymentGateway.find(
      { enabled: true },
      {
        name: 1,
        fixedCharge: 1,
        iconName: 1,
      },
    );

    const data = gateways.map((gw) => ({
      ...gw.toObject(),
      currencySymbol,
      currency,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, data: [] });
  }
};

async function getBuilderLibrary(selectedPages = []) {
  const activePages = await PageLibrary.find({ isActive: true })
    .sort({ order: 1, label: 1 })
    .lean();

  const activeSections = await SectionsLibrary.find({ isActive: true })
    .sort({ order: 1, label: 1 })
    .lean();

  const allPages = activePages.map((page) => page.name);

  let finalPages = (selectedPages || []).filter((page) =>
    allPages.includes(page),
  );

  if (!finalPages.length) {
    finalPages = activePages
      .filter((page) => page.isCore)
      .map((page) => page.name);

    if (!finalPages.length) {
      finalPages = allPages.slice(0, 3);
    }
  }

  const allowedSections = activeSections.map((section) => section.type);

  const sectionVariants = activeSections.reduce((acc, section) => {
    acc[section.type] = section.variants || [];
    return acc;
  }, {});

  return {
    allPages,
    selectedPages: finalPages,
    sections: activeSections,
    allowedSections,
    sectionVariants,
  };
}

// ==========================================
// Get Preferance
// ==========================================
const {
  generateWebsiteOpenAI,
  generateWebsiteGeminiAI,
  validateAndFixAIResponse,
  getDefaultPagesByIndustry,
  buildFullGeneratePrompt,
  buildContentOnlyPrompt,
  generateScreenshot,
  filterAIResponse,
  retryAsync,
} = require("../helpers/Preference");
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
exports.createPreferenceWithAI = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(200).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const { websiteName, description, industry, color, designStyle, font } =
      req.body;

    const userId = req.user._id;

    const { categoryId } = req.params;

    // =========================
    // BASIC VALIDATION
    // =========================
    if (!websiteName || !color?.primaryColor || !categoryId) {
      return res.status(200).json({
        success: false,
        message:
          "Please fill in all required fields before generating your website.",
      });
    }

    const user = await User.findById(userId).select("firstName");
    // =========================
    // GET BUSINESS TYPE NAME
    // =========================
    const websiteType = await BusinessType.findById(categoryId).select("type");

    if (!websiteType) {
      return res.status(200).json({
        success: false,
        message: "Invalid Business Type",
      });
    }

    // =========================
    // CHECK ACTIVE SUBSCRIPTION
    // =========================
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    }).populate("planId");
    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "Your plan has expired. Please upgrade your plan.",
      });
    }

    // =========================
    // CHECK PLAN EXPIRY
    // =========================
    const now = new Date();
    if (!subscription.isFree && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();

      return res.status(200).json({
        success: false,
        message:
          "Your subscription is expired. Please select a plan to continue.",
      });
    }

    // =========================
    // CHECK WEBSITE LIMIT
    // =========================
    const isUnlimited = subscription.totalWebsite === 0;

    if (!isUnlimited) {
      if (subscription.websiteCreated >= subscription.totalWebsite) {
        return res.status(200).json({
          success: false,
          message: subscription.isFree ? "Your monthly limit reached. Upgrade your plan to continue." : "website limit reached. Upgrade your plan to continue.",
        });
      }
    }

    // =========================
    // GENERATE AI RESPONSE
    // =========================
    const apikeysetting = await ApikeySetting.findOne({}).lean();

    if (!apikeysetting) {
      return res.status(200).json({
        success: false,
        message: "API key settings not configured.",
      });
    }

    let pages = getDefaultPagesByIndustry(industry);
    let sections = [];
    let aiResponse = null;
    let fixedPages = [];

    // 1. DB se pages + sections lao
    const { selectedPages, allPages, allowedSections, sectionVariants } =
      await getBuilderLibrary(pages);

    let brand_ton = getRandomItem(["professional", "friendly", "creative", "corporate"])
    let arrayList = {
      websiteName: websiteName,
      description: description,
      websiteType: websiteType.type,
      industry,
      designStyle,
      brandTone: brand_ton,
      contentLength: "Medium",
      selectedPages,
      allPages,
      allowedSections,
      sectionVariants,
      sectionSchemas: sectionSchemas,
      maxPages: subscription?.totalPageLimite,
      maxSectionsPerPage: subscription?.totalSectionLimite
    };

    let prompt = buildFullGeneratePrompt(arrayList);  

    try {
      // 🔥 Step 1: Try Gemini first (if enabled)
      if (apikeysetting.geminiApi?.enabled === true) {
        const apiKey = apikeysetting.geminiApi.apiKey;

        try {
          aiResponse = await retryAsync(() =>
            generateWebsiteGeminiAI(prompt, apiKey)
          );
        } catch (err) {
          console.log("Gemini failed:", err?.message);

          // 🔥 Step 2: fallback to OpenAI (if enabled)
          if (apikeysetting.openAi?.enabled === true) {
            const openKey = apikeysetting.openAi.apiKey;

            aiResponse = await retryAsync(() =>
              generateWebsiteOpenAI(prompt, openKey)
            );
          } else {
            throw err; // no fallback available
          }
        }
      }

      // 🔥 Step 3: If Gemini not enabled → use OpenAI
      else if (apikeysetting.openAi?.enabled === true) {
        const apiKey = apikeysetting.openAi.apiKey;

        aiResponse = await retryAsync(() =>
          generateWebsiteOpenAI(prompt, apiKey)
        );
      }

      // ❌ No provider
      else {
        return res.status(200).json({
          success: false,
          message: "No AI provider enabled",
        });
      }
    } catch (error) {
      console.error("AI FINAL ERROR:", error);
      return res.status(200).json({
        success: false,
        message: "Failed to generate website. Please try again.",
      });
    }

    if (aiResponse != null) {
      // 4. Validate/fix
      let fixedPagesdata = await validateAndFixAIResponse(
        aiResponse.pages,
        selectedPages,
        allowedSections,
        sectionVariants,
      );
      fixedPages = filterAIResponse(fixedPagesdata, subscription?.totalPageLimite, subscription?.totalSectionLimite)
    }
    let userInput = {
      pages: fixedPages ? fixedPages.map(p => p.id) : [],
      sections: sections,
    };
    // =========================
    // SAVE PREFERENCE
    // =========================

    const finalConfig = {
      site: {
        websiteName,
        description,
        industry,
      },

      theme: {
        primaryColor: color?.primaryColor || "",
        secondaryColor: color?.secondaryColor || "",
        accent: color?.accent || "",
        backgroundColor: color?.backgroundColor || "#ffffff",
      },

      typography: {
        font: font || "",
        headingSize: "",
        fontWeight: "",
        lineSpacing: "",
      },

      layout: {
        containerWidth: "fullwidth",
        sectionSpacing: "compact",
        borderRadius: "small",
      },

      branding: {
        logo: "",
        favicon: "",
      },

      ui: {
        buttonStyle: "rounded",
        brandTone: brand_ton,
        contentLength: "medium",
        designStyle: designStyle || "modern",
      },

      animations: {
        style: "smooth",
      },

      // 🔥 AI ka output
      pages: fixedPages || [],
    };

    const preference = await Preference.create({
      userId,
      subscriptionId: subscription._id,
      categoryId,
      name: websiteName,
      userInput: userInput,
      config: finalConfig,
    });

    subscription.websiteCreated += 1;
    await subscription.save();
    // =========================
    // CREATE NOTIFICATION
    // =========================
    await Notification.create({
      userId,
      subject: "Website Generated",
      message: `"${websiteName}" has been generated by ${user.firstName}.`,
    });

    // =========================
    // USER ACTIVITY
    // =========================
    await UserActivity.create({
      userId,
      action: "Preference Generate",
      target: websiteName,
      atypes: "website_generated",
    });

    const folderName = preference._id.toString();
    const zipRootFolder = path.join(
      process.cwd(),
      "uploads",
      "websites",
      "exports",
    );
    if (!fs.existsSync(zipRootFolder))
      fs.mkdirSync(zipRootFolder, { recursive: true });

    const websiteFolder = path.join(zipRootFolder, folderName);
    if (!fs.existsSync(websiteFolder))
      fs.mkdirSync(websiteFolder, { recursive: true });

    // CSS / JS / Fonts folders
    const cssDir = path.join(websiteFolder, "css");
    const jsDir = path.join(websiteFolder, "js");
    const fontsDir = path.join(websiteFolder, "fonts");
    const imgDir = path.join(websiteFolder, "img");

    [cssDir, jsDir, fontsDir, imgDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    // =========================
    // RESPONSE
    // =========================
    res.status(200).json({
      success: true,
      message: "Website generated & preference saved successfully",
      id: preference._id,
    });
  } catch (error) {
    console.log("error-----", error)
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
function extractPreviousVariants(pages) {
  const map = {};

  pages.forEach(page => {
    map[page.id] = {};

    page.sections.forEach(section => {
      map[page.id][section.type] = section.variant;
    });
  });

  return map;
}

const convertToSectionVariants = (pagesData) => {
  const result = {};
  
  Object.values(pagesData).forEach((page) => {
    Object.entries(page).forEach(([section, variant]) => {
      if (!result[section]) {
        result[section] = [];
      }
      
      // avoid duplicate
      if (!result[section].includes(variant)) {
        result[section].push(variant);
      }
    });
  });

  return result;
};
exports.regeneratePreferenceWithAI = async (req, res) => {
  try {
    const { preferenceId } = req.params;
    const { brandTone, designStyle, contentLength, activepages, mode } =
      req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(200).json({
        success: false,
        message: "Please login to continue",
      });
    }
    // Validate using the PARSED updateData
    if (!preferenceId) {
      return res
      .status(200)
      .json({ success: false, message: "preferenceId required" });
    }

    const preference = await Preference.findOne({ _id: preferenceId, userId });
    if (!preference) {
      return res
        .status(200)
        .json({ success: false, message: "Preference not found" });
    }

    // =========================
    // CHECK ACTIVE SUBSCRIPTION
    // =========================
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    }).populate("planId");
    
    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "No active subscription found. Please purchase a plan.",
      });
    }

  // =========================
    // CHECK PLAN EXPIRY
    // =========================
    const now = new Date();
    if (!subscription.isFree && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();
      
      return res.status(200).json({
        success: false,
        message:
          "Your subscription is expired. Please select a plan to continue.",
      });
    }
    
    // =========================
    // GET BUSINESS TYPE NAME
    // =========================
    const websiteType = await BusinessType.findById(
      preference?.categoryId,
    ).select("type");
    
    if (!websiteType) {
      return res.status(200).json({
        success: false,
        message: "Invalid Business Type",
      });
    }
    // =========================
    // GENERATE AI RESPONSE
    // =========================
    const apikeysetting = await ApikeySetting.findOne({}).lean();

    if (!apikeysetting) {
      return res.status(200).json({
        success: false,
        message: "API key settings not configured.",
      });
    }

    let pages = activepages ?? getDefaultPagesByIndustry(industry);
    let aiResponse = null;
    let fixedPages = [];

    // 1. DB se pages + sections lao
    const { selectedPages, allPages, allowedSections, sectionVariants } =
      await getBuilderLibrary(pages);

    const websiteName = preference?.config?.site?.websiteName || "";
    const description = preference?.config?.site?.description || "";
    const industry = preference?.config?.site?.industry || "";
    const selectedPagess = selectedPages || preference?.config?.selectedPages;
    const existingPages = preference?.config?.pages || [];
const previousVariants = extractPreviousVariants(existingPages);

    let prompt = "";
    if (mode === "content-only") {
      prompt = buildContentOnlyPrompt({
        websiteName: websiteName,
        description: description,
        websiteType: websiteType.type,
        industry: industry,
        designStyle: designStyle,
        brandTone: brandTone,
        contentLength: contentLength,
        existingPages: existingPages,
        sectionSchemas: sectionSchemas,
        maxPages: subscription?.totalPageLimite,
        maxSectionsPerPage: subscription?.totalSectionLimite
      });
    } else {
const previousVariantsPrompt = convertToSectionVariants(previousVariants);

      prompt = buildFullGeneratePrompt({
        websiteName: websiteName,
        description: description,
        websiteType: websiteType.type,
        industry: industry,
        selectedPages: selectedPagess,
        designStyle: designStyle,
        brandTone: brandTone,
        contentLength: contentLength,
        allPages: allPages,
        allowedSections: allowedSections,
        sectionVariants: sectionVariants,
        sectionSchemas: sectionSchemas,
        maxPages: subscription?.totalPageLimite,
        maxSectionsPerPage: subscription?.totalSectionLimite,
        previousVariantsPrompt:previousVariantsPrompt
      });
    }

    try {
      // 🔥 Step 1: Try Gemini first (if enabled)
      if (apikeysetting.geminiApi?.enabled === true) {
        const apiKey = apikeysetting.geminiApi.apiKey;

        try {
          aiResponse = await retryAsync(() =>
            generateWebsiteGeminiAI(prompt, apiKey)
          );
        } catch (err) {
          console.log("Gemini failed:", err?.message);

          // 🔥 Step 2: fallback to OpenAI (if enabled)
          if (apikeysetting.openAi?.enabled === true) {
            const openKey = apikeysetting.openAi.apiKey;

            aiResponse = await retryAsync(() =>
              generateWebsiteOpenAI(prompt, openKey)
            );
          } else {
            throw err; // no fallback available
          }
        }
      }

      // 🔥 Step 3: If Gemini not enabled → use OpenAI
      else if (apikeysetting.openAi?.enabled === true) {
        const apiKey = apikeysetting.openAi.apiKey;

        aiResponse = await retryAsync(() =>
          generateWebsiteOpenAI(prompt, apiKey)
        );
      }

      // ❌ No provider
      else {
        return res.status(200).json({
          success: false,
          message: "No AI provider enabled",
        });
      }
    } catch (error) {
      console.error("AI FINAL ERROR:", error);
      return res.status(200).json({
        success: false,
        message: "Failed to generate website. Please try again.",
      });
    }
    
    if (aiResponse != null) {

      let ifpreviousVariants = (mode === "content-only") ? {} : previousVariants


      //  Validate/fix
      let fixedPagesdata = await validateAndFixAIResponse(
        aiResponse.pages,
        selectedPagess,
        allowedSections,
        sectionVariants,
        ifpreviousVariants
      );
      fixedPages = filterAIResponse(fixedPagesdata, subscription?.totalPageLimite, subscription?.totalSectionLimite)
    }

    preference.config.ui.brandTone = brandTone;
    preference.config.ui.designStyle = designStyle;
    preference.config.ui.contentLength = contentLength;
    preference.config.pages = fixedPages;
    preference.userInput.pages = fixedPages ? fixedPages.map(p => p.id) : [];
    
    await preference.save();
    await UserActivity.create({
      userId,
      action: "Preference Update",
      target: preference.name,
      atypes: "preference_update",
    });

    res.status(200).json({
      success: true,
      message:
      mode === "content-only"
          ? "Content updated successfully ✨"
          : "Layout regenerated successfully 🚀",
      id: preferenceId,
    });
  } catch (error) {
    console.error("Update Preference Response Error:", error);
    res
    .status(500)
      .json({
        success: false,
        message: "Failed to generate layout. Try again.",
      });
  }
};
// ==========================================
// DUplicate Website
// ==========================================

exports.dupalicatWebsite = async (req, res) => {
  try {

    if (!req.user._id) {
      return res.status(200).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const { websiteId, websiteName } = req.body;
    const userId = req.user._id;
    const user = req.user;

    if (!websiteId || !websiteName) {
      return res.status(200).json({
        success: false,
        message: "Website name & Id is required.",
      });
    }

    // =========================
    // FIND ORIGINAL WEBSITE
    // =========================

    const oldPreference = await Preference.findOne({
      _id: websiteId,
      userId,
      isActive: true,
    }).lean();

    if (!oldPreference) {
      return res.status(200).json({
        success: false,
        message: "Website not found.",
      });
    }

    // =========================
    // CHECK ACTIVE SUBSCRIPTION
    // =========================
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    }).populate("planId");
    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "Your plan has expired. Please upgrade your plan.",
      });
    }

    // =========================
    // CHECK PLAN EXPIRY
    // =========================
    const now = new Date();
    if (!subscription.isFree && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();

      return res.status(200).json({
        success: false,
        message:
          "Your subscription is expired. Please select a plan to continue.",
      });
    }

    // =========================
    // CHECK WEBSITE LIMIT
    // =========================
    const isUnlimited = subscription.totalWebsite === 0;

    if (!isUnlimited) {
      if (subscription.websiteCreated >= subscription.totalWebsite) {
        return res.status(200).json({
          success: false,
          message: subscription.isFree ? "Your monthly limit reached. Upgrade your plan to continue." : "website limit reached. Upgrade your plan to continue.",
        });
      }
    }

    // =========================
    // DUPLICATE CONFIG
    // =========================

    const config = JSON.parse(JSON.stringify(oldPreference.config));

    config.site.websiteName = websiteName;

    // =========================
    // CREATE NEW PREFERENCE
    // =========================

    const preference = await Preference.create({

      userId,

      subscriptionId: oldPreference.subscriptionId,

      categoryId: oldPreference.categoryId,

      name: websiteName,

      status: "draft",

      userInput: oldPreference.userInput,

      config,

      zipUrl: "",

      thumbnail: "",

    });

    // =========================
    // UPDATE WEBSITE COUNT
    // =========================

    subscription.websiteCreated += 1;

    await subscription.save();

    // =========================
    // NOTIFICATION
    // =========================

    await Notification.create({
      userId,
      subject: "Website Duplicated",
      message: `"${websiteName}" has been duplicated by ${user.firstName}.`,
    });

    // =========================
    // USER ACTIVITY
    // =========================

    await UserActivity.create({
      userId,
      action: "Website Duplicate",
      target: websiteName,
      atypes: "website_duplicate",
    });

    // =========================
    // CREATE EXPORT FOLDER
    // =========================

    const folderName = preference._id.toString();

    const zipRootFolder = path.join(
      process.cwd(),
      "uploads",
      "websites",
      "exports"
    );

    if (!fs.existsSync(zipRootFolder))
      fs.mkdirSync(zipRootFolder, { recursive: true });

    const websiteFolder = path.join(zipRootFolder, folderName);

    if (!fs.existsSync(websiteFolder))
      fs.mkdirSync(websiteFolder, { recursive: true });

    const cssDir = path.join(websiteFolder, "css");
    const jsDir = path.join(websiteFolder, "js");
    const fontsDir = path.join(websiteFolder, "fonts");
    const imgDir = path.join(websiteFolder, "img");

    [cssDir, jsDir, fontsDir, imgDir].forEach((dir) => {
      if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Website duplicated successfully.",
      id: preference._id,
    });

  } catch (error) {
    console.error("Duplicate Website Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};

// ==========================================
// Update Preferance
// ==========================================
exports.updatePreferenceResponse = async (req, res) => {
  try {
    const { preferenceId } = req.params;
    let updateData = req.body.updateData || req.body; // fallback to entire body if no updateData field
    const userId = req.user._id;
    // If updateData is a string (likely from form-data JSON field)
    if (typeof updateData === "string") {
      try {
        updateData = JSON.parse(updateData);
      } catch (e) {
        console.error("Error parsing updateData JSON:", e);
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid JSON format in updateData",
          });
      }
    }

    // Validate using the PARSED updateData
    if (!preferenceId) {
      return res
        .status(200)
        .json({
          success: false,
          message: "preferenceId & primaryColor required",
        });
    }

    const preference = await Preference.findOne({ _id: preferenceId, userId });
    if (!preference) {
      return res
        .status(200)
        .json({ success: false, message: "Preference not found" });
    }

    // =========================
    // SAFE MERGE UPDATE
    // =========================
    if (updateData?.pages) {
      preference.config.pages = updateData?.pages;
    } else {
      var finaldata = updateData?.config ?? {};
      if (finaldata) {
        preference.config.site = finaldata.site;
        preference.config.theme = finaldata.theme;
        preference.config.typography = finaldata.typography;
        preference.config.layout = finaldata?.layout;
        preference.config.ui = finaldata?.ui;
        preference.config.animations = finaldata?.animations;
        if (finaldata?.branding?.logo == "") {
          const folderName = preference._id.toString();

          const basePath = path.join(
            process.cwd(),
            "uploads",
            "websites",
            "exports",
            folderName,
          );
          if (preference?.config?.branding?.logo) {
            const oldFilePath = path.join(
              basePath,
              preference?.config?.branding?.logo,
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
        }

        if (finaldata?.branding?.favicon == "") {
          const folderName = preference._id.toString();
          const basePath = path.join(
            process.cwd(),
            "uploads",
            "websites",
            "exports",
            folderName,
          );
          if (preference?.config?.branding?.favicon) {
            const oldFilePath = path.join(
              basePath,
              preference?.config?.branding?.favicon,
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
        }

        preference.config.branding.logo = finaldata?.branding?.logo;
        preference.config.branding.favicon = finaldata?.branding?.favicon;
      }

      preference.name = updateData?.name;
      preference.userInput = updateData?.userInput;
    }
    await preference.save();
   
    res.status(200).json({
      success: true,
      message: "Preference response updated successfully",
      id: preferenceId,
    });
  } catch (error) {
    console.error("Update Preference Response Error:", error);

    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// Update Preferance
// ==========================================
exports.updatePreferenceAttach = async (req, res) => {
  try {
    const { preferenceId } = req.params;
    const userId = req.user._id;
    // Validate using the PARSED updateData
    if (!preferenceId) {
      return res
        .status(200)
        .json({ success: false, message: "preferenceId required" });
    }

    const preference = await Preference.findOne({ _id: preferenceId, userId });
    if (!preference) {
      return res
        .status(200)
        .json({ success: false, message: "Preference not found" });
    }

    // =========================================================
    // FILE UPLOAD HANDLING (Fixed Version)
    // =========================================================
    if (req.files) {
      const folderName = preference._id.toString();
      const basePath = path.join(
        process.cwd(),
        "uploads",
        "websites",
        "exports",
        folderName,
      );
      const imgDir = path.join(basePath, "img");

      if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
      }
      var finalurl = "";
      const handleFile = (fileObj, dbField) => {
        try {
          if (preference?.config?.branding[dbField]) {
            const oldFilePath = path.join(
              basePath,
              preference?.config?.branding[dbField],
            );

            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          const ext = path.extname(fileObj.originalname);
          const uniqueName = `${dbField}-${Date.now()}${ext}`;
          finalurl = `img/${uniqueName}`;
          const targetPath = path.join(imgDir, uniqueName);

          fs.renameSync(fileObj.path, targetPath);

          preference.config.branding[dbField] = finalurl;
        } catch (err) {
          console.error(`Error processing ${dbField}:`, err);
        }
      };

      if (req.files.logo?.[0]) {
        handleFile(req.files.logo[0], "logo");
      }

      if (req.files.favicon?.[0]) {
        handleFile(req.files.favicon[0], "favicon");
      }
    }

    await preference.save();
    await UserActivity.create({
      userId,
      action: "Preference Update logo & favicon",
      target: preference.name,
      atypes: "preference_update",
    });

    res.status(200).json({
      success: true,
      message: "Preference response updated successfully",
      id: preferenceId,
      url: finalurl,
    });
  } catch (error) {
    console.error("Update Preference Response Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// ==========================================
// publish wesite
// ==========================================
const { generateWebsiteZip } = require("../helpers/GenerateWebsiteZip");
const ApikeySetting = require("../models/ApikeySetting");
const PageLibrary = require("../models/PageLibrary");
const SectionsLibrary = require("../models/SectionsLibrary");
const sectionSchemas = require("../helpers/ForntEndSectionSchema");

exports.publishPreference = async (req, res) => {
  try {
    const userId = req.user._id;
    const { preferenceId, pages, css, animations } = req.body;

    // =========================
    // CHECK PREFERENCE EXISTS
    // =========================
    const preference = await Preference.findOne({
      _id: preferenceId,
      userId,
    }).populate("categoryId", "type");;

    if (!preference) {
      return res.status(200).json({
        success: false,
        message: "Preference not found",
      });
    }

    if (preference.status === "published") {
      return res.status(200).json({
        success: true,
        message: "Preference already created",
        data: preference,
      });
    }

    // =========================
    // CHECK ACTIVE SUBSCRIPTION
    // =========================
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    }).populate("planId");

    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "No active subscription found. Please purchase a plan.",
      });
    }

    // =========================
    // CHECK PLAN EXPIRY
    // =========================
    const now = new Date();
    if (!subscription.isFree && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();

      return res.status(200).json({
        success: false,
        message: "Your subscription has expired.",
      });
    }

    // =========================
    // PUBLISH + GENERATE ZIP URL
    // =========================
    const response = preference.config.pages || {};
const keywords = `${preference?.name},${preference?.categoryId?.type},${preference?.config?.site?.industry}`;
    await generateWebsiteZip({
      pages,
      css,
      animations,
      fileName: preference._id.toString(),
      fontName: (preference.config?.typography?.font ?? "")
        .toString()
        .toLowerCase()
        .trim(),
      response,
      favicon: preference.config?.branding?.favicon || "",
      designStyle: preference.config.ui.designStyle,
      seodetails: {name:preference.name,keywords:keywords},
      preferenceId: preference._id.toString(),
    });
    const generatedZipUrl = `/uploads/websites/exports/${preference._id}.zip`;

    preference.status = "published";
    preference.zipUrl = generatedZipUrl;

    // 🔥 Screenshot URL
    const previewUrl = `${process.env.BASE_URL}/uploads/websites/exports/${preference._id}`;

    const thumbnail = await generateScreenshot({
      url: previewUrl,
      fileName: `site_${preference._id}`,
    });
    preference.thumbnail = thumbnail;

    await preference.save();

    // =========================
    // SEND EMAIL TO USER (AFTER SUCCESSFUL PUBLISH)
    // =========================
    const setting = await Setting.findOne({});
    if (req.user.emailNotifications === 1) {
      const emailVars = {
        firstName: req.user.firstName || "",
        site_name: setting?.companyName,
        web_name: preference.name,
        site_logo: setting?.logo ? process.env.BASE_URL + setting?.logo : ""
      };

      await sendTemplateEmail("website_publish", req.user.email, emailVars);
    }
    // =========================
    // CREATE USER ACTIVITY
    // =========================
    await UserActivity.create({
      userId,
      action: "Website Exported – ",
      target: preference.name,
      atypes: "website_publish",
    });

    return res.status(200).json({
      success: true,
      message: "Website exported successfully",
      data: {
        preferenceId: preference._id,
        zipUrl: preference.zipUrl,
      },
    });
  } catch (error) {
    console.error("Publish Preference Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export website. Please try again.",
      data:JSON.stringify(error)
    });
  }
};

// ==========================
// Delete Account
// ==========================
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), user.avatar);

      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await User.deleteOne({ _id: userId });

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================
// Get User WebHistory
// ==========================
exports.getUserWebHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const totalWebsites = await Preference.countDocuments({ userId });
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();
    const thisMonthWebsites = await Preference.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const result = await Payment.aggregate([
      { $match: { userId: userId, status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totals.totalAmount" },
        },
      },
    ]);
    const totalpaymenet = {
      totalAmount: result.length > 0 ? result[0].totalAmount : 0,
    };

    const activePlan = await UserSubscription.findOne({
      userId: userId,
      status: "active",
    }).populate("planId", "name");

    const settings = await Setting.findOne({});

    const currencySymbol = settings?.currencySymbol || "";
    const stats = [
      {
        label: "Total Websites",
        value: totalWebsites.toString(),
        icon: "Globe",
      },
      {
        label: "Total Payment",
        value: `${currencySymbol}${totalpaymenet.totalAmount.toString()}`,
        icon: "Zap",
      },
      {
        label: "This Month Websites",
        value: thisMonthWebsites.toString(),
        icon: "TrendingUp",
      },
      {
        label: "Active Plan",
        value: activePlan?.planId?.name || "No Active Plan",
        icon: "Eye",
      },
    ];
    // -------------------------
    // AGGREGATION
    // -------------------------
    const matchCondition = {
      userId: userId,
      isActive : true,
    };

    const pipeline = [
      { $match: matchCondition },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "businesstypes",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },
      ...(limit ? [{ $limit: limit }] : []),
    ];

    const finalData = await Preference.aggregate(pipeline);

    // -------------------------
    // FORMAT (exactly what you asked)
    // -------------------------
    const formatted = finalData.map((d) => ({
      _id: d._id,
      websiteName: d?.config?.site?.websiteName || "",
      industry: d?.config?.site?.industry || "",
      designStyle: d?.config?.ui?.designStyle || "",
      user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "Deleted User",
      email: d.user?.email || "",
      category: d.category?.type || "",
      status: d.status,
      zipUrl: d.zipUrl || "",
      createdAt: d.createdAt,
      thumbnail: d.thumbnail || "",
    }));

    res.json({
      success: true,
      data: formatted,
      stats,
    });
  } catch (err) {
    console.error("User WebHistory Error:", err);
    res.status(500).json({
      success: false,
      data: [],
    });
  }
};

// ==========================
// Get User single WebHistory
// ==========================
exports.getUserWebHistorySingledata = async (req, res) => {
  try {
    const userId = req.user?._id;

    const { preferenceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }


    // -------------------------
    //  Get active subscription
    // -------------------------
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
    });
    let subscriptionInfo = null;
    if (subscription) {
      const maxPages = subscription.totalPageLimite;
      const formattedFeatures = {};
      Object.keys(subscription.features || {}).forEach((key) => {
        formattedFeatures[key] = subscription.features[key].status;
      });
      subscriptionInfo = {
        ...formattedFeatures,
        pagelimit: maxPages
      };
    }

    // -------------------------
    // AGGREGATION
    // -------------------------
    const objectId = new mongoose.Types.ObjectId(preferenceId);
    const matchCondition = {
      userId: userId,
      _id: objectId,
    };

    const pipeline = [
      { $match: matchCondition },
      {
        $lookup: {
          from: "businesstypes",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },
    ];

    const finalData = await Preference.aggregate(pipeline);

    // -------------------------
    // FORMAT (exactly what you asked)
    // -------------------------
    const d = finalData[0];

    const formatted = d;

    res.json({
      success: true,
      data: formatted,
      userfeature: subscriptionInfo
    });
  } catch (err) {
    console.error("User WebHistory Error:", err);
    res.status(500).json({
      success: false,
      data: [],
    });
  }
};
// ==========================
// Get User single WebHistory
// ==========================
exports.deleteWebHistory = async (req, res) => {
  try {
    const { preferenceId } = req.params;

    // Validate ID
    if (!preferenceId) {
      return res.status(400).json({
        success: false,
        message: "Preference ID is required.",
      });
    }

    // Check if website exists
    const website = await Preference.findById(preferenceId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found.",
      });
    }

    // Soft Delete
    website.isActive = false;
    await website.save();

    return res.status(200).json({
      success: true,
      message: "Website deleted successfully.",
      data: website,
    });
  } catch (err) {
    console.error("Delete Website Error:", err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the website.",
    });
  }
};

// ==========================================
// Get All Seo
// ===========================================
exports.getAllSeo = async (req, res) => {
  try {
    const seo = await Seo.find(
      {},
      {
        _id: 0,
        type: 1,
        metaTitle: 1,
        metaDescription: 1,
        metaKeywords: 1,
      },
    ).lean();

    res.json({
      success: true,
      data: seo,
    });
  } catch (err) {
    console.error("SEO API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// get page details
// ===========================================
module.exports.getPage = async (req, res) => {
  const { pageName } = req.params;

  try {
    const pageKey = String(pageName).trim().toLowerCase();

    let pageId = null;

    if (pageKey === "terms") pageId = 1;
    else if (pageKey === "security") pageId = 2;
    else if (pageKey === "privacy") pageId = 3;

    if (!pageId) {
      return res.status(200).json({
        success: false,
        message: "Invalid page name",
      });
    }
    const page = await Pagedetails.findOne({ pageId });

    if (!page) {
      return res
        .status(200)
        .json({ success: false, message: "Page not found" });
    }

    const formattedContent = page.content.replace(/\r\n/g, "<br>");

    res.status(200).json({
      success: true,
      pageId: page.pageId,
      pageName: pageKey,
      content: formattedContent,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// ==========================================
// update Notification Settings
// ===========================================
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    const { emailNotifications, marketingEmails } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        emailNotifications,
        marketingEmails,
      },
      { new: true },
    ).select("emailNotifications marketingEmails");

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Website Analytic
// ===========================================
exports.websiteAnalytic = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==================================================
    //  CHANGE: FILTER BASED DATE RANGE FOR WEBSITE CHART
    // ==================================================
    const filter = req.query.filter || "yearly";
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate, endDate;

    switch (filter) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "week":
        // Start of current week (Sunday)
        startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "thisMonth":
        // First day of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);

        // Last day of current month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "lastMonth":
        // First day of last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        // Last day of last month
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "custom":
        if (req.query.start && req.query.end) {
          startDate = new Date(req.query.start);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(req.query.end);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default yearly if missing
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        }
        break;

      default: // YEARLY
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        break;
    }

    // ==================================================
    // CHANGE: WEBSITE CHART DATA (Filtered)
    // ==================================================
    let monthWiseWebsites = await Preference.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthWiseData = monthNames.map((m, index) => {
      const month = index + 1;
      const found = monthWiseWebsites.find((item) => item._id === month);

      return {
        month: m,
        total: found ? found.total : 0,
      };
    });

    monthWiseWebsites = monthWiseData;

    return res.status(200).json({
      success: true,
      filter,
      startDate,
      endDate,
      data: monthWiseWebsites,
    });
  } catch (error) {
    console.error("Website Chart Error:", error);
    return res.status(500).json({
      success: false,
      data: [],
    });
  }
};
// ==========================================
// Website Analytic
// ===========================================
exports.getPageLibrary = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const limit = parseInt(req.query.limit) || 0;
    let pagedata = await PageLibrary.find({ isActive: true })
      .limit(limit)
      .sort({ order: 1 });

    res.json({
      success: true,
      data: pagedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
    });
  }
};

// ================= GOOGLE AUTH CONTROLLERS ================= //

module.exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});


// ==========================================
// Google Auth: Callback Handler
// ==========================================
module.exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, profile) => {

    // ❌ Passport error
    if (err) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=auth_failed`);
    }

    if (!profile) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=auth_failed`);
    }

    try {
      const email = profile.emails?.[0]?.value;

      // ❌ Email missing
      if (!email) {
        return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=no_email`);
      }

      let user = await User.findOne({ email });

      const { location, cleanIP, browser, os, country } = await ipData(req);

      // =============================
      // 🔴 CASE 1: Existing LOCAL user
      // =============================
      if (user && user.loginProvider === "email") {
        return res.redirect(
          `${process.env.FRONTEND_BASE_URL}/login?error=account_exists_local`
        );
      }

      // =============================
      // 🆕 CASE 2: New User
      // =============================
      if (!user) {
        user = await User.create({
          firstName: profile.name?.givenName || profile.displayName.split(" ")[0],
          lastName: profile.name?.familyName || profile.displayName.split(" ")[1] || "",
          email,
          googleId: profile.id,
          avatar: "",
          emailVerified: 1,
          status: 1,
          phone: "",
          bio: "",
          ip: cleanIP,
          country: country,
          state: "",
          loginProvider: "google",
          password: null
        });

        await assignFreePlanOnce(user);
      }

      // =============================
      // 🔁 CASE 3: Existing GOOGLE user
      // =============================
      else {
        // optional: extra safety
        if (!user.googleId) {
          user.googleId = profile.id;
        }

        if (user.emailVerified === 0) {
          user.emailVerified = 1;
        }
      }

      // =============================
      // 🚫 CASE 4: Blocked user
      // =============================
      if (user.status === 0) {
        return res.redirect(
          `${process.env.FRONTEND_BASE_URL}/login?error=account_blocked`
        );
      }

      // =============================
      // 📜 Login History
      // =============================
      await LoginHistory.create({
        userId: user._id,
        loginAt: new Date(),
        ip: cleanIP,
        location,
        browser,
        os,
      });

      user.lastLogin = new Date();
      user.ip = cleanIP;
      await user.save();

      // =============================
      // 🔐 Token
      // =============================
      const token = await tokenGenerate(user);

      return res.redirect(
        `${process.env.FRONTEND_BASE_URL}/auth/calback?token=${token}`
      );

    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_BASE_URL}/login?error=server_error`
      );
    }

  })(req, res, next);
};


// ================= GITHUB AUTH CONTROLLERS ================= //

module.exports.githubAuth = passport.authenticate('github', {
  scope: ['user:email']
});

// ==========================================
// GitHub Auth: Callback Handler
// ==========================================
module.exports.githubAuthCallback = (req, res, next) => {
  passport.authenticate("github", { session: false }, async (err, profile) => {
    // ❌ Passport error
    if (err) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=auth_failed`);
    }

    if (!profile) {
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=auth_failed`);
    }
    try {
      // IMPORTANT: GitHub email handling
      let email = profile.emails?.[0]?.value;

      // If email is missing, fetch primary email
      if (!email) {
        const axios = require("axios");

        const emailsRes = await axios.get("https://api.github.com/user/emails", {
          headers: {
            Authorization: `token ${profile.accessToken}`,
          },
        });

        const primaryEmail = emailsRes.data.find(e => e.primary && e.verified);
        email = primaryEmail?.email;
      }

      // ❌ Email missing
      if (!email) {
        return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=no_email`);
      }

      // 1. FIND OR CREATE USER IN CONTROLLER
      let user = await User.findOne({ email });

      // =============================
      // 🔴 CASE 1: Existing LOCAL user
      // =============================
      if (user && user.loginProvider === "email") {
        return res.redirect(
          `${process.env.FRONTEND_BASE_URL}/login?error=account_exists_local`
        );
      }
      // -----------------------------
      // Get IP & Location
      // -----------------------------
      const { location, cleanIP, browser, os, country } = await ipData(req)

      // =============================
      // 🆕 CASE 2: New User
      // =============================
      if (!user) {
        user = await User.create({
          firstName: profile.displayName?.split(" ")[0] || profile.username,
          lastName: profile.displayName?.split(" ")[1] || "",
          email,
          googleId: profile.id,
          avatar: "",
          emailVerified: 1,
          status: 1,
          phone: "",
          bio: "",
          ip: cleanIP,
          country: country,
          state: "",
          loginProvider: "github",
          password: null,

        });

        await assignFreePlanOnce(user);;
      }

      // =============================
      // 🔁 CASE 3: Existing GOOGLE user
      // =============================
      else {
        // optional: extra safety
        if (!user.googleId) {
          user.googleId = profile.id;
        }

        if (user.emailVerified === 0) {
          user.emailVerified = 1;
        }
      }


      // =============================
      // 🚫 CASE 4: Blocked user
      // =============================
      if (user.status === 0) {
        return res.redirect(
          `${process.env.FRONTEND_BASE_URL}/login?error=account_blocked`
        );
      }

      // =============================
      // 📜 Login History
      // =============================
      await LoginHistory.create({
        userId: user._id,
        loginAt: new Date(),
        ip: cleanIP,
        location,
        browser,
        os,
      });

      user.lastLogin = new Date();
      user.ip = cleanIP;
      await user.save();

      // =============================
      // 🔐 Token
      // =============================
      const token = await tokenGenerate(user);

      return res.redirect(
        `${process.env.FRONTEND_BASE_URL}/auth/calback?token=${token}`
      );

    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_BASE_URL}/login?error=server_error`
      );
    }
  })(req, res, next);
};

// =========================
// Get LANGUAGE DATA
// =========================
module.exports.getLanguage = async (req, res) => {
  try {
    const languages = await Languages.find({ status: true });

    const data = {
      languages: languages,
    };

    res.json({
      success: true,
      message: "Languages fetched successfully.",
      data: data,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Failed to fetch languages.",
    });
  }
};

// =========================
// Get TRANSLATION LANGUAGE
// =========================
module.exports.getTranslationLanguages = async (req, res) => {
  try {
    const translationLanguages = await TranslationManager.find({ status: true })
      .sort({ createdAt: 1 })
      .select("code");

    const codes = translationLanguages.map((item) => item.code);

    const languages = await Languages.find({
      status: true,
      code: { $in: codes },
    });

    const languageMap = new Map(languages.map((lang) => [lang.code, lang]));

    const finalLanguages = codes
      .map((code) => languageMap.get(code))
      .filter(Boolean);

    res.json({
      success: true,
      message: "Translation languages fetched successfully.",
      data: finalLanguages,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Failed to fetch translation languages.",
    });
  }
};

// =========================
// Get TRANSLATION Data
// =========================
module.exports.getTranslations = async (req, res) => {
  try {
    const { lang } = req.params;
    const translationLanguages = await TranslationManager.findOne({
      code: lang,
      status: true,
    }).sort({ createdAt: 1 });

    const formatted = {};
    if (translationLanguages) {
      translationLanguages?.translations.forEach((item) => {
        formatted[item.key] = item.value;
      });
    }
    const data = formatted ? formatted : LanguageData;

    res.json({
      success: true,
      message: "Translations fetched successfully.",
      data: data,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Failed to fetch translations.",
    });
  }
};

// ==========================================
// ASSIGN FREE PLAN
// ==========================================
module.exports.assignFreePlan = async (req, res) => {
  try {
    const { id , isfree } = req.body;

    const userId = req.user.id;
    
    if (!userId || !id || !isfree)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found.",
      });
    }

    await UserSubscription.findOneAndUpdate(
  { userId: user.id },
  { status: "expired" },
  { sort: { createdAt: -1 } }
);

   const freeplansres = await assignFreePlanOnce(user);

  if (freeplansres.success === false) {
  return res.json({
    success: false,
    message: freeplansres.message,
  });
}

    res.json({
      success: true,
      message: "Your Free Plan Upgrade successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: err.message || "Payment creation error",
    });
  }
};