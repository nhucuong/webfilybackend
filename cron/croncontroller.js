const UserSubscription = require('../models/UserSubscription');
const PricingPlan = require("../models/SubscriptionPlan");
const UserActivity = require("../models/UserActivity");
const { assignFreePlanOnce } = require('../helpers/subscriptionHelper');
const Setting = require('../models/Setting');
const sendTemplateEmail = require('../helpers/SendResetLink');
const User = require('../models/User');

module.exports.checkcron = async (req, res) => {
    try {
        const today = new Date();

        // ==========================================================
        // SEND 5 DAYS BEFORE EXPIRY EMAIL
        // ==========================================================

    // Set today's time to 00:00:00 for accurate date comparison
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const fiveDaysLater = new Date(startOfToday);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
        
        const expiringPlans = await UserSubscription
        .find({
            status: "active",
            isFree: false,
            expiryReminderSent: false,
            endDate: {
                $gte: startOfToday,
                $lte: fiveDaysLater
            }
            })
            .populate("userId")
            .populate("planId")
            .sort({createdAt : -1});
            
        const setting = await Setting.findOne({});

        for (const subscription of expiringPlans) {
            
        
            if (!subscription.userId) continue;

            const emailVars = {
                firstName: subscription.userId.firstName,
                site_name: setting?.companyName,
                site_logo: setting?.logo
                    ? process.env.BASE_URL + setting.logo
                    : "",
                plan_name: subscription.planId?.name,
                expiry_date: subscription.endDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }),
                renew_plan_url: `${process.env.FRONTEND_BASE_URL}/pricing`
            };
            
            await sendTemplateEmail(
                "plan_expiry",
                subscription.userId.email,
                emailVars
            );

            subscription.expiryReminderSent = true;
            await subscription.save();

        }


        // 1. Find users whose plan will expire
        const expiredSubs = await UserSubscription.find({
            status: "active",
            endDate: { $ne: null, $lt: today }
        });

        // 2. Expire them
       const usersub =  await UserSubscription.updateMany(
            {
                _id: { $in: expiredSubs.map(sub => sub._id) }
            },
            {
                $set: { status: "expired" }
            }
        );
        

        const freePlan = await PricingPlan.findOne({
            monthlyPrice: 0,
            yearlyPrice: 0,
            status: true,
            isFree: true,
        });

        console.log("Free Plan Found:", freePlan?._id);

        const userId = sub.userId
        const user = await User.findById(userId);

        if (freePlan) {

            // 3. Assign FREE plan to those users
            for (const sub of expiredSubs) {
    await assignFreePlanOnce(user);
}

        }

        // 2. Reset FREE plan usage (monthly)
        const freePlans = await UserSubscription.find({
            status: "active",
            isFree: true
        });

        for (const sub of freePlans) {
            const lastReset = new Date(sub.lastResetDate);

            const isNewMonth =
                lastReset.getMonth() !== today.getMonth() ||
                lastReset.getFullYear() !== today.getFullYear();

            if (isNewMonth) {
                sub.websiteCreated = 0; // 🔥 reset usage
                sub.lastResetDate = today;
                await sub.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Cron executed"
        });

    } catch (error) {
        console.error("Cron Error:", error);
        res.status(500).json({
            success: false,
            message: "Cron failed"
        });
    }
}

