const Tag = require("../models/Tag");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Faq = require("../models/Faq");
const Testimonial = require("../models/Testimonial");
const Blog = require("../models/Blog");
const Setting = require("../models/Setting");
const BusinessType = require("../models/BusinessType");
const Country = require("../models/Countrie");
const State = require("../models/States");
const User = require("../models/User");
const Payment = require("../models/Payment");
const SupportTicket = require("../models/Ticket");
const UserSubscription = require("../models/UserSubscription");
const LoginHistory = require("../models/LoginHistory");
const Notification = require("../models/Notification");
const Admin = require("../models/AdminTable");
const AdminPasswordResetToken = require("../models/AdminPasswordResetToken");
const Inquiry = require("../models/Inquiry");
const Newsletter = require("../models/NewsLetter");
const HeroStat = require("../models/HeroStat");
const HowItWork = require("../models/HowItWork");
const Features = require("../models/Features");
const PaymentGateway = require("../models/PaymentGateway");
const PageSection = require("../models/PageSection");
const Seo = require("../models/Seo");
const EmailTemplate = require("../models/EmailTemplate");
const Portfolio = require("../models/Portfolio");
const Preference = require("../models/Preferance");
const ApikeySetting = require("../models/ApikeySetting");
const Pagedetails = require("../models/PageDetails");
const Language = require("../models/Languages")
const ExcelJS = require("exceljs");
const AuthkeySetting = require("../models/AuthkeySetting");
const TranslationManager = require("../models/TranslationManager");
const TranslationKeys = require("../models/TranslationKeys");
const { normalizeHtml } = require("../helpers/Htmlnormalize");
//helper
const getTransporter = require("../helpers/EmailHelper");
const sendResetLink = require("../helpers/SendResetLink");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const OpenAI = require("openai");
const jwt = require("jsonwebtoken");
const { assignFreePlanOnce } = require("../helpers/subscriptionHelper");

//==========================================dashboard start==================================//

