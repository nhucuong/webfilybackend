const UserSubscription = require("../models/UserSubscription");
const PricingPlan = require("../models/SubscriptionPlan");
const UserActivity = require("../models/UserActivity");
const Notification = require("../models/Notification");

const assignFreePlanOnce = async (user) => {
  try {
    const userId = user._id || user.id
    const email = user.email 
    const freePlan = await PricingPlan.findOne({
      monthlyPrice: 0,
      yearlyPrice: 0,
      status: true,
      isFree: true,
    });

    if (!freePlan) {
      console.warn("Free plan not found");
      return {
        success: false,
        message: "Free plan not found",
      };
    }

    // Already has active subscription?
    const existingSub = await UserSubscription.findOne({
      userId,
      status: "active",
    });

    if (existingSub) {
      return {
        success: false,
        message: "Active subscription already exists",
      };
    }

    const subscription = await UserSubscription.create({
      userId,
      planId: freePlan._id,
      billingType: "monthly",
      totalWebsite: freePlan.monthlyWebsiteLimit || 0,
      websiteCreated: 0,
      totalPageLimite: freePlan.maxPages || 0,
      totalSectionLimite: freePlan.maxSectionsPerPage || 0,
      features: freePlan.features || {},
      startDate: new Date(),
      expiryReminderSent : false,
      endDate: null,
      status: "active",
      isFree: true,
    });

    await UserActivity.create({
      userId,
      action: `${freePlan.name} plan activated. Enjoy your new limits!`,
      target: freePlan._id.toString(),
      atypes: "plan_active",
    });

    return {
      success: true,
      subscription,
      plan: freePlan,
    };
  } catch (err) {
    console.error("Assign Free Plan Error:", err);

    try {
      if (Notification && email) {
        await Notification.create({
          subject: "Free Plan Assignment Failed",
          message: `Failed to assign free plan to ${email}. Error: ${err.message}`,
        });
      }
    } catch (notifyErr) {
      console.error("Notification Error:", notifyErr);
    }

    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = {
  assignFreePlanOnce,
};