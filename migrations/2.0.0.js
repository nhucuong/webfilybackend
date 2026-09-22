require("dotenv").config();
const mongoose = require("mongoose");
require("../config/db");
const AdminTable = require("../models/AdminTable");
const UserSubscription = require("../models/UserSubscription");
const Preferance = require("../models/Preferance");
const Setting = require("../models/Setting");
const PaymentGateway = require("../models/PaymentGateway");
const EmailTemplate = require("../models/EmailTemplate");
const Blog = require("../models/Blog");
const fs = require("fs");
const path = require("path");

// ================= MODELS =================
const MODELS = [
  require("../models/AuthkeySetting"),
  require("../models/Languages"),
  require("../models/PageLibrary"),
  require("../models/SectionsLibrary"),
  require("../models/TranslationKeys"),
  require("../models/TranslationManager")
];

// ================= FILES =================
const FILES = [
  "../database/authkeysettings.json",
  "../database/languages.json",
  "../database/pagelibraries.json",
  "../database/sectionslibraries.json",
  "../database/translationkeys.json",
  "../database/translationmanagers.json"
];

// ================= CLEAN MONGO EXPORT =================
function cleanValue(value) {
  if (value && typeof value === "object") {
    if (value.$oid) return value.$oid;
    if (value.$date) return value.$date;
  }
  return value;
}

// ================= IMPORT IF EMPTY =================
async function importCollection() {
  try {
    for (let i = 0; i < MODELS.length; i++) {
      const Model = MODELS[i];
      const filePath = path.join(__dirname, FILES[i]);

      console.log(` Importing ${FILES[i]} → ${Model.collection.name}`);
      const count = await Model.countDocuments();

      if (count > 0 && (Model.collection.name !== "pagelibraries") && (Model.collection.name !== "sectionslibraries")) {
        console.log(`⏩ ${Model.collection.name} already exists. Skipped.`);
      }else{
 //  Read JSON
      let jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      //  Clean $oid / $date
      jsonData = jsonData.map(item => {
        const newItem = {};
        for (let key in item) {
          newItem[key] = cleanValue(item[key]);
        }
        return newItem;
      });

      //  Convert ObjectId & Dates (SAFE)
      const preparedData = jsonData.map(item => {
        const newItem = { ...item };

        Object.keys(newItem).forEach(key => {

          // _id + foreign keys
          if (
            (key === "_id" || key.toLowerCase().endsWith("id")) &&
            typeof newItem[key] === "string" &&
            mongoose.Types.ObjectId.isValid(newItem[key])
          ) {
            newItem[key] = new mongoose.Types.ObjectId(newItem[key]);
          }

          // Dates
          if (
            key.toLowerCase().includes("date") ||
            key === "createdAt" ||
            key === "updatedAt"
          ) {
            if (newItem[key]) {
              newItem[key] = new Date(newItem[key]);
            }
          }
        });

        return newItem;
      });

     //CLEAR COLLECTION (REAL RESTORE)
      await Model.deleteMany({});

      // INSERT (REAL IMPORT)
      const result = await Model.insertMany(preparedData, {
        ordered: false,
        runValidators: false,
      });

      console.log(`${Model.collection.name} Imported ${result.length} records`);
      }

     
    }

    console.log(" COLLECTIONS IMPORTED SUCCESSFULLY!");


  } catch (err) {
    console.error(" IMPORT FAILED:", err);
  }
}

