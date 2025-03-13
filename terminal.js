import fs from "fs";
import { parseIssuedShares } from "./lib/parse-issued-shares.js";
import { parseSameDayShares } from "./lib/parse-same-day-shares.js";
import { parseSoldShares } from "./lib/parse-sold-shares.js";
import { generateReport } from "./lib/generate-report.js";
import { generateTaxFillInstructionsData } from "./lib/generate-tax-fill-instructions-data.js";
import { fetchExchangeRate } from "./lib/fetch-exchange-rate-cached.js";

const outputInstructionsToConsole = (instructions) => {
  const years = Object.keys(instructions);
  for (const year of years) {
    console.log(instructions[year].heading);
    for (const field of instructions[year].fields) {
      if (field.subfields) {
        console.log(field.name);
        for (const subfield of field.subfields) {
          console.log(`${subfield.name} ${subfield.value}`);
        }
      } else {
        console.log(`${field.name} ${field.value}`);
      }
    }
    console.log("---");
  }
};

const soldSharesTxt = fs.readFileSync("./shares-sold.txt").toString();
const soldShares = parseSoldShares(soldSharesTxt);
const sameDayShares = parseSameDayShares(soldSharesTxt);
const issuedShares = parseIssuedShares(fs.readFileSync("./shares-issued.txt").toString());
sameDayShares.forEach((entry) =>
  issuedShares.push({
    grantDate: entry.grantDate,
    grantNumber: entry.grantNumber,
    grantType: entry.grantType,
    vestingDate: entry.orderDate,
    vestedShares: entry.sharesSold,
    stockPrice: entry.salePrice,
    exercisePrice: entry.exercisePrice,
  })
);

const shouldSplit = process.argv.includes("split-gain");

generateReport(issuedShares, soldShares, fetchExchangeRate).then((report) => {
  const data = generateTaxFillInstructionsData(report, shouldSplit);
  outputInstructionsToConsole(data);
});
