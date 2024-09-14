import fs from 'fs/promises';
import { parseIssuedShares } from './lib/parse-issued-shares';
import { parseSameDayShares } from "./lib/parse-same-day-shares";
import { parseSoldShares } from './lib/parse-sold-shares';
import { generateReport } from './lib/generate-report';
import { generateTaxFillInstructionsData } from './lib/generate-tax-fill-instructions-data';
import { fetchExchangeRate } from './lib/fetch-exchange-rate-cached';

interface Instruction {
  heading: string;
  fields: Array<{
    name: string;
    value?: number;
    subfields?: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

interface Instructions {
  [year: string]: Instruction;
}

const outputInstructionsToConsole = (instructions: Instructions): void => {
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
    console.log('---');
  }
};

const main = async (): Promise<void> => {
  try {
    const soldSharesTxt = await fs.readFile('./shares-sold.txt', 'utf-8');
    const issuedSharesTxt = await fs.readFile('./shares-issued.txt', 'utf-8');

    const soldShares = parseSoldShares(soldSharesTxt);
    const sameDayShares = parseSameDayShares(soldSharesTxt);
    const issuedShares = parseIssuedShares(issuedSharesTxt);

    sameDayShares.forEach(entry => issuedShares.push({
      grantDate: entry.grantDate,
      grantNumber: entry.grantNumber,
      grantType: entry.grantType,
      vestingDate: entry.orderDate,
      vestedShares: entry.sharesSold,
      stockPrice: entry.salePrice,
      exercisePrice: entry.exercisePrice,
    }));

    const shouldSplit = process.argv.includes('split-gain');

    const report = await generateReport(issuedShares, soldShares, fetchExchangeRate);
    const data = generateTaxFillInstructionsData(report, shouldSplit);
    outputInstructionsToConsole(data);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

main();