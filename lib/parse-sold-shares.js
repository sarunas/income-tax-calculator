const { trim } = require('lodash');
const { parseDate } = require('./parse-date');

function parseSoldShares(content) {
  const result = [];
  const lines = trim(content)
    .replace(/Sell of Restricted Stock /g, '')
    .replace(/Sell of Stock /g, '')
    .split(/[\n\r]+/);
  lines.forEach(line => {
    const [orderNumber, grantNumber, grantDate, grantType, orderDate, sharesSold, salePrice, _1, exercisePrice, _2, totalFees, _3] = line.split(' ');
    result.push({
      orderNumber,
      grantNumber,
      grantDate: parseDate(grantDate),
      grantType,
      orderDate: parseDate(orderDate),
      sharesSold: parseInt(sharesSold, 10),
      salePrice: parseFloat(salePrice),
      exercisePrice: parseFloat(exercisePrice),
      totalFees: parseFloat(totalFees),
    });
  });
  return result;
}

module.exports = {
  parseSoldShares,
};
