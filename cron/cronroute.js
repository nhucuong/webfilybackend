const express = require("express");
const router = express.Router();
const croncontrolle = require("./croncontroller");

router.get('/checkcron',croncontrolle.checkcron)
module.exports = router  