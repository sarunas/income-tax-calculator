import { trim, uniqBy } from "lodash";
import { parseDate } from "./parse-date.js";

export function parseSoldShares(content) {
  const result = [];
  const lines = trim(content)
    .replace(/Sell of Restricted Stock /g, "")
    .replace(/Sell of Stock /g, "")
    .replace(/Same Day Sell /g, "")
    .split(/[\n\r]+/);

  // Skip empty file
  if (lines[0] === "") {
    return result;
  }

  lines.forEach((line) => {
    const [
      orderNumber,
      grantNumber,
      grantDate,
      grantType,
      orderDate,
      sharesSold,
      salePrice,
      _1,
      exercisePrice,
      _2,
      totalFees,
      _3,
    ] = line.split(" ");
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
  return uniqBy(result, ({ orderNumber }) => {
    return orderNumber;
  });
}
