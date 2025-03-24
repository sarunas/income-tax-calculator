import fs from "fs";
import { parseIssuedShares } from "./lib/parse-issued-shares";
import { parseSoldShares } from "./lib/parse-sold-shares";
import { generateReport } from "./lib/generate-report";
import { generateTaxFillInstructionsData } from "./lib/generate-tax-fill-instructions-data";
import type { TaxInstructions } from "./lib/types";
import { fetchExchangeRateCached } from "./lib/fetch-exchange-rate-cached";

const outputInstructionsToConsole = (instructions: TaxInstructions): void => {
  const years = Object.keys(instructions).map(Number);
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

try {
  const issuedSharesTxt = fs.readFileSync("./shares-issued.txt", "utf-8");
  const soldSharesTxt = fs.readFileSync("./shares-sold.txt", "utf-8");
  
  const issuedShares = parseIssuedShares(issuedSharesTxt);
  const soldShares = parseSoldShares(soldSharesTxt);
  const sameDayShares = soldShares.filter((entry) => entry.action === "Same Day Sell");
  
  sameDayShares.forEach((entry) =>
    issuedShares.push({
      grantDate: entry.grantDate,
      grantNumber: entry.grantNumber,
      grantType: entry.grantType,
      vestingDate: entry.orderDate,
      vestedShares: entry.sharesSold,
      stockPrice: entry.salePrice,
      exercisePrice: entry.exercisePrice,
    }),
  );

  const shouldSplit = process.argv.includes("split-gain");

  generateReport(issuedShares, soldShares, fetchExchangeRateCached)
    .then((report) => {
      const data = generateTaxFillInstructionsData(report, shouldSplit);
      outputInstructionsToConsole(data);
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      process.exit(1);
    });
} catch (error) {
  console.error("Error reading input files:", error);
  process.exit(1);
} 