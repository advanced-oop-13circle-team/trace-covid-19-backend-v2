const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { connDB } = require("@utils/connDB");

const LICENSE = path.join(process.cwd(), "/LICENSE");

/**
 *  [ Get License ]
 *
 *  Method: GET
 *  Request Params: N/A
 *  Response Type: string
 *  Response Body: { err, is_license, license, msg }
 *
 */
router.get("/license", (req, res, next) => {
  fs.readFile(LICENSE, (err, license) => {
    if (err) {
      return res.send(
        JSON.stringify({
          err,
          is_license: false,
          license: null,
          msg: "Cannot read license file",
        })
      );
    }
    res.send(
      JSON.stringify({
        err: null,
        is_license: true,
        license: license.toString(),
        msg: "LICENSE sent successfully",
      })
    );
  });
});

module.exports = router;
