const express = require("express");
const appname = require("../package.json").name;
const router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("index", { title: appname });
});

module.exports = router;