async function runMigrations() {
  try {

    const setting = await Setting.findOne({});
    if (setting?.dbVersion === "2.0.0") {
      console.log("Version 2.0.0 Already Updated");
      process.exit();
    }

    // ==========================================
    // 1. Update Admin Collection
    // ==========================================
    const adminResult = await AdminTable.updateMany(
      {},
      {
        $set: {
          loginAttempts: 0,
          lockUntil: null,
        },
      },
    );
  console.log(` Update Admin Collection`);
    // ==========================================
    // 2. Update UserSubscription Collection
    // ==========================================
    const subscriptionResult = await UserSubscription.updateMany(
      {},
      {
        $set: {
          expiryReminderSent: false,
        },
      },
    );
  console.log(`Update UserSubscription Collection`);

    // ==========================================
    // 3. Update Preference Collection
    // ==========================================
    const preferenceResult = await Preferance.updateMany(
      {},
      {
        $set: {
          isActive: true,
        },
      },
    );
  console.log(`Update Preference Collection`);

    // ==========================================
    // 4. Update Setting Collection (Theme Colors)
    // ==========================================
    const settingResult = await Setting.updateMany(
      {},
      {
        $set: {
          "theme.primaryColor": "#0043ff",
          "theme.secondaryColor": "#78e911",
          "defaultLanguages": "en",
        },
      },
    );
  console.log(`Update Setting Collection`);

    // ==========================================
    // 5. Add/Update Razorpay Payment Gateway
    // ==========================================
    const paymentGatewayResult = await PaymentGateway.findOneAndUpdate(
      { name: "razorpay" }, // Find by unique name
      {
        $set: {
          clientId: "########",
          secretKey: "########",
          publicKey: "########",
          privateKey: "########",
          webhookUrl: "########",
          fixedCharge: 1,
          iconName: "indian-rupee",
          enabled: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  console.log(`Add Razorpay Payment Gateway`);

    // ==========================================
    // 6. Add/Update Plan Expiry Email Template
    // ==========================================
    const emailTemplateResult = await EmailTemplate.findOneAndUpdate(
      { type: "plan_expiry" },
      {
        $set: {
          subject: "Your Weblify Subscription Will Expire Soon",

          htmlContent: `
<div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">

 <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
 <tr>
  <td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 5px 15px rgba(0,0,0,0.08);">

   <!-- Header -->
   <tr>
   <td style="background:#0d6efd;padding:24px;text-align:center;">
    {{site_logo}}
    <p style="margin:6px 0 0;color:#e9f1ff;font-size:14px;">
      Your Subscription Plan is Expiring Soon
    </p>
   </td>
   </tr>

   <!-- Body -->
   <tr>
   <td style="padding:30px;color:#333333;">
    <h2 style="margin-top:0;font-size:20px;">
      Hello {{firstName}},
    </h2>

    <p style="font-size:14px;line-height:1.6;">
      This is a friendly reminder that your <strong>{{plan_name}}</strong> subscription on <strong>{{site_name}}</strong> will expire in <strong>5 days</strong>.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <div style="
        display:inline-block;
        padding:20px 30px;
        font-size:16px;
        font-weight:bold;
        color:#0d6efd;
        border:2px dashed #0d6efd;
        border-radius:8px;
        background:#f8faff;">
        Plan - {{plan_name}} <br><br>
        Expiry Date - {{expiry_date}}
      </div>
    </div>

    <p style="font-size:14px;line-height:1.6;">
      To continue enjoying uninterrupted access to all premium features, please renew your subscription before the expiry date.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="{{renew_plan_url}}" style="
        background:#0d6efd;
        color:#ffffff;
        text-decoration:none;
        padding:12px 28px;
        border-radius:6px;
        font-size:14px;
        font-weight:bold;
        display:inline-block;">
        Renew Subscription
      </a>
    </div>

    <p style="margin-top:24px;font-size:13px;color:#777;">
      If you have already renewed your subscription, please ignore this email.
    </p>

    <p style="margin-top:30px;font-size:14px;">
      Best Regards,<br>
      <strong>{{site_name}} Support Team</strong>
    </p>
   </td>
   </tr>

   <!-- Footer -->
   <tr>
   <td style="background:#f1f3f5;padding:15px;text-align:center;font-size:12px;color:#888;">
    © {{site_name}} — All rights reserved
   </td>
   </tr>

  </table>
  </td>
 </tr>
 </table>

</div>
      `,

          variables: [
            "firstName",
            "site_name",
            "site_logo",
            "plan_name",
            "expiry_date",
            "renew_plan_url",
          ],

          from_name: "Support Team",
          from_email: "example@gmail.com",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  console.log(`Add Plan Expiry Email Template`);

    // ==========================================
    // 7. Trim Leading Spaces from Blog Titles
    // ==========================================

    const blogUpdates = [
      {
        oldTitle: " How AI Helps Startups Launch Faster",
        newTitle: "How AI Helps Startups Launch Faster",
      },
      {
        oldTitle: " How AI Is Changing Website Development",
        newTitle: "How AI Is Changing Website Development",
      },
      {
        oldTitle: " Why Responsive Design Is More Important Than Ever",
        newTitle: "Why Responsive Design Is More Important Than Ever",
      },
    ];

    for (const blog of blogUpdates) {
      const result = await Blog.updateOne(
        { title: blog.oldTitle },
        {
          $set: {
            title: blog.newTitle,
          },
        },
      );

      console.log(
        `Updated "${blog.oldTitle}" -> "${blog.newTitle}" | Modified: ${result.modifiedCount}`,
      );
    }


     // ==========================================
    // Update Setting Version
    // ==========================================

    await Setting.updateOne(
      {},
      {
        $set: {
          dbVersion: "2.0.0"
        }
      }
    );
  console.log(`Update Setting Version`);

     // ==========================================
    // Import New collection
    // ==========================================

    await importCollection();

    console.log("🎉 All migrations completed successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Failed:", error);

    await mongoose.disconnect().catch(() => { });
    process.exit(1);
  }
}

runMigrations();
