const createError = require("http-errors");
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const schedule = require("node-schedule");
const logger = require("morgan");

require("module-alias/register");

const { updateData } = require("@utils/updateData");

const indexRouter = require("@routes/index");
const covid19dataRouter = require("@routes/covid19data");
const miscRouter = require("@routes/misc");

const app = express();

require("dotenv").config();

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PW,
  database: process.env.MYSQL_DB,
};

let bgUpdateProc = schedule.scheduleJob("* 5 * * *", async () => {
	await updateData();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/covid19data", covid19dataRouter);
app.use("/misc", miscRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
