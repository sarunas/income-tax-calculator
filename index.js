const fs = require('fs');
const { parseIssuedShares } = require('./lib/parse-issued-shares');
const { parseSoldShares } = require('./lib/parse-sold-shares');
const { generateReport } = require('./lib/generate-report');

const issuedShares = parseIssuedShares(fs.readFileSync('./shares-issued.txt').toString());
const soldShares = parseSoldShares(fs.readFileSync('./shares-sold.txt').toString());

generateReport(issuedShares, soldShares).then(report => {
  console.log(JSON.stringify(report));
});
