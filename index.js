const https = require("https");
const fs = require("fs");
const puppeteer = require("puppeteer");

const ROSENKA_TOP_URL = "https://www.rosenka.nta.go.jp/";

/**
 * @param {string} input - a address string to find rosenka
 * @param {any} opt - the option object to launch puppeteer
 * @return {Promise<void>}
 */
const findRosenka = async (input, opt) => {
  console.log(`Started findRosenka with input: ${input}`);
  let browser;
  try {
    browser = await puppeteer.launch(opt);
    const page = await browser.newPage();
    page.on("console", (msg) => console.log("PAGE LOG: ", msg.text()));
    await page.goto(ROSENKA_TOP_URL);

    // Select Prefecture
    const prefectureLinks = await page.evaluate(generateLinks);
    const prefecture = prefectureLinks.find(({ text }) =>
      input.startsWith(text)
    );
    console.log(`selected prefecture: ${JSON.stringify(prefecture)}`);
    await page.goto(prefecture.link);
    console.log(`Successfully moved to ${prefecture.link}`);
    input = input.replace(prefecture.text, "");

    // Go to Rosenka page
    const linksInPref = await page.evaluate(generateLinks);
    const prefTop = linksInPref.find(({ text }) => text === "路線価図");
    await page.goto(prefTop.link);
    console.log(`Successfully moved to ${prefTop.link}`);

    // Select city
    const cityLinks = await page.evaluate(generateLinks);
    const city = cityLinks.find(({ text }) => input.startsWith(text));
    console.log(`selected city: ${JSON.stringify(city)}`);
    await page.goto(city.link);
    console.log(`Successfully moved to ${city.link}`);
    input = input.replace(city.text, "");

    // Save PDFs
    const placeLinks = await page.evaluate(generatePlaceLinks);
    const placeLink = placeLinks.find(({ text }) => input.startsWith(text));
    console.log(`selected place: ${JSON.stringify(placeLink)}`);
    input = input.replace(placeLink.text, "");
    const promises = placeLink.links.map(async ({ text, link }) => {
      const newPage = await browser.newPage();
      await newPage.goto(link);
      const pdfSrc = await newPage.evaluate(() => {
        return document.getElementById("pdfload").src;
      });
      await downloadFile(pdfSrc, `output/${text}.pdf`);
    });
    await Promise.all(promises);

    console.log(`rest input: ${input}`);
    console.log("Successfully completed findRosenka function!");
  } catch (error) {
    console.error("Failed to complete findRosenka function!");
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateLinks = () => {
  const links = [];
  const tags = document.getElementsByTagName("a");
  for (let i = 0; i < tags.length; i++) {
    const element = tags[i];
    links.push({
      text: element.text,
      link: element.href,
    });
  }
  return links;
};

const generatePlaceLinks = () => {
  const links = [];
  const trs = document
    .getElementsByClassName("tbl_list")[0]
    .getElementsByTagName("tr");

  // Skip i === 0 because it is the title row.
  for (let i = 1; i < trs.length; i++) {
    const tr = trs[i];
    const ths = tr.getElementsByTagName("th");
    const text = ths[ths.length - 1].innerText;
    const tds = tr.getElementsByTagName("td");
    const l = [];
    for (let j = 0; j < tds.length; j++) {
      const td = tds[j];
      const a = td.getElementsByTagName("a")[0];
      l.push({
        text: a.text,
        link: a.href,
      });
    }
    links.push({
      text,
      links: l,
    });
  }

  return links;
};

/**
 * @param {string} urlString - A url string to fetch a file.
 * @param {string} filename - A location and filename where the downloaded file is saved.
 * @return {Promise<void>}
 */
const downloadFile = async (urlString, filename) => {
  return new Promise((resolve, reject) => {
    const outFile = fs.createWriteStream(filename);
    const request = https.get(urlString, (response) => {
      response.pipe(outFile);
      response.on("end", () => {
        outFile.close();
        resolve();
      });
    });
    request.on("error", (err) => {
      console.error(
        `Unexpected error occurred to download file from ${urlString}, err: ${err.message}`
      );
      reject(err);
    });
  });
};

const inputStr = process.env.INPUT || "東京都千代田区千代田１−１";

const launchOption =
  process.env.DEBUG === "true" ? { headless: false, slowMo: 250 } : undefined;

findRosenka(inputStr, launchOption);
