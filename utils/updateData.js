const fs = require("fs");
const path = require("path");
const util = require("util");
const puppeteer = require("puppeteer");

const download = async (page, f) => {
  const downloadPath = path.resolve(process.cwd(), "..", "public");
  await util.promisify(fs.mkdir)(downloadPath);
  console.error("Download directory:", downloadPath);

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await f();

  console.error("Downloading...");
  let fileName;
  while (!fileName || fileName.endsWith(".crdownload")) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    [fileName] = await util.promisify(fs.readdir)(downloadPath);
  }

  const filePath = path.resolve(
    downloadPath,
    `${fileName}-${Math.random().toString(36).substr(2, 8)}`
  );
  console.error("Downloaded file:", filePath);
  return filePath;
};

exports.updateData = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--disable-features=site-per-process", "--no-sandbox"],
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
  await download(page, () => page.click("#btnCsv"));

  await browser.close();
};
exports.updateData();
