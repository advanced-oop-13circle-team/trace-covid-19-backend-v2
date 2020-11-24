const express = require("express");
const fs = require("fs");
const iconv = require("iconv-lite");
const csvtojson = require("csvtojson");
const { convertArrayToCSV } = require("convert-array-to-csv");
const { connDB } = require("@utils/connDB");
const { csvFiles, enumCovid19, enumCovid19Output } = require("@utils/covid19csvConfig");

const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("uploadcsv");
});

/**
 *  [ Count data for each district ]
 *
 *  Method: GET
 *  Request Params: N/A
 *  Response Type: string
 *  Response Body: { err, is_cnt, cnts, msg }
 *
 */
router.get("/count-district-data", (req, res, next) => {
  const sql =
    "SELECT district, count(district) as count FROM Covid19 GROUP BY district";
  connDB.query(sql, (err, rows, fields) => {
    if (err) {
      return res.send(
        JSON.stringify({
          err,
          is_cnt: false,
          cnts: null,
          msg: "Cannot read data from the database",
        })
      );
    }
    if (rows.length > 0) {
      res.send(
        JSON.stringify({
          err: null,
          is_cnt: true,
          cnts: rows,
          msg: "Data counted successfully",
        })
      );
    } else {
      res.send(
        JSON.stringify({
          err: null,
          is_cnt: false,
          cnts: null,
          msg: "No data to count",
        })
      );
    }
  });
});

/**
 *  [ Get data for a district ]
 *
 *  Method: GET
 *  Request Params: { district }
 *  Response Type: string
 *  Response Body: { err, is_data, data, cnt_data, msg }
 *
 */
router.get("/district-data/:district", (req, res, next) => {
  const district = req.params.district;
  if (!district) {
    return res.send(
      JSON.stringify({
        err: null,
        is_data: false,
        data: null,
        cnt_data: 0,
        msg: "District not specified",
      })
    );
  }
  const sql = "SELECT * FROM Covid19 WHERE district = ?";
  connDB.query(sql, [district], (err, rows, fields) => {
    if (err) {
      return res.send(
        JSON.stringify({
          err,
          is_data: false,
          data: null,
          cnt_data: 0,
          msg: "Cannot search data in the database",
        })
      );
    }
    if (rows.length > 0) {
      const convRows = [];
      while (rows.length > 0) {
        let row = rows.pop();
        let obj = {};
        enumCovid19.forEach((kObj) => {
          obj[kObj[0]] = row[kObj[1]];
        });
        convRows.push(obj);
      }
      res.send(
        JSON.stringify({
          err: null,
          is_data: true,
          data: convRows,
          cnt_data: convRows.length,
          msg: `Data from district ${district} is fetched successfully`,
        })
      );
    } else {
      res.send(
        JSON.stringify({
          err: null,
          is_data: false,
          data: null,
          cnt_data: 0,
          msg: "No such district is found",
        })
      );
    }
  });
});

/**
 *  [ Upload CSV Data ]
 *
 *  Method: POST
 *  Request Type: File (form-data)
 *  Request Body: { covid19csv }
 *  Response Type: string
 *  Response Body: { err, is_upload, msg }
 *
 */
