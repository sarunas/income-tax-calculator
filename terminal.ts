import fs from "fs";
import { parseIssuedShares } from "./lib/parse-issued-shares";
import { parseSameDayShares } from "./lib/parse-same-day-shares";
import { parseSoldShares } from "./lib/parse-sold-shares";
import { generateReport } from "./lib/generate-report";
import { generateTaxFillInstructionsData } from "./lib/generate-tax-fill-instructions-data";
import { fetchExchangeRateCached } from "./lib/fetch-exchange-rate-cached";

interface TaxField {
  name: string;
  value?: number;
  subfields?: {
    name: string;
    value: number;
  }[];
}

interface YearInstructions {
  heading: string;
  fields: TaxField[];
}

interface TaxInstructions {
  [year: number]: YearInstructions;
}

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
  const soldSharesTxt = fs.readFileSync("./shares-sold.txt", "utf-8");
  const issuedSharesTxt = fs.readFileSync("./shares-issued.txt", "utf-8");
  
  const soldShares = parseSoldShares(soldSharesTxt);
  const sameDayShares = parseSameDayShares(soldSharesTxt);
  const issuedShares = parseIssuedShares(issuedSharesTxt);
  
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