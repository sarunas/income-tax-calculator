const { trim, uniqBy } = require('lodash');
const { parseDate } = require('./parse-date');

function parseIssuedShares(content) {
  const result = [];
  const lines = trim(content).split(/[\n\r]+/);
  lines.forEach(line => {
    const [ grantDate, grantNumber, grantType, vestingDate, vestedShares, stockPrice, _1,  exercisePrice, _2 ] = line.split(' ');
    result.push({
      grantDate: parseDate(grantDate),
      grantNumber,
      grantType,
      vestingDate: parseDate(vestingDate),
      vestedShares: parseInt(vestedShares, 10),
      stockPrice: parseFloat(stockPrice),
      exercisePrice: parseFloat(exercisePrice),
    });
  });
  return uniqBy(result, ({ grantNumber, vestingDate }) => {
    return grantNumber + vestingDate.toString();
  });
}

module.exports = {
  parseIssuedShares,
};
