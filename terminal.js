const fs = require('fs');
const { parseIssuedShares } = require('./lib/parse-issued-shares');
const { parseSoldShares } = require('./lib/parse-sold-shares');
const { generateReport } = require('./lib/generate-report');
const { generateTaxFillInstructionsData } = require('./lib/generate-tax-fill-instructions-data');
const { fetchExchangeRate } = require('./lib/fetch-exchange-rate-cached')

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
        console.log('---');
    }
}

const issuedShares = parseIssuedShares(fs.readFileSync('./shares-issued.txt').toString());
const soldShares = parseSoldShares(fs.readFileSync('./shares-sold.txt').toString());

generateReport(issuedShares, soldShares, fetchExchangeRate).then(report => {
  const data = generateTaxFillInstructionsData(report, process.argv.includes('split-gain'));
  outputInstructionsToConsole(data);
});
