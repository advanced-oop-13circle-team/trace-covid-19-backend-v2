const fs = require("fs");
const path = require("path");
const util = require("util");
const puppeteer = require("puppeteer");
const iconv = require("iconv-lite");
const csvtojson = require("csvtojson");
const { convertArrayToCSV } = require("convert-array-to-csv");
const { connDB } = require("@utils/connDB");
const { enumCovid19 } = require("@utils/covid19csvConfig");

const download = async (page, fname, f) => {
  const downloadPath = path.join(process.cwd(), "newData");
	await util.promisify(fs.mkdir)(downloadPath);
  console.error("Download directory:", downloadPath);

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await f();

  console.error("Downloading...");
  let fileName = null;
  while (!fileName || fileName.endsWith(".crdownload")) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    [fileName] = await util.promisify(fs.readdir)(downloadPath);
  }

  const filePath1 = path.resolve(downloadPath, fileName);
	const filePath2 = path.resolve(downloadPath, fname);
	fs.renameSync(filePath1, filePath2);
  console.error("Downloaded file:", filePath2);
};

exports.updateData = async (cb) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: process.cwd(),
  });

  await page.goto(
    "http://data.seoul.go.kr/dataList/OA-20279/S/1/datasetView.do",
    { waitUntil: "networkidle0" }
  );

  await page.waitForSelector("#btnCsv");
  await download(page, "covid19data.csv", () => page.click("#btnCsv"));

  await browser.close();

	const stream = fs
		.createReadStream("newData/covid19data.csv")
		.pipe(iconv.decodeStream("euc-kr"))
		.pipe(csvtojson())
		.pipe(fs.createWriteStream("newData/covid19JsonData.txt"));

	stream.on("finish", () => {
		fs.readFile("newData/covid19JsonData.txt", (err, outputJSONtxt) => {
			if(err) throw err;
			const outputJSON = JSON.parse(
				"[" +
					(new String(outputJSONtxt).replace(/\n/g, ",\n") + ",").replace(
						",\n,",
						""
					) +
				"]"
			);

			//
      const sqlInit = "TRUNCATE TABLE Covid19";
      const sql = "INSERT INTO Covid19 VALUES ?";
      connDB.query(sqlInit, (err, results) => {
				if(err) throw err;
				//
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
					if(err) throw err;
					fs.unlink("newData/covid19data.csv", (err) => {
						if(err) throw err;
						fs.unlink("newData/covid19JsonData.txt", (err) => {
							if(err) throw err;
							fs.rmdir("newData", (err) => {
								if(err) throw err;
								cb();
							});
						});
					});
				});
			});
		});
	});
};