module.exports.dashboard = async (req, res) => {
  try {
    const admin = await Admin.find();

    // -------------------------
    // TODAY DATE RANGE
    // -------------------------
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // -------------------------
    // USER STATS
    // -------------------------
    const Usercount = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      status: 1,
      emailVerified: 1,
    });
    const bannedusers = await User.countDocuments({ status: 0 });
    const emailVerifiedUsers = await User.countDocuments({
      emailVerified: 0,
      status: 1,
    });

    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // -------------------------
    // PAYMENT COUNTS
    // -------------------------
    const todayPendingPaymentCount = await Payment.countDocuments({
      status: "open",
    });

    const todaySuccessPaymentCount = await Payment.countDocuments({
      status: "success",
    });

    const todayFailedPaymentCount = await Payment.countDocuments({
      status: "failed",
    });

    // -------------------------
    // PAYMENT TOTAL AMOUNTS
    // -------------------------
    const paymentSum = async (status) => {
      const result = await Payment.aggregate([
        {
          $match: {
            status,
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totals.totalAmount" },
          },
        },
      ]);

      return result.length ? result[0].totalAmount : 0;
    };

    const todayPendingPaymentAmount = Number(
      (await paymentSum("open")).toFixed(2),
    );
    const todaySuccessPaymentAmount = Number(
      (await paymentSum("success")).toFixed(2),
    );
    const todayFailedPaymentAmount = Number(
      (await paymentSum("failed")).toFixed(2),
    );

    const settings = await Setting.findOne({});

    const currencySymbol = settings?.currencySymbol || "";

    // -------------------------
    // TICKETS
    // -------------------------
    const todayPendingTickets = await SupportTicket.countDocuments({
      status: "open",
    });
    const todayCloseTickets = await SupportTicket.countDocuments({
      status: "closed",
    });

    // -------------------------
    // PLANS
    // -------------------------
    const todayPlans = await SubscriptionPlan.countDocuments();

    // -------------------------
    // 1. DETERMINE DATE RANGE BASED ON FILTER
    // -------------------------
    const filter = req.query.filter || "yearly";
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate, endDate;
    let chartTitle = `${currentYear} Yearly Payments`;

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

      case "lastMonth":
        // First day of last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Last day of last month
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        break;

      case "custom":
        if (req.query.start && req.query.end) {
          startDate = new Date(req.query.start);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(req.query.end);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to yearly if dates are missing
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        }
        break;

      default: // YEARLY (Default)
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        break;
    }

    // -------------------------
    // 2. FETCH YEARLY SALES DATA (Filtered by Date)
    // -------------------------
    const yearlySalesRaw = await Payment.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          total: { $sum: "$totals.totalAmount" },
        },
      },
    ]);

    // Initialize 12 months with 0
    const yearlySales = Array(12).fill(0);
    yearlySalesRaw.forEach((item) => {
      yearlySales[item._id.month - 1] = Number(item.total.toFixed(2));
    });

    if (req.xhr || req.headers["x-requested-with"] === "xmlhttprequest") {
      return res.json({
        success: true,
        yearlySales, // Updated Bar Chart Data
        chartTitle,
      });
    }

    // =========================
    // TOP 5 CATEGORIES BY DATA REQUEST
    // =========================
    const topCategories = await Preference.aggregate([
      {
        // category ke basis par group
        $group: {
          _id: "$categoryId",
          totalRequests: { $sum: 1 },
        },
      },
      {
        // zyada request wale upar
        $sort: { totalRequests: -1 },
      },
      {
        // sirf top 5
        $limit: 5,
      },
      {
        // businesstypes ka name laane ke liye join
        $lookup: {
          from: "businesstypes", // businesstypes collection
          localField: "_id",
          foreignField: "_id",
          as: "business",
        },
      },
      {
        // array ko object banao
        $unwind: "$business",
      },
      {
        // final clean output
        $project: {
          categoryId: "$_id", // keep this
          categoryName: "$business.type",
          totalRequests: 1,
        },
      },
    ]);

    // Get top country for each top category
    // ===================================
    // TOP 5 COUNTRIES (CASE-INSENSITIVE)
    // ===================================
    const topCountriesPerCategory = await User.aggregate([
      //  Country must exist
      {
        $match: {
          country: { $exists: true, $ne: "", $ne: null },
        },
      },

      // Normalize user country
      {
        $addFields: {
          countryNormalized: {
            $toLower: {
              $trim: { input: "$country" },
            },
          },
        },
      },

      //  Group by normalized country
      {
        $group: {
          _id: "$countryNormalized",
          totalRequests: { $sum: 1 },
        },
      },

      // Sort & limit
      { $sort: { totalRequests: -1 } },
      { $limit: 5 },

      //  Lookup country table (normalized match)
      {
        $lookup: {
          from: "countries",
          let: { countryNorm: "$_id" },
          pipeline: [
            {
              $addFields: {
                nameNormalized: {
                  $toLower: {
                    $trim: { input: "$name" },
                  },
                },
              },
            },
            {
              $match: {
                $expr: { $eq: ["$nameNormalized", "$$countryNorm"] },
              },
            },
          ],
          as: "countryData",
        },
      },

      // Unwind (safe)
      {
        $unwind: {
          path: "$countryData",
          preserveNullAndEmptyArrays: true,
        },
      },

      //  Final output
      {
        $project: {
          _id: 0,
          countryName: {
            $ifNull: ["$countryData.name", "$_id"],
          },
          categoryName: { $literal: "Users" },
          totalRequests: 1,
        },
      },
    ]);

    // =========================
    // TOP USED PLANS (NO STATE)
    // =========================
    const topPlans = await UserSubscription.aggregate([
      {
        $group: {
          _id: "$planId",
          totalUsers: { $sum: 1 },
        },
      },
      { $sort: { totalUsers: -1 } },
      { $limit: 5 },

      // Join with plans collection
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },

      {
        $project: {
          _id: 0,
          planName: "$plan.name",
          totalUsers: 1,
        },
      },
    ]);

    // =========================
    // LOGIN HISTORY STATS FOR DASHBOARD CHARTS
    // =========================
    const osLoginsRaw = await LoginHistory.aggregate([
      {
        $project: {
          osCategory: {
            $switch: {
              branches: [
                {
                  case: { $regexMatch: { input: "$os", regex: /^Windows/i } },
                  then: "Windows",
                },
                {
                  case: { $regexMatch: { input: "$os", regex: /^Mac/i } },
                  then: "MacOS",
                },
                {
                  case: { $regexMatch: { input: "$os", regex: /^Linux/i } },
                  then: "Linux",
                },
                {
                  case: { $regexMatch: { input: "$os", regex: /^Android/i } },
                  then: "Android",
                },
                {
                  case: { $regexMatch: { input: "$os", regex: /^iOS/i } },
                  then: "iOS",
                },
                {
                  case: { $regexMatch: { input: "$os", regex: /^Chrome/i } },
                  then: "Chrome OS",
                },
              ],
              default: "Other / Unknown",
            },
          },
        },
      },
      {
        $group: {
          _id: "$osCategory",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Prepare arrays for chart
    const osLabels = osLoginsRaw.map((l) => l._id || "Unknown");
    const osSeries = osLoginsRaw.map((l) => l.count);


    const latestUsers = await User.find({ status: 1 })
  .select({
    firstName: 1,
    lastName: 1,
    email: 1,
    status: 1
  })
  .sort({ createdAt: -1 })
  .lean().limit(10);

  const latestTranslations = await Payment.find(
  {status : "success"},
  {
    gateway: 1,
    amount: 1,
    totals: 1,
    status: 1,
    userId: 1
  }
)
.populate("userId", "firstName lastName")
.sort({ createdAt: -1 })
.limit(10)
.lean();

  // totle website generate and publish 

  const totalPublishedWebsites = await Preference.countDocuments({});


  // totle Active Plans 
const result = await UserSubscription.aggregate([
  {
    $sort: {
      createdAt: -1,
    },
  },
  {
    $group: {
      _id: "$userId",
      subscription: { $first: "$$ROOT" },
    },
  },
  {
    $replaceRoot: {
      newRoot: "$subscription",
    },
  },
  {
    $match: {
      status: "active",
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
  {
    $match: {
      "user.status": 1,
      "user.emailVerified": 1,
    },
  },
  {
    $count: "total",
  },
]);

const totalActivePlans = result[0]?.total || 0;

const planWiseUsers = await UserSubscription.aggregate([
  {
    $sort: {
      createdAt: -1,
    },
  },
  {
    $group: {
      _id: "$userId",
      subscription: { $first: "$$ROOT" },
    },
  },
  {
    $replaceRoot: {
      newRoot: "$subscription",
    },
  },
  {
    $match: {
      status: "active",
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
  {
    $match: {
      "user.status": 1,
      "user.emailVerified": 1,
    },
  },
  {
    $lookup: {
      from: "subscriptionplans",
      localField: "planId",
      foreignField: "_id",
      as: "plan",
    },
  },
  {
    $unwind: "$plan",
  },
  {
    $group: {
      _id: "$plan.name",
      users: {
        $sum: 1,
      },
    },
  },
  {
    $sort: {
      users: -1,
    },
  },
]);

    res.render("Dashboard", {
      admin,

      // user stats
      Usercount,
      activeUsers,
      bannedusers,
      emailVerifiedUsers,
      todayNewUsers,

      // payment stats
      todayPendingPaymentCount,
      todayPendingPaymentAmount,

      todaySuccessPaymentCount,
      todaySuccessPaymentAmount,

      todayFailedPaymentCount,
      todayFailedPaymentAmount,
      currencySymbol,

      // tickets & plans
      todayPendingTickets,
      todayCloseTickets,
      todayPlans,
      osChartData: { labels: osLabels, series: osSeries },

      //  NEW (FOR CHART)
      currentYear,
      yearlySales,
      //category
      topCategories, // window.TOP_CATEGORIES = <%- JSON.stringify(topCategories || []) %>;

      topCountriesPerCategory,
      topPlans,

      // Filter Params (to keep selected state in UI)
      filter: "yearly",
      filterStart: req.query.start || "",
      filterEnd: req.query.end || "",

      // table data
      latestUsers,
      latestTranslations,
 // totle website generate and publish 
      totalPublishedWebsites,
      // totle Active Plans
      totalActivePlans,
      planWiseUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

//==========================================dashboard end==================================//

module.exports.getstate = async (req, res) => {
  try {
    const admin = await Admin.find();

    res.render("States", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

// Manage Users
module.exports.Activeusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Activeusers", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Bannedusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Bannedusers", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Allusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Allusers", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};


module.exports.Pendingpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Pendingpayment", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.Successfulpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Successfulpayment", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Rejectedpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Rejectedpayment", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.AllPayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    const settings = await Setting.findOne({});
    const currencySymbol = settings?.currencySymbol;
    const currency = settings?.currency;
    // All-time totals
    const paymentSum = async (status) => {
      const result = await Payment.aggregate([
        { $match: { status } },
        { $group: { _id: null, totalAmount: { $sum: "$totals.totalAmount" } } },
      ]);
      return result.length ? result[0].totalAmount : 0;
    };

    // Individual totals
    const success = await paymentSum("success");
    const pending = await paymentSum("open");
    const failed = await paymentSum("failed");
    const initiated = await paymentSum("initiated");

    // GRAND TOTAL = sum of all
    const grandTotal = success + pending + failed + initiated;

    const totals = {
      success,
      pending,
      failed,
      initiated,
      grandTotal,
    };

    res.render("Allpayment", {
      admin,
      totals,
      currencySymbol,
      currency,
    });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

module.exports.Pendingtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Pendingtickets", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Closedtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Closedtickets", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Answeredtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Answeredtickets", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.Alltickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Alltickets", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.ticketdetails = async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await SupportTicket.findById(ticketId);

    const admin = await Admin.find();

    if (!ticket) {
      return res.status(404).send("Ticket not found");
    }

    res.render("Ticketdetails", {
      ticket,
      admin,
    });
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

//====================
// Subscriptionhistory
//====================
module.exports.Subscriptionhistory = async (req, res) => {
  try {
    const admin = await Admin.find();

    // Total subscriptions
    const totalSubscriptions = await UserSubscription.countDocuments();

    // Active subscriptions
    const activeSubscriptions = await UserSubscription.countDocuments({
      status: "active",
    });

    // Monthly subscriptions
    const monthlySubscriptions = await UserSubscription.countDocuments({
      billingType: "monthly",
    });

    // Yearly subscriptions
    const yearlySubscriptions = await UserSubscription.countDocuments({
      billingType: "yearly",
    });

    // Top used plans
    const topPlans = await UserSubscription.aggregate([
      {
        $group: {
          _id: "$planId",
          totalUsed: { $sum: 1 },
        },
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "subscriptionplans", // plans collection name
          localField: "_id",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      {
        $unwind: "$planDetails",
      },
      {
        $project: {
          _id: 0,
          planId: "$_id",
          planName: "$planDetails.name",
          totalUsed: 1,
        },
      },
    ]);

    res.render("Subscriptionhistory", {
      admin,
      totalSubscriptions,
      activeSubscriptions,
      monthlySubscriptions,
      yearlySubscriptions,
      topPlans,
    });
  } catch (error) {
    console.log(error);
  }
};

//====================
// Loginhistory
//====================
module.exports.Loginhistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    const totalUsersResult = await LoginHistory.aggregate([
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "totalUsers",
      },
    ]);
    const osBreakdownResult = await LoginHistory.aggregate([
      {
        $group: {
          _id: "$os",
          count: { $sum: 1 },
        },
      },
    ]);

    // Prepare object with default 0
    const osCounts = {
      Android: 0,
      Windows: 0,
      Other: 0,
    };

    osBreakdownResult.forEach((item) => {
      const os = item._id?.toLowerCase() || "other";
      if (os.includes("android")) osCounts.Android = item.count;
      else if (os.includes("windows")) osCounts.Windows = item.count;
      else osCounts.Other += item.count;
    });

    const totalUsers = totalUsersResult.length
      ? totalUsersResult[0].totalUsers
      : 0;
    res.render("Loginhistory", {
      admin,
      totalUsers,
      osCounts,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.Notificationhistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Notificationhistory", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getnotification = async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false }).sort({
      createdAt: -1,
    });

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.json(err);
  }
};

module.exports.notificationread = async (req, res) => {
  try {
    const id = req.params.id;

    await Notification.findByIdAndUpdate(id, { isRead: true });

    res.redirect(`/notificationhistory`);
  } catch (err) {
    res.redirect("/notificationhistory");
  }
};

//========================================== Manage Frontend==========================================//

// ==========================================
// Render Add Tag Page
// ==========================================
module.exports.addTag = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Managetag", { admin }); // view ka naam same rakh sakte ho
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

// ==========================================
// Get JSON Data for Tags
// ==========================================
module.exports.getTagJson = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });

    const data = tags.map((t) => ({
      _id: t._id,
      tag: t.tag,
    }));

    res.json({ data });
  } catch (err) {
    res.json({ data: [] });
  }
};

// ==========================================
// Add / Edit Tag
// ==========================================
module.exports.saveTag = async (req, res) => {
  try {
    const { id, tag } = req.body;

    if (!tag || !tag.trim()) {
      return res.json({ success: false, message: "Tag text is required!" });
    }

    // EDIT MODE
    if (id) {
      const existingTag = await Tag.findById(id);
      if (!existingTag)
        return res.json({ success: false, message: "Tag not found!" });

      existingTag.tag = tag.trim();
      await existingTag.save();

      return res.json({ success: true, message: "Tag updated successfully" });
    }

    // ADD MODE
    const newTag = new Tag({ tag: tag.trim() });
    await newTag.save();

    return res.json({ success: true, message: "Tag added successfully" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// ==========================================
// Delete Tag
// ==========================================
module.exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id);
    if (!tag) return res.json({ success: false, message: "Tag not found!" });

    await Tag.findByIdAndDelete(id);

    res.json({ success: true, message: "Tag deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: "Delete failed!" });
  }
};

//==========================================Pricing plan ==========================================//

module.exports.getSubscriptionPlan = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "subscriptions" }).lean();
    res.render("Subscriptionplan", {
      plans,
      admin,
      section,
    });
  } catch (error) {
    res.send(err.message);
  }
};
// ==========================================
// Add + Edit  Form Pricing Plan
// ==========================================
module.exports.AddSubscriptionPlan = async (req, res) => {
  try {
    const id = req.params.id || null;
    const admin = await Admin.find();
    const Settings = await Setting.findOne({});
    const currencySymbol = Settings?.currencySymbol;
    let plan = null;
    if (id) plan = await SubscriptionPlan.findById(id);

    res.render("Addsubscriptionplan", {
      plan,
      admin,
      currencySymbol,
      features: plan?.features || {},
    });
  } catch (err) {
    res.send(err.message);
  }
};

module.exports.AddSubscriptionPlanPage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const Settings = await Setting.findOne({});
    const currencySymbol = Settings?.currencySymbol;
    let plan = null;
    res.render("Addsubscriptionplan", {
      plan,
      admin,
      currencySymbol,
      features: plan?.features || {},
    });
  } catch (err) {
    res.send(err.message);
  }
};
// ==========================================
// Add + Edit Pricing Plan
// ==========================================
module.exports.saveSubscriptionPlan = async (req, res) => {
  try {
    const {
      id,
      order,
      name,
      shortDescription,
      monthlyPrice,
      yearlyPrice,
      monthlyWebsiteLimit,
      yearlyWebsiteLimit,
      maxPages,
      maxSectionsPerPage,
      features,
      monthlyDiscount, // new
      yearlyDiscount, // new
      isPremium,
      isFree
    } = req.body;

    let parsedFeatures = {};
    try {
      parsedFeatures = features ? JSON.parse(features) : {};
    } catch (e) {
      parsedFeatures = {};
    }

    const isPremiumValue = isPremium === "on";
    const isFreeValue = isFree === "on";
    let monthlyPriceValue = monthlyPrice
    let yearlyPriceValue = yearlyPrice
    let yearlyWebsiteLimitValue = yearlyWebsiteLimit

    if (isFreeValue) {
      let existingcheckfree = await SubscriptionPlan.findOne({ isFree: isFreeValue });
      if ((!id && existingcheckfree) || (existingcheckfree && (id && id != existingcheckfree?._id))) {
        return res.json({
          success: false,
          message: "A Free Plan already exists. You can edit the existing plan instead of creating a new one.",
        });
      }
      monthlyPriceValue = 0
      yearlyPriceValue = 0
      yearlyWebsiteLimitValue = monthlyWebsiteLimit
    }


    const existingOrderPlan = await SubscriptionPlan.findOne({ order });

    if (!id && existingOrderPlan) {
      return res.json({
        success: false,
        message: "Order already exists. Please use different order.",
      });
    }

    if (id) {
      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.json({ success: false, message: "Plan not found" });
      }
      if (existingOrderPlan && existingOrderPlan._id.toString() !== id) {
        return res.json({
          success: false,
          message: "Order already exists. Please use different order.",
        });
      }

      plan.order = order;
      plan.name = name;
      plan.shortDescription = shortDescription;
      plan.monthlyPrice = monthlyPriceValue;
      plan.yearlyPrice = yearlyPriceValue;
      plan.monthlyWebsiteLimit = monthlyWebsiteLimit;
      plan.yearlyWebsiteLimit = yearlyWebsiteLimitValue;
      plan.maxPages = maxPages;
      plan.maxSectionsPerPage = maxSectionsPerPage;
      plan.features = parsedFeatures;
      plan.monthlyDiscount = monthlyDiscount || 0; // set default 0 if empty
      plan.yearlyDiscount = yearlyDiscount || 0; // set default 0 if empty
      plan.isPremium = isPremiumValue;
      plan.isFree = isFreeValue;

      await plan.save();

      return res.json({
        success: true,
        message: "Pricing Plan Updated Successfully",
      });
    }

    const newPlan = new SubscriptionPlan({
      order,
      name,
      shortDescription,
      monthlyPrice: monthlyPriceValue,
      yearlyPrice: yearlyPriceValue,
      monthlyWebsiteLimit,
      yearlyWebsiteLimit: yearlyWebsiteLimitValue,
      maxPages:maxPages,
      maxSectionsPerPage:maxSectionsPerPage,
      features: parsedFeatures,
      monthlyDiscount: monthlyDiscount || 0, // set default 0 if empty
      yearlyDiscount: yearlyDiscount || 0, // set default 0 if empty
      isPremium: isPremiumValue,
      isFree: isFreeValue,

    });

    await newPlan.save();

    return res.json({
      success: true,
      message: "Pricing Plan Added Successfully",
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// ==========================================
// Get Pricing Json
// ==========================================
exports.getSubscriptionJSON = async (req, res) => {
  const all = await SubscriptionPlan.find().sort({ createdAt: -1, _id: -1 });
  const Settings = await Setting.findOne({});
  const currencySymbol = Settings?.currencySymbol;
  const currencyCode = Settings?.currency;

  const data = all.map((p) => ({
    ...p.toObject(),
    currencySymbol,
    currencyCode,
  }));
  res.json({ data });
};

// ==========================================
// Toggle Pricing
// ==========================================
exports.togglesubscription = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.json({ success: false, message: "Plan not found" });

    plan.status = plan.status === true ? false : true;
    await plan.save();

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ==========================================
// Delete Pricing Plan
// ==========================================
module.exports.deletesubscription = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Subscription Plan Deleted Successfully",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== FAQ ==========================================//
module.exports.getfaqpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "faq" }).lean();

    res.render("Faq", { admin, section });
  } catch (error) {
    console.log(error);
  }
};

// ==========================
// LOAD JSON (Datatable)
// ==========================
exports.getFAQJson = async (req, res) => {
  const data = await Faq.find().sort({ createdAt: -1 });
  res.json({ data });
};
// ==========================
// SAVE FAQ  (ADD / UPDATE)
// ==========================
exports.saveFAQ = async (req, res) => {
  try {
    const { id, question, answer } = req.body;

    if (id) {
      await Faq.findByIdAndUpdate(id, { question, answer });
      return res.json({ success: true, message: "FAQ Updated Successfully" });
    }

    await Faq.create({ question, answer });
    return res.json({ success: true, message: "FAQ Added Successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ==========================
// DELETE FAQ
// ==========================
exports.deleteFAQ = async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "FAQ Deleted Successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== Testimonials ==========================================//
module.exports.getTestimonialPage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "testimonials" }).lean();
    res.render("Testimonial", { admin, section });
  } catch (error) {
    console.log(error);
  }
};

// ==========================
// Testimonial Json
// ==========================
module.exports.getTestimonialsJson = async (req, res) => {
  try {
    const data = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ data: [] });
  }
};

// ==========================
// Add + Edit Review
// ==========================
module.exports.saveTestimonial = async (req, res) => {
  try {
    const { id, name, username, review: reviewText, rating } = req.body;

    let filePath = null;
    if (req.file) filePath = "/uploads/testimonial/" + req.file.filename;

    if (id) {
      // Edit
      const doc = await Testimonial.findById(id);
      if (!doc)
        return res.json({ success: false, message: "Testimonial not found" });

      // delete old image if new uploaded
      if (filePath && doc.image) {
        const oldFile = path.join(__dirname, "..", doc.image);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      doc.name = name;
      doc.username = username;
      doc.review = reviewText;
      doc.rating = Number(rating) || 0;
      doc.image = filePath ? filePath : doc.image;

      await doc.save();
      return res.json({
        success: true,
        message: "Testimonial updated successfully",
        data: doc,
      });
    }

    // // Add new
    // if (!filePath) {
    //   return res.json({ success: false, message: 'Please upload an image' });
    // }

    const newTestimonial = await Testimonial.create({
      image: filePath || "",
      name,
      username,
      review: reviewText,
      rating: Number(rating) || 0,
    });

    return res.json({
      success: true,
      message: "Review added successfully",
      data: newTestimonial,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// DELETE Review
// ==========================
module.exports.deleteTestimonial = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Testimonial.findById(id);
    if (!doc) return res.json({ success: false, message: "Not found" });

    // delete image file
    if (doc.image) {
      const file = path.join(__dirname, "..", doc.image);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }

    await Testimonial.findByIdAndDelete(id);
    res.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== Blogs ==========================================//

module.exports.getblogpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "blogs" }).lean();

    res.render("Addblogs", { admin, section });
  } catch (error) {
    console.log(error);
  }
};
// ================================
//  GET JSON FOR DATATABLE
// ================================
module.exports.getblogjson = async (req, res) => {
  const blogs = await Blog.find().sort({ _id: -1 });
  res.json({ data: blogs });
};

// ================================
//  CREATE + UPDATE BLOG
// ================================
module.exports.saveblog = async (req, res) => {
  try {
    const { id, title, shortDescription, description, author, category } =
      req.body;

    let image = "";
    let thumbnail = "";

    if (req.file) {
      image = "/uploads/blogs/main/" + req.file.filename;
      thumbnail = req.thumbnailPath || ""; // from middleware
    }

    // ======== UPDATE ========
    if (id) {
      const oldBlog = await Blog.findById(id);

      // Remove old image if new uploaded
      if (req.file && oldBlog.image) {
        const oldPath = path.join(__dirname, "..", oldBlog.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        // Also delete old thumbnail
        if (oldBlog.thumbnail) {
          const oldThumbPath = path.join(__dirname, "..", oldBlog.thumbnail);
          if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
        }
      }

      await Blog.findByIdAndUpdate(id, {
        title,
        shortDescription,
        description,
        author,
        category,
        image: req.file ? image : oldBlog.image,
        thumbnail: req.file ? thumbnail : oldBlog.thumbnail,
      });

      return res.json({
        success: true,
        message: "Blog updated successfully!",
      });
    }

    if (!req.file) {
      return res.json({ success: false, message: "Blog image is required!" });
    }

    // ======== CREATE ========
    await Blog.create({
      title,
      shortDescription,
      description,
      image,
      thumbnail,
      author,
      category,
    });

    return res.json({
      success: true,
      message: "Blog created successfully!",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ================================
//  DELETE BLOG
// ================================
module.exports.deleteblog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog.image) {
      const imgPath = path.join(__dirname, "..", blog.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (blog.thumbnail) {
        const thumbPath = path.join(__dirname, "..", blog.thumbnail);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Blog deleted successfully!",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== setting ==========================================//

module.exports.getsettingpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Setting", { admin });
  } catch (error) {
    console.log(error);
  }
};

// ================================
//  Get Contact Json
// ================================
module.exports.getSettingjson = async (req, res) => {
  try {
    const data = await Setting.findOne();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ================================
//  Add + Update Contact
// ================================

module.exports.saveSetting = async (req, res) => {
  try {
    const payload = { ...req.body };
    console.log(payload)
    const existing = await Setting.findOne();

    // --- LOGO ---
    if (req.files?.logo?.length > 0) {
      payload.logo = `/uploads/setting/${req.files.logo[0].filename}`;

      if (existing?.logo) {
        const oldLogo = path.join(process.cwd(), existing.logo);
        if (fs.existsSync(oldLogo)) fs.unlinkSync(oldLogo);
      }
    } else if (existing?.logo) {
      payload.logo = existing.logo;
    }

    // --- FAVICON ---
    if (req.files?.favicon?.length > 0) {
      payload.favicon = `/uploads/setting/${req.files.favicon[0].filename}`;

      if (existing?.favicon) {
        const oldFavicon = path.join(process.cwd(), existing.favicon);
        if (fs.existsSync(oldFavicon)) fs.unlinkSync(oldFavicon);
      }
    } else if (existing?.favicon) {
      payload.favicon = existing.favicon;
    }

    // --- THEME COLORS ---
payload.theme = {
  primaryColor: payload.primaryColor || "#6B4FE6",
  secondaryColor: payload.secondaryColor || "#795EFE",
};

delete payload.primaryColor;
delete payload.secondaryColor;

    // --- Update or Create ---
    if (existing) {
      await Setting.updateOne({ _id: existing._id }, payload);
      return res.json({ success: true, msg: "Setting updated" });
    } else {
      await Setting.create(payload);
      return res.json({ success: true, msg: "Setting created" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//========================================== Categories ==========================================//

// ================================
// Render Business Type Page
// ================================
module.exports.getBusinessType = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Businesstype", { admin }); // view same rakhi
  } catch (error) {
    console.log(error);
  }
};

// ================================
// BusinessType JSON
// ================================
module.exports.getBusinessTypeJSON = async (req, res) => {
  try {
    const businessTypes = await BusinessType.find().sort({
      createdAt: -1,
      _id: -1,
    });

    res.json({ data: businessTypes });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// Add / Update BusinessType
// ================================
module.exports.saveBusinessType = async (req, res) => {
  try {
    const { id, type, status, iconName, shortDescription } = req.body;

    if (!type) {
      return res.status(200).json({
        success: false,
        message: "Title is required",
      });
    }

    const payload = {
      type,
      status: status === "true",
      iconName,
      shortDescription,
    };

    // UPDATE
    if (id) {
      const businessType = await BusinessType.findByIdAndUpdate(id, payload, {
        new: true,
      });

      if (!businessType) {
        return res.json({
          success: false,
          message: "Business type not found",
        });
      }

      return res.json({
        success: true,
        message: "Business type updated successfully",
      });
    }

    // CREATE
    await BusinessType.create(payload);

    res.json({
      success: true,
      message: "Business type added successfully",
    });
  } catch (err) {
    console.error("saveBusinessType error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// Delete BusinessType
// ================================
module.exports.deleteBusinessType = async (req, res) => {
  try {
    const businessType = await BusinessType.findByIdAndDelete(req.params.id);

    if (!businessType) {
      return res.json({
        success: false,
        message: "Business type not found",
      });
    }

    res.json({
      success: true,
      message: "Business type deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// Toggle BusinessType Status
// ================================
module.exports.toggleBusinessTypeStatus = async (req, res) => {
  try {
    const businessType = await BusinessType.findById(req.params.id);

    if (!businessType) {
      return res.json({
        success: false,
        message: "Business type not found",
      });
    }

    businessType.status = !businessType.status;
    await businessType.save();

    res.json({
      success: true,
      message: `Business type ${businessType.status ? "enabled" : "disabled"
        } successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//========================================== Countries ==========================================//

module.exports.getcountries = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Countries", { admin });
  } catch (error) {
    console.log(error);
  }
};

// ================================
// Add or Update Country
// ================================
module.exports.saveCountry = async (req, res) => {
  try {
    const { id, name, status } = req.body;

    if (!name || name.trim() === "") {
      return res.json({ success: false, message: "Country name is required" });
    }

    const statusValue = status === "true"; // convert string to boolean
    const trimmedName = name.trim();

    // --- Check for duplicate country (case-insensitive) ---
    const existingCountry = await Country.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") }, // "i" = case-insensitive
    });

    if (existingCountry) {
      // Agar ID diya hai aur update kar rahe hain
      if (!id || existingCountry._id.toString() !== id) {
        return res.json({ success: false, message: "Country already exists" });
      }
    }

    if (id) {
      const country = await Country.findByIdAndUpdate(
        id,
        { name: name.trim(), status: statusValue },
        { new: true },
      );
      if (!country)
        return res.json({ success: false, message: "Country not found" });

      return res.json({
        success: true,
        message: "Country updated successfully",
      });
    }

    await Country.create({ name: name.trim(), status: statusValue });
    res.json({ success: true, message: "Country added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Delete Country
// ================================
module.exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findByIdAndDelete(id);
    if (!country)
      return res.json({ success: false, message: "Country not found" });

    res.json({ success: true, message: "Country deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Toggle Status
// ================================
module.exports.CounteytoggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findById(id);
    if (!country)
      return res.json({ success: false, message: "Country not found" });

    country.status = !country.status;
    await country.save();

    res.json({
      success: true,
      message: `Country ${country.status ? "Enabled" : "Disabled"} successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Get Countries JSON
// ================================
module.exports.getCountriesJSON = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const searchLower = search.toLowerCase();

    let statusQuery = [];
    if (searchLower.includes("en")) statusQuery.push({ status: true });
    if (searchLower.includes("dis")) statusQuery.push({ status: false });

    const query = search
      ? {
        $or: [{ name: { $regex: search, $options: "i" } }, ...statusQuery],
      }
      : {};

    const totalRecords = await Country.countDocuments();
    const filteredRecords = await Country.countDocuments(query);

    const data = await Country.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    res.json({
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//========================================== States ==========================================//

// ================================
// Get States JSON
// ================================
module.exports.getStatesJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const searchLower = search.toLowerCase();

    let statusQuery = [];
    if (searchLower.includes("en")) statusQuery.push({ status: true });
    if (searchLower.includes("dis")) statusQuery.push({ status: false });

    let query = {};

    const countries = await Country.find(
      { name: { $regex: search, $options: "i" } },
      { _id: 1 },
    );

    const countryIds = countries.map((c) => c._id);

    query = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { country: { $in: countryIds } },
          ...statusQuery,
        ],
      }
      : {};

    const total = await State.countDocuments();
    const filtered = await State.countDocuments(query);

    const states = await State.find(query)
      .populate("country", "name")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = states.map((s) => ({
      _id: s._id,
      name: s.name,
      status: s.status,
      country: s.country?.name || "N/A",
      countryId: s.country?._id || null, // add this line
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Add/Update State
// ================================
module.exports.saveState = async (req, res) => {
  try {
    const { id, name, country, status } = req.body;
    if (!name || !country)
      return res.json({ success: false, message: "All fields are required" });

    if (id) {
      const state = await State.findByIdAndUpdate(
        id,
        { name, country, status: status === "true" },
        { new: true },
      );
      if (!state)
        return res.json({ success: false, message: "State not found" });
      return res.json({ success: true, message: "State updated successfully" });
    }

    await State.create({ name, country, status: status === "true" });
    res.json({ success: true, message: "State added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Delete State
// ================================
module.exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByIdAndDelete(id);
    if (!state) return res.json({ success: false, message: "State not found" });
    res.json({ success: true, message: "State deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Toggle Status ---
module.exports.togglestatesStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findById(id);
    if (!state) return res.json({ success: false, message: "State not found" });
    state.status = !state.status;
    await state.save();
    res.json({
      success: true,
      message: `State ${state.status ? "enabled" : "disabled"} successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Get Countries JSON
// ================================
module.exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find({ status: true }).sort({ name: 1 });
    res.json({ success: true, data: countries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//========================================== Active Users ==========================================//

// ================================
// Get Users JSON for DataTable
// ================================
module.exports.getactiveUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // Base query: only active users
    let query = { status: 1, emailVerified: 1 };

    // Apply search if present
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { timezone: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments({status: 1, emailVerified: 1}); // only active
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName +" "+u.lastName,
      lastName: u.lastName,
      email: u.email,
      phone: u?.phone || "",
      bio: u.bio,
      timezone: u.timezone,
      ip: u.ip,
      status: u.status,
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Toggle User Status
// ================================
module.exports.toggleuserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // status logic
    if (user.status === 1) {
      // Active → Inactive
      user.status = 0;
    } else if (user.status === 0) {
      // Inactive → Active
      user.status = 1;
    }

    await user.save();

    res.json({
      success: true,
      message:
        user.status === 1
          ? "User activated successfully"
          : "User deactivated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const UserActivity = require("../models/UserActivity");

// ================================
// Toggle User Email Verification
// ================================
module.exports.toggleEmailVerification = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Flip email verification
    user.emailVerified = !user.emailVerified;

    await user.save();

    if(user.emailVerified){
      await assignFreePlanOnce(user);
    }

    res.json({
      success: true,
      message: user.emailVerified
        ? "Email marked as verified"
        : "Email verification removed",
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    res.json({ success: false, message: "Server error" });
  }
};

//========================================== Banned Users ==========================================//
// ================================
// Get All User Json
// ================================
module.exports.getbannedUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // Base query: only active users
    let query = { status: 0 };

    // Apply search if present
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { timezone: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments({status: 0}); // only active
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName+" "+u.lastName,
      lastName: u.lastName,
      email: u.email,
      phone: u?.phone || "",
      bio: u.bio,
      timezone: u.timezone,
      ip: u.ip,
      status: u.status,
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getverifieduser = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Notverifieduser", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

//========================================== not verified Users ==========================================//
// ================================
// Get All User Json
// ================================
module.exports.getnotverifiedUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // Base query: only active users
    let query = { emailVerified: 0, status: 1 };

    // Apply search if present
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { timezone: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments({ emailVerified: 0, status: 1 }); // only active
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName +" "+u.lastName,
      lastName: u.lastName,
      email: u.email,
      phone: u?.phone || "",
      bio: u.bio,
      timezone: u.timezone,
      ip: u.ip,
      status: u.status,
      emailVerified: u.emailVerified,
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
//========================================== All Users ==========================================//
// ================================
// Get All User Json
// ================================
module.exports.getUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const searchLower = search.toLowerCase();

    // Status filter
    let statusQuery = [];
    if (searchLower.includes("ac")) statusQuery.push();
    if (searchLower.includes("ba")) statusQuery.push();

    const query = search
      ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { timezone: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
          ...statusQuery,
        ],
      }
      : {};

    const total = await User.countDocuments();
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName+" "+u.lastName,
      lastName: u.lastName,
      email: u.email,
      phone: u?.phone || "",
      bio: u.bio,
      timezone: u.timezone,
      ip: u.ip,
      status: u.status,
      emailVerified: u.emailVerified,
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//========================================== Users Details ==========================================//
// ================================
// Get User Details
// ================================
module.exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");

    const admin = await Admin.find();

    // Find active subscription
    const subscription = await UserSubscription.findOne({
      userId: id,
      status: "active",
    })
      .populate("planId")
      .lean();

    const planInfo = subscription
      ? {
        planName: subscription.planId?.name || "No plan",
        startDate: subscription.startDate,
        endDate: subscription.endDate ? subscription.endDate : "Unlimited",
        totalWebsite: subscription.totalWebsite ?? 0,
        websiteCreated: subscription.websiteCreated ?? 0,
        billingType: subscription.billingType ?? "-",
        isFree: subscription.isFree,
      }
      : {
        planName: "No Plan",
        totalWebsite: 0,
        websiteCreated: 0,
        billingType: "-",
        isFree: false,
      };

    res.render("Userdetails", { user, admin, planInfo });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

//========================================== Send notification ==========================================//

module.exports.Sendnotification = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Sendnotification", { admin });
  } catch (error) {
    console.log(error);
  }
};
// ================================
// Get User Emils
// ================================
module.exports.fetchusersemail = async (req, res) => {
  try {
    const users = await User.find(
      { marketingEmails: 1 },
      "firstName lastName email",
    );

    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: false });
  }
};
// ================================
// Send Email
// ================================
module.exports.sendEmail = async (req, res) => {
  try {
    const { type, subject, message, users } = req.body;

    let emailList = [];

    if (type === "all") {
      const allUsers = await User.find({ marketingEmails: 1 }, "email");
      emailList = allUsers.map((u) => u.email);
    }

    if (type === "specific") {
      emailList = users;
    }

    if (!emailList.length) {
      return res.json({
        success: false,
        message: "No users selected.",
      });
    }

    let customizedMessage = message;

    const setting = await Setting.findOne().lean();

    const mailOptions = {
      from: setting.email,
      to: emailList,
      subject,
      html: customizedMessage,
    };

    const transporter = await getTransporter();
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Email sending failed.",
    });
  }
};

//========================================== Payment ==========================================//
// ================================
// Get Panding Payments
// ================================
exports.getpandingPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";
    const settings = await Setting.findOne({});
    const currencySymbol = settings?.currencySymbol;
    const currencyCode = settings?.currency;
    // Default only pending payments
    let query = { status: "open" };

    if (search) {
      query = {
        $and: [
          { status: "open" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "open" });
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = payments.map((p) => ({
      ...p.toObject(),
      amountWithSymbol: `${currencySymbol}${p.amount}`, // e.g. $100
      currencySymbol,
      currencyCode,
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Get Faild Payments
// ================================
exports.getrejectPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    const settings = await Setting.findOne({});
    const currencySymbol = settings?.currencySymbol;
    const currencyCode = settings?.currency;
    // Default only pending payments
    let query = { status: "failed" };

    if (search) {
      query = {
        $and: [
          { status: "failed" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "failed" });
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = payments.map((p) => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode,
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};
// ================================
// Get Success Payments
// ================================
exports.getsuccessPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";
    const setting = await Setting.findOne({});
    const currencySymbol = setting?.currencySymbol;
    const currencyCode = setting?.currency;
    // Default only pending payments
    let query = { status: "success" };

    if (search) {
      query = {
        $and: [
          { status: "success" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "success" });
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = payments.map((p) => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Get Payments list
// ================================
exports.getPaymentslist = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    const settings = await Setting.findOne({});
    const currencySymbol = settings?.currencySymbol;
    const currencyCode = settings?.currency;
    // Default only pending payments
    let query = {};

    if (search) {
      query = {
        $and: [
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const totalRecords = await Payment.countDocuments({});
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = payments.map((p) => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode,
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Paymen details
// ================================
const moment = require("moment");

module.exports.Paymendetails = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("userId");
  const admin = await Admin.find();
  const user = payment?.userId || null;

  const settings = await Setting.findOne({});
  const currencySymbol = settings?.currencySymbol;
  const currencyCode = settings?.currency;
  res.render("Paymentdetails", {
    payment,
    user,
    moment,
    admin,
    currencySymbol,
    currencyCode,
  });
};
// ================================
// Payment History details
// ================================
module.exports.Allpaymentdetails = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("userId");
  const admin = await Admin.find();
  const settings = await Setting.findOne({});
  const currencySymbol = settings?.currencySymbol;
  const currencyCode = settings?.currency;
  res.render("Allpaymentdetails", {
    payment,
    user: payment?.userId || null,
    moment,
    admin,
    currencySymbol,
    currencyCode,
  });
};

//========================================== Support Ticket  ==========================================//

// ================================
// Get Open Support Tickets
// ================================
exports.getOpenSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "open" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } }, // keep tickets even if user is missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({ status: "open" });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(
      filteredCountPipeline,
    );
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } }, // sort by lastReply
      { $skip: start },
      { $limit: length },
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map((t) => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "Deleted User",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "",
      },
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Get Closed Support Tickets
// ================================
exports.getClosedSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "closed" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } }, // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({
      status: "closed",
    });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(
      filteredCountPipeline,
    );
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { lastReply: -1 } }, // sort by lastReply
      { $skip: start },
      { $limit: length },
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map((t) => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "Deleted User",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "",
      },
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Get Answered Support Tickets
// ================================
exports.getAnsweredSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "answered" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } }, // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({
      status: "answered",
    });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(
      filteredCountPipeline,
    );
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { lastReply: -1 } }, // sort by lastReply
      { $skip: start },
      { $limit: length },
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map((t) => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "Deleted User",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "",
      },
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Get Answered Support Tickets
// ================================
exports.getSupportTicketsjson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {}; // no status filter, get all tickets

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } }, // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({});

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(
      filteredCountPipeline,
    );
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map((t) => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "Deleted User",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "",
      },
    }));

    return res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Support Ticket List Error:", err);
    return res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

// ================================
// Close Ticket
// ================================
// routes/ticket.js (or controller)
exports.updateTicketStatus = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body; // new status from frontend

    if (!ticketId)
      return res
        .status(200)
        .json({ success: false, message: "Ticket ID missing" });
    if (!status)
      return res
        .status(200)
        .json({ success: false, message: "Status missing" });

    const allowedStatuses = ["open", "answered", "closed"];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid status" });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket)
      return res
        .status(200)
        .json({ success: false, message: "Ticket not found" });

    if (!req.session?.adminId)
      return res.status(200).json({ success: false, message: "Unauthorized" });

    ticket.status = status;
    ticket.lastReply = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: `Ticket status updated to "${status}" successfully!`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================================
// DELETE message from a ticket
// ================================
exports.deleteTicketMessage = async (req, res) => {
  try {
    const { ticketId, messageId } = req.params;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket){
 return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }
     

    const message = ticket.messages.find(
      (msg) => msg._id.toString() === messageId,
    );
    if (!message){
 return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
     
    if (message.attachments && message.attachments.length > 0) {
      await Promise.all(
        message.attachments.map(async (a) => {
          try {
            const filePath = path.join(__dirname, "..", a.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.warn(
              "Attachment not found or failed to delete:",
              a.url,
              err.message,
            );
          }
        }),
      );
    }

    ticket.messages = ticket.messages.filter(
      (msg) => msg._id.toString() !== messageId,
    );
    await ticket.save();

    res.json({ success: true, messageId });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//========================================== Support Ticket  ==========================================//qew

// ================================
// Get Subscription History
// ================================

exports.getSubscriptionHistory = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim();

    const totalRecords = await UserSubscription.countDocuments();

    const pipeline = [
      // USER JOIN
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // PLAN JOIN
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: {
          path: "$plan",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // =================================================
    // SEARCH
    // =================================================
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { billingType: { $regex: search, $options: "i" } }, // billingType
            { status: { $regex: search, $options: "i" } }, // status
            { "plan.name": { $regex: search, $options: "i" } }, // plan name
            { "user.firstName": { $regex: search, $options: "i" } }, // user fname
            { "user.lastName": { $regex: search, $options: "i" } }, // user lname
          ],
        },
      });
    }

    // PAGINATION + SORT
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },

      // FINAL SHAPE
      {
        $project: {
          plan: { $ifNull: ["$plan.name", "N/A"] },
          billingType: 1,
          status: 1,
          totalLeads: 1,
          remainingLeads: 1,
          startDate: 1,
          endDate: 1,
          createdAt: 1,
          user: {
            $cond: [
              { $ifNull: ["$user._id", false] },
              {
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                email: "$user.email",
              },
              null,
            ],
          },
        },
      },
    );

    const data = await UserSubscription.aggregate(pipeline);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: search ? data.length : totalRecords,
      data,
    });
  } catch (err) {
    console.error(err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

//========================================== Lead   ==========================================//

// ================================
// Get Login History Json
// ================================
exports.getLoginHistoryJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {}; // base: all records

    // Aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // keep records even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { ip: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { browser: { $regex: search, $options: "i" } },
            { os: { $regex: search, $options: "i" } },
            { "user.firstName": { $regex: search, $options: "i" } },
            { "user.lastName": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Total records
    const totalRecords = await LoginHistory.countDocuments();

    // Filtered records count
    const filteredCountArr = await LoginHistory.aggregate([
      ...pipeline,
      { $count: "count" },
    ]);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // Fetch paginated data
    let data = await LoginHistory.aggregate([
      ...pipeline,
      { $sort: { loginAt: -1 } },
      { $skip: start },
      { $limit: length },
    ]);

    // Flatten user info for DataTables
    data = data.map((d) => ({
      _id: d._id,
      ip: d.ip,
      location: d.location,
      browser: d.browser,
      os: d.os,
      loginAt: d.loginAt,
      user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "Deleted User",
      email: d.user?.email || "Deleted User",
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Login History Error:", err);
    res.json({ draw: 0, recordsTotal: 0, recordsFiltered: 0, data: [] });
  }
};

// ================================
// Get Single Login History Json
// ================================
exports.getSingleUserLoginHistoryJSON = async (req, res) => {
  try {
    const userId = req.params.id;

    // DataTables params
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query["search[value]"]?.trim() || "";
    const orderColumnIndex = parseInt(req.query.order?.[0]?.column) || 0;
    const orderDir = req.query.order?.[0]?.dir === "asc" ? 1 : -1;
    const orderColumns = ["loginAt", "ip", "location", "browser", "os"];
    const sortField = orderColumns[orderColumnIndex] || "loginAt";

    // Validate user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.json({
        draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      });
    }

    // Base filter: only this user
    let filter = { userId };

    // Search filter
    if (searchValue) {
      filter.$or = [
        { ip: { $regex: searchValue, $options: "i" } },
        { location: { $regex: searchValue, $options: "i" } },
        { browser: { $regex: searchValue, $options: "i" } },
        { os: { $regex: searchValue, $options: "i" } },
      ];
    }

    // Total records for this user
    const recordsTotal = await LoginHistory.countDocuments({ userId });
    const recordsFiltered = await LoginHistory.countDocuments(filter);

    // Fetch paginated & sorted data
    const history = await LoginHistory.find(filter)
      .sort({ [sortField]: orderDir })
      .skip(start)
      .limit(length)
      .lean();

    // Format for DataTables
    const data = history.map((h) => ({
      loginAt: h.loginAt,
      loginAtFormatted: h.loginAt,
      timeAgo: moment(h.loginAt).fromNow(),
      ip: h.ip || "-",
      location: h.location || "-",
      browser: h.browser || "-",
      os: h.os || "-",
    }));

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Login history JSON error:", err);
    res.status(500).json({
      draw: req.query.draw || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

exports.SingleUserLoginHistoryPage = async (req, res) => {
  try {
    const userId = req.params.id;

    const admin = await Admin.find();

    const userExists = await User.findOne(
      { _id: userId },
      {
        firstName: 1,
        lastName: 1,
      },
    );
    res.render("Userlogindetails", {
      userId,
      admin,
      userExists, // agar admin header ke liye use hota hai
    });
  } catch (err) {
    console.error("Login history page error:", err);
    res.status(500).send("Server error");
  }
};

// ================================
// Get Notification History
// ================================
exports.getNotificationJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {};

    // Base pipeline
    const pipeline = [
      { $match: matchQuery },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ];

    // Search
    if (search) {
      const regex = { $regex: search, $options: "i" };
      pipeline.push({
        $match: {
          $or: [
            { subject: regex },
            { message: regex },
            { "user.firstName": regex },
            { "user.lastName": regex },
            { "user.email": regex },
          ],
        },
      });
    }

    // Total count
    const totalRecords = await Notification.countDocuments();

    // Filtered count
    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await Notification.aggregate(
      filteredCountPipeline,
    );
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // Fetch paginated data
    const dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },

      {
        $project: {
          _id: 1,
          subject: 1,
          message: 1,
          createdAt: 1,

          // FIX: return as userId object
          userId: {
            firstName: { $ifNull: ["$user.firstName", "Deleted User"] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            email: { $ifNull: ["$user.email", ""] },
          },
        },
      },
    ];

    const data = await Notification.aggregate(dataPipeline);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data,
    });
  } catch (err) {
    console.error("Notification List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

//========================================== login   ==========================================//

// ================================
// Get Login Page
// ================================
exports.loginpage = async (req, res) => {
  try {

    if (req.session.adminId) {
      return res.redirect("/");
    }

    const setting = await Setting.findOne(
      {},
      { logo: 1, favicon: 1 , companyName: 1 }
    ).lean();

    // Get error message from session
    const error = req.session.loginError || null;

    // Remove it so it shows only once
    delete req.session.loginError;

    res.render("Login", {
      logo: setting?.logo,
      favicon: setting?.favicon,
      companyName: setting?.companyName,
      error,
      email: req.session.loginEmail || ""
    });

    delete req.session.loginEmail;

  } catch (err) {
    console.log(err);
    res.render("Login", {
      error: "Something went wrong. Please try again."
    });
  }
};
// ================================
// Post Signup
// ================================
// controllers/authController.js



// ================================
// Post Login
// ================================
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 Minutes

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      req.session.loginError = "Please enter both your email address and password.";
      req.session.loginEmail = email;

      return res.redirect("/loginpage");
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {

      req.session.loginError = "Invalid email or password.";
      req.session.loginEmail = email;

      return res.redirect("/loginpage");
    }

    // ==========================
    // CHECK ACCOUNT LOCK
    // ==========================

    if (admin.lockUntil && admin.lockUntil > Date.now()) {

      const remainingMinutes = Math.ceil(
        (admin.lockUntil - Date.now()) / 60000
      );

      req.session.loginError =
        `Your account has been temporarily locked. Please try again in ${remainingMinutes} minute(s).`;

      req.session.loginEmail = email;

      return res.redirect("/loginpage");
    }

    // ==========================
    // LOCK EXPIRED
    // ==========================

    if (admin.lockUntil && admin.lockUntil <= Date.now()) {

      admin.loginAttempts = 0;
      admin.lockUntil = null;

      await admin.save();
    }

    // ==========================
    // CHECK PASSWORD
    // ==========================

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {

      admin.loginAttempts = (admin.loginAttempts || 0) + 1;

      if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {

        admin.loginAttempts = 0;
        admin.lockUntil = new Date(Date.now() + LOCK_TIME);

        await admin.save();

        req.session.loginError =
          `Your account has been temporarily locked for ${LOCK_TIME / 60000} minutes due to multiple unsuccessful login attempts.`;

        req.session.loginEmail = email;

        return res.redirect("/loginpage");
      }

      await admin.save();

      const remainingAttempts =
        MAX_LOGIN_ATTEMPTS - admin.loginAttempts;

      req.session.loginError =
        `Invalid email or password. You have ${remainingAttempts} login attempt(s) remaining.`;

      req.session.loginEmail = email;

      return res.redirect("/loginpage");
    }

    // ==========================
    // SUCCESS LOGIN
    // ==========================

    admin.loginAttempts = 0;
    admin.lockUntil = null;

    await admin.save();

    req.session.adminId = admin._id;
    req.session.adminEmail = admin.email;

    return res.redirect("/");

  } catch (err) {

    console.log(err);

    req.session.loginError =
      "Something went wrong. Please try again.";

    return res.redirect("/loginpage");
  }
};

// ================================
// Post Logout
// ================================
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    res.redirect("/loginpage");
  });
};
// ================================
// Middleware: Protect Routes
// ================================
exports.requireLogin = (req, res, next) => {
  if (!req.session.adminId) return res.redirect("/loginpage");
  next();
};

//=====================================Forget password==========================================//
// ================================
//  GET: Forget Password Page
// ================================
module.exports.getForgetPassword = async (req, res) => {
  const success = req.session.success || null;
  const error = req.session.error || null;
  req.session.success = null;
  req.session.error = null;

  const setting = await Setting.findOne({}, { logo: 1, favicon: 1 }).lean();

  res.render("Forgetpassword", {
    success,
    error,
    logo: setting?.logo,
    favicon: setting?.favicon,
  });
};

// ================================
//  POST: Handle Forget Password
// ================================
module.exports.postForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res
        .status(200)
        .json({ success: false, message: "Email not found" });
    }

    // Delete any old tokens
    await AdminPasswordResetToken.deleteMany({ adminId: admin._id });

    // Create a new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await new AdminPasswordResetToken({
      adminId: admin._id,
      token,
      expiresAt,
    }).save();

    //  Instead of req.get("host"), use BASE_URL from .env or relative link
    const baseURL = process.env.BASE_URL;
 
    const resetLink = `${baseURL}/reset-password/${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px">
        <h2>Password Reset Request</h2>
        <p>Hello Admin,</p>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;padding:10px 20px;
             background:#007bff;color:#fff;text-decoration:none;border-radius:5px">
             Reset Password
          </a>
        </p>
        <p>This link will expire in <b>30 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>Thanks,<br/>GrowLead Team</p>
      </div>
    `;
    const transporter = await getTransporter();

    const setting = await Setting.findOne().lean();
 
    await transporter.sendMail({
      from: `"Weblify" <${setting.email}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Password reset link sent to your email!",
      });
  } catch (err) {
    console.error(err);
    return res
      .status(200)
      .json({ success: false, message: "Failed to send reset link" });
  }
};

// ================================
//  GET: Reset Password Page
// ================================
module.exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenDoc = await AdminPasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid or expired link" });
    }

    const setting = await Setting.findOne({}, { logo: 1, favicon: 1 }).lean();

    res.render("Resetpassword", {
      token,
      logo: setting?.logo,
      favicon: setting?.favicon,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================================
//  POST: Reset Password
// ================================
module.exports.postResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const tokenDoc = await AdminPasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid or expired token" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(200)
        .json({ success: false, message: "Passwords do not match" });
    }

    const admin = await Admin.findById(tokenDoc.adminId);
    if (!admin) {
      return res
        .status(200)
        .json({ success: false, message: "User not found" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    await AdminPasswordResetToken.findByIdAndDelete(tokenDoc._id);

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//=====================================User Contact Us==========================================//

module.exports.getInquiry = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Inquiry", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

// ================================
//  Get In Touch Json
// ================================
module.exports.getinquiryjson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    let query = {};

    //  Searching
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { subject: regex },
        { message: regex },
      ];
    }

    // Total Records
    const totalRecords = await Inquiry.countDocuments();

    // Filtered Records Count
    const filteredRecords = await Inquiry.countDocuments(query);

    // Fetch Data
    const data = await Inquiry.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    // Send Response
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });
  } catch (err) {
    console.error("Contact List Error:", err);
    res.json({ draw: 0, recordsTotal: 0, recordsFiltered: 0, data: [] });
  }
};
// ================================
// DELETE CONTACT
// ================================
module.exports.deleteInquiryJSON = async (req, res) => {
  try {
    const id = req.params.id;

    const contact = await Inquiry.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await Inquiry.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Contact deleted successfully!",
    });
  } catch (err) {
    console.error("Delete Contact Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
    });
  }
};

//=====================================newsletter==========================================//

module.exports.newsletterpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Newsletter", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

// ================================
// get newsletter json
// ================================
module.exports.getNewsletterJson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    let query = {};

    // Search filter
    if (search) {
      query = {
        email: { $regex: search, $options: "i" },
      };
    }

    // Total documents
    const total = await Newsletter.countDocuments();

    // Filtered documents
    const filtered = await Newsletter.countDocuments(query);

    // Pagination + sorting
    const data = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(start)
      .limit(length);

    // Response
    return res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

//=====================================profile==========================================//

module.exports.getprofile = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Profile", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

// ================================
// Update Profile (Name + Password)
// ================================
exports.changePassword = async (req, res) => {
  try {
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.session.adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (name && name.trim() !== "") {
      admin.name = name.trim();
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.json({
          success: false,
          message: "All password fields are required",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.json({
          success: false,
          message: "New password and confirm password do not match",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
    }

    await admin.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      name: admin.name,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// ================================
// Update Profile Image
// ================================

module.exports.updateProfileImage = async (req, res) => {
  try {
    const adminId = req.session.adminId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Delete old profile image if exists
    if (admin.profile) {
      const oldImagePath = path.join(__dirname, "..", admin.profile);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image path in DB
    admin.profile = `/uploads/adminprofile/${req.file.filename}`;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profile: admin.profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//=====================================Hero Sction==========================================//

module.exports.getherosectionpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "hero" }).lean();

    res.render("Herosection", { admin, section });
  } catch (error) {
    res.status(500).send("Error loading hero section page");
  }
};

// Get Hero Section JSON for DataTable
module.exports.getherosectionjson = async (req, res) => {
  try {
    const section = await PageSection.findOne({ type: "hero" }).lean();

    if (!section) {
      return res.json({
        success: true,
        data: {
          title: "",
          shortDescription: "",
          features: "",
          labels: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        _id: section._id,
        title: section.title || "",
        shortDescription: section.shortDescription || "",
        features: section.features,
        labels: Array.isArray(section.labels) ? section.labels : [],
        backgroundImg: section.backgroundImg || "",
        mainImg: section.mainImg || "",
        herofetures: section.herofetures || [],
      },
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      data: {
        title: "",
        shortDescription: "",
        features: "",
        labels: [],
      },
    });
  }
};

// ================================
// Save Hero Section (Add/Edit)
// ================================
module.exports.saveherosection = async (req, res) => {
  try {
    const { title, shortDescription, herofetures, type, special } = req.body;

    if (!title || !shortDescription) {
      return res.json({
        success: false,
        message: "Title & Description required",
      });
    }

    // Parse labels array safely
    let labelsArray = [];
    if (req.body.labels) {
      try {
        labelsArray = JSON.parse(req.body.labels);
      } catch (err) {
        labelsArray = [];
      }
    }

    let herofeturesArray = [];
    if (req.body.herofetures) {
      try {
        herofeturesArray = JSON.parse(req.body.herofetures);
      } catch (err) {
        herofeturesArray = [];
      }
    }

    // FIND EXISTING (ONLY ONE)
    let hero = await PageSection.findOne({ type });

    // ================= CREATE FIRST TIME =================
    if (!hero) {
      await PageSection.create({
        type,
        title,
        special,
        shortDescription,
        labels: labelsArray,
        herofetures: herofeturesArray,
      });

      return res.json({ success: true, message: "Hero section created" });
    }

    // ================= UPDATE =================
    hero.title = title;
    ((hero.special = special), (hero.shortDescription = shortDescription));
    hero.labels = labelsArray;
    hero.herofetures = herofeturesArray;

    await hero.save();

    res.json({ success: true, message: "Hero section updated" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

//========================================== HERO STATS PAGE===========================================//

/* =========================
   HERO STATS PAGE
========================= */
module.exports.getHeroStats = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Herostats", { admin });
  } catch (err) {
    console.log(err);
  }
};

/* =========================
   HERO STATS JSON
========================= */
module.exports.getHeroStatsJson = async (req, res) => {
  try {
    const dataList = await HeroStat.find().sort({ createdAt: -1 });
    const data = dataList.map((h) => ({
      _id: h._id,
      label: h.label,
      count: h.count,
      iconName: h.iconName,
    }));
    res.json({ data });
  } catch (err) {
    res.json({ data: [] });
  }
};

/* =========================
   SAVE / UPDATE
========================= */
module.exports.saveHeroStats = async (req, res) => {
  try {
    const { id, label, count, iconName } = req.body;

    if (!label || !count || !iconName) {
      return res.json({ success: false, message: "All fields required" });
    }

    if (id) {
      await HeroStat.findByIdAndUpdate(id, { label, count, iconName });
      return res.json({ success: true, message: "Updated successfully" });
    }

    await HeroStat.create({ label, count, iconName });
    res.json({ success: true, message: "Added successfully" });
  } catch (err) {
    res.json({ success: false, message: "Save failed" });
  }
};

/* =========================
   DELETE
========================= */
module.exports.deleteHeroStats = async (req, res) => {
  try {
    await HeroStat.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: "Delete failed" });
  }
};

//==========================================How it work===========================================//

// =======================
// PAGE LOAD
// =======================
exports.getHowItWork = async (req, res) => {
  try {
    const section = await PageSection.findOne({ type: "howitwork" });
    const admin = await Admin.find();
    res.render("Howitwork", { admin, section });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// =======================
// JSON (DATATABLE)
// =======================
exports.getHowItWorkJson = async (req, res) => {
  try {
    const list = await HowItWork.find().sort({ createdAt: -1 });
    res.json({ data: list });
  } catch {
    res.json({ data: [] });
  }
};

// =======================
// SAVE / UPDATE
// =======================
exports.saveHowItWork = async (req, res) => {
  try {
    const { id, iconName, title, description } = req.body;

    if (!title || !description) {
      return res.json({
        success: false,
        message: "Title and description are required",
      });
    }

    // ===============================
    // FEATURES (ARRAY LIKE HERO LABELS)
    // ===============================
    let features = [];
    if (req.body.features) {
      try {
        features = JSON.parse(req.body.features);
      } catch {
        features = [];
      }
    }

    // ===============================
    // IMAGE HANDLE
    // ===============================
    let newImagePath = "";
    if (req.file) {
      newImagePath = "/uploads/howitwork/" + req.file.filename;
    }

    // ===============================
    // UPDATE
    // ===============================
    if (id) {
      const old = await HowItWork.findById(id);

      if (!old) {
        return res.json({ success: false, message: "Record not found" });
      }

      const updateObj = {
        iconName,
        title,
        description,
        features,
      };

      //  ONLY IF NEW IMAGE UPLOADED
      if (newImagePath) {
        if (old.image) {
          const fs = require("fs");
          const path = require("path");
          const oldPath = path.join(__dirname, "..", old.image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        updateObj.image = newImagePath;
      }

      await HowItWork.findByIdAndUpdate(id, updateObj);
      return res.json({ success: true, message: "Updated successfully" });
    }

    // ===============================
    // ADD (IMAGE REQUIRED FIRST TIME)
    // ===============================
    if (!req.file) {
      return res.json({
        success: false,
        message: "Image is required",
      });
    }

    await HowItWork.create({
      iconName,
      title,
      description,
      features,
      image: newImagePath,
    });

    res.json({ success: true, message: "Added successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Save failed" });
  }
};

// =======================
// DELETE
// =======================
exports.deleteHowItWork = async (req, res) => {
  try {
    const data = await HowItWork.findById(req.params.id);

    if (data?.image) {
      const imgPath = path.join(__dirname, "..", data.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await HowItWork.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch {
    res.json({ success: false, message: "Delete failed" });
  }
};

//=================================================== Features==========================//

// RENDER PAGE
module.exports.getFeatures = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "feature" }).lean();

    res.render("Features", { admin, section });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// ================================
//   GET JSON DATA
// ================================
module.exports.getFeaturesJson = async (req, res) => {
  try {
    const dataList = await Features.find().sort({ createdAt: -1 });

    const data = dataList.map((row) => ({
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      iconName: row.iconName || "",
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};

// ================================
//  SAVE (CREATE / UPDATE)
// ================================
module.exports.saveFeatures = async (req, res) => {
  try {
    const { id, title, description, iconName } = req.body;

    if (!title || !description || !iconName) {
      return res.json({
        success: false,
        message: "Title, Description & Icon are required",
      });
    }

    if (id) {
      // UPDATE
      const updated = await Features.findByIdAndUpdate(
        id,
        { title, description, iconName },
        { new: true },
      );

      if (!updated) {
        return res.json({ success: false, message: "Record not found" });
      }

      return res.json({
        success: true,
        message: "Feature updated successfully",
      });
    } else {
      // CREATE
      const feature = new Features({
        title,
        description,
        iconName,
      });

      await feature.save();

      return res.json({
        success: true,
        message: "Feature added successfully",
      });
    }
  } catch (error) {
    console.error("Save Feature Error:", error);
    res.json({ success: false, message: "Something went wrong" });
  }
};

// ================================
//  DELETE
// ================================
module.exports.deleteFeatures = async (req, res) => {
  try {
    const deleted = await Features.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Delete failed" });
  }
};

//=============================================login section==============//

// GET VIEW (Render Page)
module.exports.getLoginSection = async (req, res) => {
  try {
    const admin = await Admin.find();
    const loginsection = await PageSection.findOne({ type: "login" });
    const signupSection = await PageSection.findOne({ type: "signup" });

    res.render("Loginsection", { admin, loginsection });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

module.exports.getSectionByTypeJson = async (req, res) => {
  try {
    const { type } = req.params;

    const section = await PageSection.findOne({ type });

    res.json({
      success: true,
      data: section,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================================Payment Gatway==========================//

exports.getPaymentPage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Paymentgateway", { admin });
  } catch (err) {
    console.log(err);
  }
};

// ==========================
// DATATABLE JSON
// ==========================
exports.getPaymentJson = async (req, res) => {
  const data = await PaymentGateway.find().sort({ createdAt: -1 });
  res.json({ data });
};



// SAVE (Add or Update) Payment Gateway
exports.savePaymentGateway = async (req, res) => {
  try {
    const id = req.params.id || null;
    let {
      name,
      secretKey,
      publicKey,
      privateKey,
      webhookUrl,
      fixedCharge,
      iconName,
      clientId,
      enabled,
    } = req.body;

    // Required fields check
    if (!name || !webhookUrl || !iconName) {
      return res.json({
        success: false,
        message: "Required fields missing",
      });
    }

    name = name.trim().toLowerCase();
    enabled = enabled === "true" || enabled === "on" || enabled === true;

    // Reset optional fields
    secretKey = secretKey || "";
    clientId = clientId || "";
    publicKey = publicKey || "";
    privateKey = privateKey || "";

    // Validation per gateway
    switch (name) {
      case "paypal":
        if (!clientId || !secretKey) {
          return res.json({
            success: false,
            message: "Paypal Client ID and Secret Key required",
          });
        }
        publicKey = "";
        privateKey = "";
        break;

      case "razorpay":
        if (!clientId || !secretKey) {
          return res.json({
            success: false,
            message: "Razorpay Key ID and Secret required",
          });
        }
        publicKey = "";
        privateKey = "";
        break;

      case "braintree":
        if (!clientId || !publicKey || !privateKey) {
          return res.json({
            success: false,
            message: "Braintree Merchant ID, Public Key and Private Key required",
          });
        }
        secretKey = "";
        break;

      case "payhere":
        if (!clientId || !secretKey) {
          return res.json({
            success: false,
            message: "PayHere Merchant ID and Secret required",
          });
        }
        publicKey = "";
        privateKey = "";
        break;

      case "stripe":
        if (!secretKey) {
          return res.json({
            success: false,
            message: "Stripe Secret Key required",
          });
        }
        clientId = "";
        publicKey = "";
        privateKey = "";
        break;

      default:
        return res.json({
          success: false,
          message: "Invalid payment gateway",
        });
    }

    // If ID is provided → update
    if (id) {
      const updated = await PaymentGateway.findByIdAndUpdate(
        id,
        {
          name,
          secretKey,
          publicKey,
          privateKey,
          iconName,
          webhookUrl,
          fixedCharge,
          clientId,
          enabled,
        },
        { new: true }
      );




      if (!updated) {
        return res.json({
          success: false,
          message: "Payment Gateway not found",
        });
      }

      return res.json({
        success: true,
        message: "Payment Gateway Updated Successfully",
      });
    }

    // If no ID → add new, prevent duplicate
    const existing = await PaymentGateway.findOne({ name });
    if (existing) {
      return res.json({
        success: false,
        message: "Gateway already exists",
      });
    }

    await PaymentGateway.create({
      name,
      secretKey,
      publicKey,
      privateKey,
      iconName,
      webhookUrl,
      fixedCharge,
      clientId,
      enabled,
    });

    return res.json({
      success: true,
      message: "Payment Gateway Added Successfully",
    });
  } catch (err) {
    console.error("Save gateway error:", err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================
// DELETE
// ==========================
exports.deletePaymentGateway = async (req, res) => {
  try {
    await PaymentGateway.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Payment Gateway Deleted Successfully",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//================================================ Seo Setting==========================//

// ================================
// get pagesection type
// ================================
exports.updateSectionByType = async (req, res) => {
  try {
    // Labels is a JSON string, Features is a comma string
    let {
      type,
      title,
      shortDescription,
      labels,
      features,
      badge,
      special,
      subtitle,
    } = req.body;

    if (!type) {
      return res.status(200).json({
        success: false,
        message: "All fields Type are required",
      });
    }

    type = type.toLowerCase();

    // ===== FIND SECTION OR CREATE NEW =====
    // Using findOneAndUpdate with upsert to handle cases where it doesn't exist yet
    let existing = await PageSection.findOne({ type });

    if (!existing) {
      // Optional: Create if not exists (depending on your logic)
      existing = new PageSection({ type });
    }

    if (special !== undefined) {
      existing.special = special;
    }
    if (subtitle !== undefined) {
      existing.subtitle = subtitle;
    }
    // ===== UPDATE TEXT FIELDS =====
    if (title !== undefined) {
      existing.title = title;
    }

    if (shortDescription !== undefined) {
      existing.shortDescription = shortDescription;
    }

    if (badge !== undefined) {
      existing.badge = badge;
    }

    // ===== PARSE ARRAYS SAFELY =====
    let parsedLabels = [];
    try {
      parsedLabels = labels ? JSON.parse(labels) : [];
    } catch (e) {
      console.error("JSON Parse Error for labels:", e);
      parsedLabels = [];
    }

    // ===== SPECIFIC FIELDS =====
    // if (parsedLabels && parsedLabels.length > 0) {
    //   existing.labels = parsedLabels;
    // }
    existing.labels = parsedLabels;

    if (type === "signup" && features) {
      existing.features = features;
    }

    if (type === "login") {
      existing.features = "";
    }

    // ===== IMAGE HANDLING =====
    if (req.file) {
      const imagePath = `/uploads/pagesection/${req.file.filename}`;

      // Delete old image if it exists and is not the same
      if (existing.image && existing.image !== imagePath) {
        const oldImagePath = path.join(__dirname, "..", existing.image); // Adjust "../public" based on your folder structure
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Failed to delete old image:", err);
          });
        }
      }

      existing.image = imagePath;
    }

    await existing.save();

    return res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} section updated successfully`,
      data: existing,
    });
  } catch (error) {
    console.error("updateSectionByType Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================================
// Seo PAGE
// ================================
exports.getSeoPage = async (req, res) => {
  const admin = await Admin.find().lean();
  res.render("Seosettings", { admin });
};

// ================================
// GET SEO BY PAGE TYPE (TAB CLICK)
// ================================
exports.getSeoByType = async (req, res) => {
  try {
    const { type } = req.params;

    const seo = await Seo.findOne({ type }).lean();

    res.json(seo || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// CREATE OR UPDATE (UPSERT)
// ================================
exports.saveSeo = async (req, res) => {
  try {
    const { type, metaTitle, metaDescription, metaKeywords } = req.body;

    if (!type) {
      return res.json({ success: false, message: "Page type missing" });
    }

    // keywords → array
    const keywordsArr = metaKeywords
      ? metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
      : [];

    let imagePath = null;

    if (req.file) {
      imagePath = "/uploads/seo/" + req.file.filename;
    }

    // find existing seo by type
    const oldSeo = await Seo.findOne({ type });

    // delete old image if new uploaded
    if (req.file && oldSeo?.seoimage) {
      const oldImgPath = path.join(__dirname, "..", oldSeo.seoimage);
      if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
    }

    await Seo.updateOne(
      { type },
      {
        $set: {
          metaTitle,
          metaDescription,
          metaKeywords: keywordsArr,
          ...(imagePath && { seoimage: imagePath }),
        },
      },
      { upsert: true },
    );

    res.json({
      success: true,
      message: "SEO saved successfully!",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//=============================================== Emailtampleate ================================//
// Get JSON data for all templates
module.exports.emailTemplateListPage = async (req, res) => {
  try {
    const admin = await Admin.find().lean();
    const templates = await EmailTemplate.find().lean();

    res.render("Emailtemplatelist", { admin, templates });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading email template list");
  }
};

// ================================
// Get all templates JSON
// ================================
exports.EmailTemplateJson = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().lean();
    res.json({
      data: templates.map((t) => ({
        _id: t._id,
        type: t.type,
        subject: t.subject,
        from_name: t.from_name,
        from_email: t.from_email,
        htmlContent: t.htmlContent,
        variables: t.variables,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: [] });
  }
};

// ================================
//  // Update Email Template
// ================================
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const { subject, from_name, from_email, htmlContent } = req.body;

    // Extract new variables from updated HTML
    const regex = /\{\{(.*?)\}\}/g;
    const newVariables = [];
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      if (!newVariables.includes(match[1])) newVariables.push(match[1]);
    }

    // Fetch existing template to preserve old variables
    const existingTemplate = await EmailTemplate.findOne({ type });
    let variables = newVariables;
    if (existingTemplate && existingTemplate.variables) {
      // Merge old variables with new ones, avoid duplicates
      variables = Array.from(
        new Set([...existingTemplate.variables, ...newVariables]),
      );
    }

    const updated = await EmailTemplate.findOneAndUpdate(
      { type },
      {
        subject,
        from_name,
        from_email,
        htmlContent,
        variables,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    res.json({ success: true, message: "Template updated", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

const fetch = require("node-fetch");

// ================================
// Generate Description
// ================================
module.exports.generateDescription = async (req, res) => {
  try {
    const { name, prompt } = req.body;
    if (!name)
      return res.json({ success: false, message: "Product name is required." });

    const contact = await Setting.findOne();
    if (!contact?.companyName || !contact?.aboutcompany) {
      return res.status(200).json({
        success: false,
        message:
          "Company name or About Company not found. Please Add contact info.",
      });
    }

    const apikeysetting = await ApikeySetting.findOne({}).lean();

    if (!apikeysetting) {
      return res.json({
        success: false,
        message: "API key settings not configured.",
      });
    }

    const finalPrompt = `${name}

    Company Name:
    ${contact?.companyName}

    About Company:
    ${contact?.aboutcompany}

    User Instruction:
    ${prompt}

    Generate a detailed, clear and professional description.
        `.trim();

    let description = "";

    // =========================
    // Gemini
    // =========================
    if (apikeysetting.geminiApi?.enabled === true) {
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apikeysetting.geminiApi?.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
          }),
        },
      );

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("Gemini API Error:", errText);
        return res
          .status(apiRes.status)
          .json({
            success: false,
            message: "Gemini API request failed.",
            details: errText,
          });
      }

      const data = await apiRes.json();

      description =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "AI could not generate a description.";
    }

    // =========================
    // OPENAI (IF ENABLED)
    // =========================
    else if (apikeysetting.openAi?.enabled === true) {
      const openai = new OpenAI({
        apiKey: apikeysetting.openAi.apiKey,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: finalPrompt }],
      });

      description =
        response?.choices?.[0]?.message?.content?.trim() ||
        "AI could not generate a description.";
    }

    // =========================
    // NO AI ENABLED
    // =========================
    else {
      return res.json({
        success: false,
        message: "No AI provider enabled.",
      });
    }
    res.json({ success: true, description });
  } catch (err) {
    console.error(" AI Description Error:", err);
    res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

// ================================
// Generate  Seo Details
// ================================
module.exports.generateMetaAll = async (req, res) => {
  try {
    const { page } = req.body;
    if (!page)
      return res.json({ success: false, message: "Page type is required." });

    const contact = await Setting.findOne();

    if (!contact?.companyName || !contact?.aboutcompany) {
      return res.status(200).json({
        success: false,
        message:
          "Company name or About Company not found. Please Add contact info.",
      });
    }

    // ====== OPTIONAL AI-Generated META (Gemini API v1beta) ======

    const prompt = `You are an SEO expert.
        Generate SEO metadata for "${page}" page.
        Company Name:
    ${contact?.companyName}

    About Company:
    ${contact?.aboutcompany}

        Respond ONLY in valid JSON format like this:
        {
          "metaTitle": "string (max 60 chars)",
          "metaKeywords": "comma separated keywords (max 5 keywords)",
          "metaDescription": "150-160 characters description"
        }
        Do NOT add explanation or extra text.`;

    const apikeysetting = await ApikeySetting.findOne({}).lean();

    if (!apikeysetting) {
      return res.json({
        success: false,
        message: "API key settings not configured.",
      });
    }

    let aiResponseText = "";

    if (apikeysetting.geminiApi?.enabled === true) {
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apikeysetting.geminiApi?.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("Gemini API Error:", errText);
        return res
          .status(apiRes.status)
          .json({
            success: false,
            message: "Gemini API request failed.",
            details: errText,
          });
      }

      const data = await apiRes.json();

      aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (apikeysetting.openAi?.enabled === true) {
      const openai = new OpenAI({
        apiKey: apikeysetting.openAi.apiKey,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      aiResponseText = response?.choices?.[0]?.message?.content?.trim() || "";
    } else {
      return res.json({
        success: false,
        message: "No AI provider enabled",
      });
    }
    const cleanedResult = aiResponseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let meta;
    try {
      meta = JSON.parse(cleanedResult);
    } catch (e) {
      console.error("JSON Parse Error:", cleanedResult);
      return res.json({
        success: false,
        message: "AI returned invalid format",
      });
    }

    return res.json({
      success: true,
      metaTitle: meta.metaTitle || "",
      metaKeywords: meta.metaKeywords || "",
      metaDescription: meta.metaDescription || "",
    });
  } catch (err) {
    console.error("SEO Meta Generation Error:", err);
    res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

//============================portfolio========================================//

// Render page
exports.getPortfolio = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "portfolio" }).lean();
    res.render("Portfolio", { admin, section });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// JSON Data
exports.getPortfolioJson = async (req, res) => {
  try {
    const dataList = await Portfolio.find().sort({ createdAt: -1 });
    const data = dataList.map((row) => ({
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      image: row.image || "",
      createdAt: row.createdAt,
    }));
    res.json({ data });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};

exports.savePortfolio = async (req, res) => {
  try {
    const { id, title, description } = req.body;
    let image = req.file ? "/uploads/portfolio/" + req.file.filename : null;

    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Title and Description required." });
    }

    if (id) {
      const existing = await Portfolio.findById(id);
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Record not found." });
      }

      //  DELETE OLD IMAGE IF NEW IMAGE UPLOADED
      if (image && existing.image) {
        const oldImagePath = path.join(__dirname, "..", existing.image);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const updateData = { title, description };
      if (image) updateData.image = image;

      await Portfolio.findByIdAndUpdate(id, updateData, { new: true });

      return res.json({
        success: true,
        message: "Portfolio updated successfully.",
      });
    } else {
      if (!image) {
        return res
          .status(400)
          .json({ success: false, message: "Image required for new entries." });
      }

      const newItem = new Portfolio({ title, description, image });
      await newItem.save();

      return res.json({
        success: true,
        message: "Portfolio added successfully.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// ===============================
// DELETE PORTFOLIO (IMAGE ALSO DELETE)
// ===============================
exports.deletePortfolio = async (req, res) => {
  try {
    const deleted = await Portfolio.findById(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found!" });
    }

    // 🧹 DELETE IMAGE FROM FOLDER
    if (deleted.image) {
      const imagePath = path.join(__dirname, "..", deleted.image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Portfolio.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: "Deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed!" });
  }
};

// ===============================
// Get CTA Section
// ===============================

exports.getCtaSection = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "cta" }).lean();
    res.render("Ctasection", { admin, section });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//========================================== Export database ==========================================//

exports.getExportdatabase = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Exportdatabase", { admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const archiver = require("archiver");
const { MongoClient } = require("mongodb");


module.exports.exportDatabase = async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URl);

  try {
    await client.connect();
    const db = client.db();

    // ZIP headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=exportdatabase.zip",
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const collections = await db.listCollections().toArray();

    for (const col of collections) {
      const data = await db.collection(col.name).find({}).toArray();

      archive.append(JSON.stringify(data, null, 2), {
        name: `${col.name}.json`,
      });
    }

    await archive.finalize();
  } catch (err) {
    console.error("Export Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false });
    }
  } finally {
    await client.close();
  }
};

// ===============================
// Export Payments Excel
// ===============================

exports.exportPaymentsExcel = async (req, res) => {
  try {
    //  DB se SAARA DATA lao

    const isSuccessOnly = req.query.success === "true";

    const setting = await Setting.findOne({}).lean();
    const currencySymbol = setting?.currencySymbol || "";

    let filter = {};

    if (isSuccessOnly) {
      filter.status = "success";
    }

    const payments = await Payment.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    //  Workbook + Sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    //  Columns define karo
    worksheet.columns = [
      { header: "Method", key: "gateway", width: 15 },
      { header: "Transaction ID", key: "transactionId", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "User Name", key: "user", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    //  Rows add karo
    payments.forEach((p) => {
      worksheet.addRow({
        gateway: p.gateway || "-",
        transactionId: p.transactionId
          ? `${p.transactionId.slice(0, 6)}...${p.transactionId.slice(-4)}`
          : "-",
        date: p.createdAt ? new Date(p.createdAt).toLocaleString() : "-",
        user: p.userId ? `${p.userId.firstName} ${p.userId.lastName}` : "-",
        email: p.userId?.email || "-",
        amount: `${currencySymbol} ${p.totals.totalAmount || 0}`,
        status: p.status || "-",
      });
    });

    //  Header styling
    worksheet.getRow(1).font = { bold: true };

    //  Response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=payments.xlsx");

    //  Excel send karo
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel Export Error:", err);
    res.status(500).json({
      success: false,
      message: "Excel export failed",
    });
  }
};

//========================================== api key setting ==========================================//

//===============================
//api key setting
//==============================
exports.getapikeysetting = async (req, res) => {
  const admin = await Admin.find().lean();

  let setting = await ApikeySetting.findOne().lean();
  if (!setting) {
    setting = await ApikeySetting.create({});
  }

  res.render("Apikeysetting", { admin, setting });
};

exports.updateApikeySettings = async (req, res) => {
  try {
    const updateData = {};

    for (const key in req.body) {
      updateData[key] = {
        enabled: req.body[key].enabled === true,
        apiKey: req.body[key].apiKey || "",
      };
    }

    await ApikeySetting.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Lead settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err });
  }
};

//========================================== web histroy ==========================================//

exports.getWebhistory = async (req, res) => {
  try {
    const admin = await Admin.find().lean();

    // -----------------------------
    // TOTAL PREFERENCES COUNT
    // -----------------------------
    const totalPreferences = await Preference.countDocuments()

    // -----------------------------
    // TOP CATEGORY (most preferences)
    // -----------------------------
    const topCategoryAgg = await Preference.aggregate([
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "businesstypes", // collection name
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]);

    const topCategory = topCategoryAgg.length
      ? {
        name: topCategoryAgg[0].category?.type || "-",
        total: topCategoryAgg[0].count,
      }
      : {
        name: "-",
        total: 0,
      };

    // -----------------------------
    // RENDER
    // -----------------------------
    res.render("Webhistory", {
      admin,
      totalPreferences,
      topCategory,
    });
  } catch (err) {
    console.error("Webhistory Error:", err);
    res.render("Webhistory", {
      admin: [],
      totalPreferences: 0,
      topCategory: { name: "-", total: 0 },
    });
  }
};

// ================================
// Get web Json
// ================================
exports.getwebhistroyJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    let pipeline = [];

    // -------------------------
    // LOOKUPS
    // -------------------------
    pipeline.push(
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
    );

    // -------------------------
    // SEARCH
    // -------------------------
    if (search) {
      const regex = new RegExp(search, "i");

      pipeline.push({
        $match: {
          $or: [
            { name: regex },
            { industry: regex },
            { designStyle: regex },
            { "user.firstName": regex },
            { "user.lastName": regex },
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ["$user.firstName", " ", "$user.lastName"],
                  },
                  regex,
                },
              },
            },
            { "user.email": regex },
            { "category.type": regex },
          ],
        },
      });
    }

    // -------------------------
    // TOTAL COUNT
    // -------------------------
    const totalRecords = await Preference.countDocuments()

    // -------------------------
    // FILTERED COUNT
    // -------------------------
    const filteredData = await Preference.aggregate([
      ...pipeline,
      { $count: "count" },
    ]);
    const recordsFiltered = filteredData[0]?.count || 0;

    // -------------------------
    // PAGINATION
    // -------------------------
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },
    );

    const finalData = await Preference.aggregate(pipeline);

    // -------------------------
    // FORMAT FOR DATATABLE
    // -------------------------
    const BASE_URL = process.env.BASE_URL;
    const PREVIEW_PATH = process.env.PREVIEW_PATH;

    const formatted = finalData.map((d) => ({
      _id: d._id,
      websiteName: d.name || "-",
      industry: d.industry || "-",
      designStyle: d.designStyle || "-",
      user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "Deleted User",
      email: d.user?.email || "-",
      category: d.category?.type || "-",
      isPublished: d.status === "published" ? true : false,
      zipUrl: d.zipUrl || "-",
      previewUrl: BASE_URL + "/" + PREVIEW_PATH + "/" + d._id,
      createdAt: d.createdAt,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data: formatted,
    });
  } catch (err) {
    console.error("Webhistory JSON Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }
};

//========================================== Page Details ==========================================//

module.exports.getAddPages = async (req, res) => {
  try {
    const admin = await Admin.find();
    const pages = await Pagedetails.find();
    res.render("Pagedetails", { admin, pages });
  } catch (error) {
    console.error("Error fetching add pages:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add or update page content by ID

module.exports.addPage = async (req, res) => {
  try {
    const { pageId, content } = req.body;

    // Validate input
    if (!pageId || !content) {
      return res.status(200).json({
        success: false,
        message: "pageId and content are required",
      });
    }

    // Ensure pageId is between 1–7
    if (![1, 2, 3, 4, 5, 6, 7].includes(Number(pageId))) {
      return res.status(200).json({
        success: false,
        message: "Invalid pageId, must be between 1 and 7",
      });
    }

    // Update existing page or create if not exists
    const page = await Pagedetails.findOneAndUpdate(
      { pageId: Number(pageId) },
      { content },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Page saved successfully!",
      page,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

//========================================== contact page ==========================================//

exports.getContactpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "contact" }).lean();
    res.render("Contactsection", { admin, section });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
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
module.exports.loginasuser = async (req, res) => {
  try {
     const user = await User.findById(req.params.userId);
  if (user?.emailVerified === 0) {
      return res.status(200).json({
        success: false,
        message: "User Account not verified.",
      });
    }
    if (user && user?.status === 0) {
      return res.status(200).json({
        success: false,
        message: "user account has been banned.",
      });
    }
     const token = await tokenGenerate(user);

  // redirect URL bhejo
  const redirectUrl = process.env.FRONTEND_BASE_URL+`/impersonate-login?token=${token}`;
      return res.status(200).json({
        success: true,
        message: "login success",
        url:redirectUrl
      });

  } catch (error) {
    console.log(error);
  }
};


//========================================== LANGUAGE PAGE===========================================//

/* =========================
   LANGUAGE PAGE
========================= */
module.exports.getLanguage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Language", { admin });
  } catch (err) {
    console.log(err);
  }
};

/* =========================
   LANGUAGE JSON
========================= */
module.exports.getLanguageJson = async (req, res) => {
  try {
    const dataList = await Language.find().sort({ createdAt: -1 });
    const data = dataList.map((h) => ({
      _id: h._id,
      name: h.name,
      code: h.code,
      native: h.native,
      flag: h.flag,
      status: h.status,
    }));
    res.json({ data });
  } catch (err) {
    res.json({ data: [] });
  }
};

/* =========================
   SAVE / UPDATE
========================= */
module.exports.saveLanguage = async (req, res) => {
  try {
    let { id, name, code, flag, native, status } = req.body;

    console.log(req.body);

    // =========================
    // TRIM VALUES
    // =========================
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();
    const trimmedNative = native?.trim();
    const trimmedFlag = flag?.trim();

    // =========================
    // REQUIRED VALIDATION
    // =========================
    if (
      !trimmedName ||
      !trimmedCode ||
      !trimmedNative ||
      !trimmedFlag
    ) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const statusValue = status === "true" || status === true;

    // =========================
    // CHECK DUPLICATE NAME
    // =========================
    const existingLanguage = await Language.findOne({
      name: {
        $regex: new RegExp(`^${trimmedName}$`, "i"),
      },
    });

    if (
      existingLanguage &&
      (!id || existingLanguage._id.toString() !== id)
    ) {
      return res.json({
        success: false,
        message: "Language already exists",
      });
    }

    // =========================
    // CHECK DUPLICATE CODE
    // =========================
    const existingCode = await Language.findOne({
      code: {
        $regex: new RegExp(`^${trimmedCode}$`, "i"),
      },
    });

    if (
      existingCode &&
      (!id || existingCode._id.toString() !== id)
    ) {
      return res.json({
        success: false,
        message: "Language code already exists",
      });
    }

    // =========================
    // UPDATE
    // =========================
    if (id) {
      const language = await Language.findByIdAndUpdate(
        id,
        {
          name: trimmedName,
          code: trimmedCode,
          native: trimmedNative,
          flag: trimmedFlag,
          status: statusValue,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!language) {
        return res.json({
          success: false,
          message: "Language not found",
        });
      }

      return res.json({
        success: true,
        message: "Language updated successfully",
      });
    }

    // =========================
    // CREATE
    // =========================
    await Language.create({
      name: trimmedName,
      code: trimmedCode,
      native: trimmedNative,
      flag: trimmedFlag,
      status: statusValue,
    });

    return res.json({
      success: true,
      message: "Language added successfully",
    });
  } catch (err) {
    console.error("saveLanguage Error:", err);

    return res.json({
      success: false,
      message: err.message || "Save failed",
    });
  }
};

// =========================
// DELETE LANGUAGES
// =========================
exports.deleteLanguage = async (req, res) => {
  try {
    const languages = await Language.findByIdAndDelete(req.params.id);
    if (!languages) {
      return res.json({ success: false, message: "Languages not found" });
    }
    res.json({ success: true, message: "Languages deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== TRANSLATION MANAGRE PAGE===========================================//

/* =========================
   TRANSLATION MANAGER PAGE
========================= */

module.exports.getTranslationManager = async (req, res) => {
  try {
    const admin = await Admin.find();

    res.render("TranslationManager", {
      admin,
    });
  } catch (error) {
    console.log(error);
  }
};

// ================================
// Get Language JSON
// ================================
module.exports.getlanguageselect = async (req, res) => {
  try {
    const languages = await Language.find({ status: true }).sort({ name: 1 , code : 1 });
    res.json({ success: true, data: languages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================================
// Get Translation Managers JSON
// ================================
module.exports.getTranslationMangerJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // -----------------------------
    // SEARCH QUERY
    // -----------------------------
    let query = {};

    if (search) {
      const searchLower = search.toLowerCase();

      let statusQuery = [];

      if (
        searchLower.includes("enable") ||
        searchLower.includes("enabled")
      ) {
        statusQuery.push({ status: true });
      }

      if (
        searchLower.includes("disable") ||
        searchLower.includes("disabled")
      ) {
        statusQuery.push({ status: false });
      }

      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          ...statusQuery,
        ],
      };
    }

    // -----------------------------
    // COUNTS
    // -----------------------------
    const total = await TranslationManager.countDocuments();

    const filtered = await TranslationManager.countDocuments(query);

    // -----------------------------
    // DATA
    // -----------------------------
    const translationManagers = await TranslationManager.find(query)
      .skip(start)
      .limit(length)
      .sort({
        createdAt: -1,
        _id: -1,
      });

    // -----------------------------
    // LANGUAGE LIST
    // -----------------------------
    const languages = await Language.find();

    const data = translationManagers.map((item) => {
      const matchedLanguage = languages.find(
        (lang) => lang.code === item.code,
      );

      return {
        _id: item._id,
        name: item.name,
        code: item.code,
        languageName: matchedLanguage?.name || "",
        status: item.status,
        createdAt: item.createdAt,
      };
    });

    return res.json({
      success : true,
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data,
    });
  } catch (err) {
    console.error("ERROR FETCH TRANSLATION MANAGERS:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// ADD || UPDATE TRANSLATION MANAGERS
// =========================
exports.saveTranslationManagers = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.body._id;

    const { code, status } = req.body;

    const statusValue = status === "true" || status === true;

    // =========================
    // CHECK DUPLICATE CODE
    // =========================
    const existingKey = await TranslationManager.findOne({
      code,
      ...(id && { _id: { $ne: id } }),
    });

    if (existingKey) {
      return res.json({
        success: false,
        message: "Translation Manager code already exists",
      });
    }

    // =========================
    // UPDATE
    // =========================
    if (id) {
      const updatedTranslationManager =
        await TranslationManager.findByIdAndUpdate(
          id,
          {
            code,
            status: statusValue,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedTranslationManager) {
        return res.json({
          success: false,
          message: "Translation Manager not found",
        });
      }

      return res.json({
        success: true,
        message: "Translation Manager updated successfully",
        data: updatedTranslationManager,
      });
    }

    // =========================
    // CREATE
    // =========================
    const newTranslationManager = await TranslationManager.create({
      code,
      status: statusValue,
    });

    return res.json({
      success: true,
      message: "Translation Manager added successfully",
      data: newTranslationManager,
    });
  } catch (err) {
    console.error("SAVE TRANSLATION MANAGER ERROR:", err);

    return res.json({
      success: false,
      message: err.message || "Failed to save Translation Manager",
    });
  }
};

// =========================
// DELETE TRANSLATION MANAGERS
// =========================
exports.deleteTranslationManagers = async (req, res) => {
  try {
    const TranslationManagers = await TranslationManager.findByIdAndDelete(
      req.params.id,
    );
    if (!TranslationManagers) {
      return res.json({
        success: false,
        message: "Translation Manager not found",
      });
    }
    res.json({
      success: true,
      message: "Translation Manager deleted successfully",
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// =========================
// TOGGLE TRANSLATION MANAGERS
// =========================
exports.toggleTranslationManager = async (req, res) => {
  try {
    const { id } = req.params;

    const translationManagers = await TranslationManager.findById(id);

    if (!translationManagers) {
      return res.json({
        success: false,
        message: "Translation Manager not found",
      });
    }

    translationManagers.status =
      translationManagers.status === true ? false : true;
    translationManagers.save();

    return res.json({
      success: true,
      message: `Translation Manager ${translationManagers.status === true ? "Enabled" : "Disabled"} successfully`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Flaied to Toggle Transtion Manager",
    });
  }
};

// ========================== Translation Keys ===============================//

// ==============================
// Get Translation Keys Page
// ==============================
exports.renderTranslationKeyPage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.redirect("/TranslationManager");
    }

    const admin = await Admin.find();

    // -----------------------------------
    // FIND TRANSLATION MANAGER
    // -----------------------------------
    const translationManager = await TranslationManager.findById(id);

    if (!translationManager) {
      return res.redirect("/TranslationManager");
    }

    // -----------------------------------
    // FIND LANGUAGE
    // -----------------------------------
    const matchedLanguage = await Language.findOne({
      code: translationManager.code,
    });

    // -----------------------------------
    // GET ALL KEYS
    // -----------------------------------
    const allKeys = await TranslationKeys.find().sort({
      createdAt: -1,
    });

    // -----------------------------------
    // FORMAT TRANSLATIONS
    // -----------------------------------
    const translations = allKeys.map((item) => {
      const existingTranslation = translationManager.translations.find(
        (translation) => translation.key === item.key,
      );

      return {
        key: item.key,
        value: existingTranslation?.value || "",
      };
    });

    // -----------------------------------
    // RENDER PAGE
    // -----------------------------------
    return res.render("AddTranslationKeys", {
      admin,
      translationManager: {
        _id: translationManager._id,
        code: translationManager.code,
        languageName: matchedLanguage?.name || "",
        status: translationManager.status,
        translations,
      },
    });
  } catch (err) {
    console.error("ERROR RENDERING TRANSLATION PAGE:", err);
    return res.redirect("/TranslationManager");
  }
};
// ======================================================
// Get TRANSLATION KEY
// ======================================================

exports.getTranslationManagerKeys = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: "Invalid translation manager ID" });
    }

    const translationManager = await TranslationManager.findById(id);

    if (!translationManager) {
      return res.status(404).json({ success: false, message: "Translation manager not found" });
    }

    const allKeys = await TranslationKeys.find().sort({ createdAt: -1 });

    const translations = allKeys.map((item) => {
      const existingTranslation = translationManager.translations.find(
        (translation) => translation.key === item.key,
      );

      return {
        _id: item._id,
        key: item.key,
        value: existingTranslation?.value || "",
      };
    });

    return res.json({ success: true, data: { translations } });
  } catch (err) {
    console.error("ERROR FETCHING TRANSLATION MANAGER KEYS:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ======================================================
// SAVE TRANSLATION KEY
// ======================================================

exports.translationNewKeyAdd = async (req, res) => {
  try {
    const { languageId, key, value } = req.body;

    // -----------------------------------
    // VALIDATIONS
    // -----------------------------------

    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: "Language id is required",
      });
    }

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Key is required",
      });
    }

    const normalizedKey = key.trim();

    // -----------------------------------
    // FIND LANGUAGE
    // -----------------------------------

    const selectedLanguage =
      await TranslationManager.findById(languageId);

    if (!selectedLanguage) {
      return res.status(404).json({
        success: false,
        message: "Language not found",
      });
    }

    // -----------------------------------
    // CHECK GLOBAL KEY
    // -----------------------------------

    const existingKey = await TranslationKeys.findOne({
      key: normalizedKey,
    });

    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: `Translation key '${normalizedKey}' already exists`,
      });
    }

    // -----------------------------------
    // CREATE GLOBAL KEY
    // -----------------------------------

    await TranslationKeys.create({
      key: normalizedKey,
    });

    // -----------------------------------
    // ADD TO LANGUAGE
    // -----------------------------------

    selectedLanguage.translations.push({
      key: normalizedKey,
      value: value?.trim() || "",
    });

    await selectedLanguage.save();

    return res.status(200).json({
      success: true,
      message: "Translation key added successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ======================================================
// Save Translation Managers Keys
// ======================================================

exports.saveTranslationManagersKeys = async (req, res) => {
  try {
    const { id, translation } = req.body;

    // ---------------------------------
    // VALIDATIONS
    // ---------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Translation manager id is required",
      });
    }

    if (!Array.isArray(translation)) {
      return res.status(400).json({
        success: false,
        message: "Translation must be an array",
      });
    }

    // ---------------------------------
    // FIND TRANSLATION MANAGER
    // ---------------------------------

    const translationManager = await TranslationManager.findById(id);

    if (!translationManager) {
      return res.status(404).json({
        success: false,
        message: "Translation manager not found",
      });
    }

    // ---------------------------------
    // PREPARE TRANSLATIONS
    // ---------------------------------

    const updatedTranslations = translation.map((item) => ({
      key: item.key.trim(),
      value: item.value?.trim() || "",
    }));

    // ---------------------------------
    // UPDATE TRANSLATIONS
    // ---------------------------------

    translationManager.translations = updatedTranslations;

    await translationManager.save();

    // ---------------------------------
    // RESPONSE
    // ---------------------------------

    return res.status(200).json({
      success: true,
      message: "Translation keys updated successfully",
      data: translationManager.translations,
    });
  } catch (error) {
    console.error("SAVE TRANSLATION KEYS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// =========================
// DELETE TRANSLATION KEY FOR THE ALL LANGUAGES
// =========================

exports.deleteTranslationKeys = async (req, res) => {
  try {
    const keys = ["test", "Admin"];

    // Delete from TranslationKeys collection
    const deletedKeys = await TranslationKeys.deleteMany({
      key: { $in: keys },
    });

    // Remove translations from all languages
    const updatedTranslations = await TranslationManager.updateMany(
      {},
      {
        $pull: {
          translations: {
            key: { $in: keys },
          },
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Translation keys deleted successfully",
      deletedKeysCount: deletedKeys.deletedCount,
      modifiedLanguages: updatedTranslations.modifiedCount,
    });
  } catch (error) {
    console.error("Delete Translation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete translation keys",
      error: error.message,
    });
  }
};

//==========================================Auth api key setting ==========================================//

// ========================
// Get Auth Setting page
// ========================

exports.getAuthkeysetting = async (req, res) => {
  const admin = await Admin.find().lean();

  let setting = await AuthkeySetting.findOne().lean();
  if (!setting) {
    setting = await AuthkeySetting.create({});
  }

  res.render("Authkeysetting", { admin, setting });
};

// ========================
// UPDATE AUTH API KEY SETTING
// ========================
exports.updateAuthApikeySettings = async (req, res) => {
  try {
    const updateData = {};

    for (const key in req.body) {
      updateData[key] = {
        enabled: req.body[key].enabled === true,
        apiKey: req.body[key].apiKey,
        apiSecretKey: req.body[key].apiSecretKey,
        apiRedirectUrl: req.body[key].apiRedirectUrl,
      };
    }

    await AuthkeySetting.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Auth settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err });
  }
};
