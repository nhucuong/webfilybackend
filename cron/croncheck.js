const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");

cron.schedule("0 0 * * *", async () => {
  try {
   const cronrespnse = await axios.get(`${process.env.BASE_URL}/cron/checkcron`);
    console.log("checkcron called ",cronrespnse.data);
  } catch (err) {
    console.error("checkcron failed", err.message);
  }
});