router.post("/upload", (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.send(
      JSON.stringify({
        err: null,
        is_upload: false,
        msg: "No file is uploaded",
      })
    );
  }

  const csvFile = req.files.covid19csv;
  csvFile.mv(csvFiles.TMP_CSV, (err) => {
    if (err) {
      return res.send(
        JSON.stringify({
          err,
          is_upload: false,
          msg: "Cannot convert csv to json",
        })
      );
    }

    const stream = fs
      .createReadStream(csvFiles.TMP_CSV)
      .pipe(iconv.decodeStream("euc-kr"))
      .pipe(csvtojson())
      .pipe(fs.createWriteStream(csvFiles.TMP_JSON_TXT));

    stream.on("finish", () => {
      fs.readFile(csvFiles.TMP_JSON_TXT, (err, outputJSONtxt) => {
        if (err) {
          return res.send(
            JSON.stringify({
              err,
              is_upload: false,
              msg: "Cannot read temporary file - output-*.txt",
            })
          );
        }
        const outputJSON = JSON.parse(
          "[" +
            (new String(outputJSONtxt).replace(/\n/g, ",\n") + ",").replace(
              ",\n,",
              ""
            ) +
            "]"
        );

        const sqlInit = "TRUNCATE TABLE Covid19";
        const sql = "INSERT INTO Covid19 VALUES ?";
        connDB.query(sqlInit, (err, results) => {
          if (err) {
            return res.send(
              JSON.stringify({
                err,
                is_upload: false,
                msg: "Cannot initialize database table",
              })
            );
          }
          const values = [];
          for (let oKey in outputJSON) {
            let value = [];
            enumCovid19.forEach((kObj) => {
              let v = outputJSON[oKey][kObj[0]];
              if (kObj[1].split("_").pop() === "at") {
                if (kObj[1] === "confirmed_at") {
                  let mthdate = new String(v)
                    .split(".")
                    .map((s) => parseInt(s));
                  v = new Date(2020, mthdate[0] - 1, mthdate[1]).getTime();
                } else {
                  let datetime = new String(v).split(" ");
                  let date = datetime[0].split("-").map((s) => parseInt(s));
                  let time = datetime[1].split(":").map((s) => parseInt(s));
                  v = new Date(
                    date[0],
                    date[1] - 1,
                    date[2],
                    time[0],
                    time[1],
                    0,
                    0
                  ).getTime();
                }
              } else if (kObj[0] === "환자번호" && v === "미부여") {
                v = null;
              }
              value.push(v);
            });
            values.push(value);
          }
          connDB.query(sql, [values], (err) => {
            if (err) {
              return res.send(
                JSON.stringify({
                  err,
                  is_upload: false,
                  msg: "Cannot update database",
                })
              );
            }
            fs.unlink(csvFiles.TMP_CSV, (err) => {
              if (err) {
                return res.send(
                  JSON.stringify({
                    err,
                    is_upload: false,
                    msg: "Cannot delete temporary file - covid19csv-*.csv",
                  })
                );
              }

              fs.unlink(csvFiles.TMP_JSON_TXT, (err) => {
                if (err) {
                  return res.send(
                    JSON.stringify({
                      err,
                      is_upload: false,
                      msg: "Cannot delete temporary file - output-*.txt",
                    })
                  );
                }
                res.send(
                  JSON.stringify({
                    err: null,
                    is_upload: true,
                    msg: "Data updated successfully",
                  })
                );
              });
            });
          });
        });
      });
    });
  });
});

/**
 *  [ Download CSV Data ]
 *
 *  Method: POST
 *  Request Type: N/A
 *  Request Body: N/A
 *  Response Type: string
 *  Response Body: { err, is_download, csv, msg }
 *
 */
router.post("/download", (req, res, next) => {
  const sql = "SELECT * FROM Covid19";
  connDB.query(sql, (err, rows, fields) => {
    if (err) {
      return res.send(
        JSON.stringify({
          err,
          is_download: false,
          csv: null,
          msg: "Cannot get data from the database",
        })
      );
    }
    if (rows.length > 0) {
      const headers = [],
        arrRows = [];
      enumCovid19Output.forEach((header) => headers.push(header[0]));
      while (rows.length !== 0) {
        let row = rows.pop();
				let rowOutput = {};
        for (let key in row) {
          if (key.indexOf("_at") !== -1) {
            let dt = new Date(row[key]);
						if(key === "confirmed_at") {
							row[key] = `${dt.getMonth() + 1}.${dt.getDate()}.`;
						} else {
            	row[key] = `${dt.getFullYear()}-${
            	  dt.getMonth() + 1
            	}-${dt.getDate()} ${dt
            	  .toTimeString()
            	  .split(" ")
            	  .shift()
            	  .slice(0, -3)}`;
						}
          }
        }
				enumCovid19Output.forEach((header) => rowOutput[header[1]] = row[header[1]]);
        arrRows.push(Object.values(rowOutput));
      }
      const csvData = convertArrayToCSV(arrRows, {
        header: headers,
        seperator: ",",
      });
      res.send(
        JSON.stringify({
          err: null,
          is_download: true,
          csv: csvData,
          msg: "CSV file is downloaded successfully",
        })
      );
      /* File Download Version
      fs.writeFile(csvFiles.TMP_CSV, csvData, (err) => {
        if(err) {
          return res.send(
            { err, is_download: false, csv: null, msg: "Cannot write CSV file" }
          );
        }
        res.download(csvFiles.TMP_CSV, (err) => {
          if(err) {
            return res.send(
              { err, is_download: false, csv: null, msg: "Cannot download CSV file" }
            );
          }
          fs.unlink(csvFiles.TMP_CSV, (err) => {
            if(err) throw err;
          });
        });
      });*/
    } else {
      res.send(
        JSON.stringify({
          err: null,
          is_download: false,
          csv: null,
          msg: "No data found",
        })
      );
    }
  });
});

module.exports = router;
