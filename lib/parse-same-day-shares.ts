import { trim, uniqBy } from "lodash";
import { parseDate } from "./parse-date";
import { SoldShare } from "./types";

export function parseSameDayShares(content: string): SoldShare[] {
  const result: SoldShare[] = [];
  const lines = trim(content)
    .split(/[\n\r]+/)
    .filter((line) => line.includes("Same Day Sell"))
    .map((line) => line.replace(/Same Day Sell /g, ""));

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
