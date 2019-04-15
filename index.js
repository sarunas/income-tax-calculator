const fs = require('fs');
const { parseIssuedShares } = require('./lib/parse-issued-shares');
const { parseSoldShares } = require('./lib/parse-sold-shares');
const { generateReport } = require('./lib/generate-report');
const { generateTaxFillInstructions } = require('./lib/generate-tax-fill-instructions');

const issuedShares = parseIssuedShares(fs.readFileSync('./shares-issued.txt').toString());
const soldShares = parseSoldShares(fs.readFileSync('./shares-sold.txt').toString());

generateReport(issuedShares, soldShares).then(report => {
  generateTaxFillInstructions(report, process.argv.includes('split-gain'));
});
