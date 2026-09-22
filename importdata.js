const mongoose = require("mongoose");
require("./config/db");
const fs = require("fs");
const path = require("path");

// ================= MODELS =================
const MODELS = [
  require("./models/AdminPasswordResetToken"),
  require("./models/AdminTable"),
  require("./models/ApikeySetting"),
  require("./models/AuthkeySetting"),
  require("./models/Blog"),
  require("./models/BusinessType"),
  require("./models/Countrie"),
  require("./models/EmailTemplate"),
  require("./models/Faq"),
  require("./models/Features"),
  require("./models/HeroStat"),
  require("./models/HowItWork"),
  require("./models/Inquiry"),
  require("./models/Languages"),
  require("./models/LoginHistory"),
  require("./models/NewsLetter"),
  require("./models/Notification"),
  require("./models/PageDetails"),
  require("./models/PageLibrary"),
  require("./models/PageSection"),
  require("./models/Payment"),
  require("./models/PaymentGateway"),
  require("./models/Portfolio"),
  require("./models/Preferance"),
  require("./models/SectionsLibrary"),
  require("./models/Seo"),
  require("./models/Setting"),
  require("./models/States"),
  require("./models/SubscriptionPlan"),
  require("./models/Tag"),
  require("./models/Testimonial"),
  require("./models/Ticket"),
  require("./models/TranslationKeys"),
  require("./models/TranslationManager"),
  require("./models/User"),
  require('./models/UserActivity'),
  require("./models/UserResetPasswordToken"),
  require("./models/UserSubscription"),
];

// ================= FILES =================
const FILES = [
  "./database/adminpasswordresettokens.json",
  "./database/admins.json",
  "./database/apikeysettings.json",
  "./database/authkeysettings.json",
  "./database/blogs.json",
  "./database/businesstypes.json",
  "./database/countries.json",
  "./database/emailtemplates.json",
  "./database/faqs.json",
  "./database/features.json",
  "./database/herostats.json",
  "./database/howitworks.json",
  "./database/inquiries.json",
  "./database/languages.json",
  "./database/loginhistories.json",
  "./database/newsletters.json",
  "./database/notifications.json",
  "./database/pagedetails.json",
  "./database/pagelibraries.json",
  "./database/pagesections.json",
  "./database/payments.json",
  "./database/paymentgateways.json",
  "./database/portfolios.json",
  "./database/preferences.json",
  "./database/sectionslibraries.json",
  "./database/seos.json",
  "./database/settings.json",
  "./database/states.json",
  "./database/subscriptionplans.json",
  "./database/tags.json",
  "./database/testimonials.json",
  "./database/supporttickets.json",
  "./database/translationkeys.json",
  "./database/translationmanagers.json",
  "./database/users.json",
  "./database/useractivities.json",
  "./database/userresetpasswordtokens.json",
  "./database/usersubscriptions.json",

];

// ================= CLEAN MONGO EXPORT =================
function cleanValue(value) {
  if (value && typeof value === "object") {
    if (value.$oid) return value.$oid;
    if (value.$date) return value.$date;
  }
  return value;
}

// ================= IMPORT FUNCTION =================
async function insertAll() {
  try {
    for (let i = 0; i < MODELS.length; i++) {
      const Model = MODELS[i];
      const filePath = path.join(__dirname, FILES[i]);

      console.log(` Importing ${FILES[i]} → ${Model.collection.name}`);

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

      console.log(`Imported ${result.length} records`);
    }

    console.log(" ALL COLLECTIONS IMPORTED SUCCESSFULLY!");
    process.exit(0);

  } catch (err) {
    console.error(" IMPORT FAILED:", err);
    process.exit(1);
  }
}

insertAll();

