const { parseIssuedShares } = require('./lib/parse-issued-shares');
const { parseSoldShares } = require('./lib/parse-sold-shares');
const { generateReport } = require('./lib/generate-report');
const { generateTaxFillInstructions } = require('./lib/generate-tax-fill-instructions-data');
const { fetchExchangeRate } = require('./lib/currency-exchange');
const { round } = require('./lib/round');

module.exports = {
  parseIssuedShares,
  parseSoldShares,
  generateReport,
  generateTaxFillInstructions,
  fetchExchangeRate,
  round
};