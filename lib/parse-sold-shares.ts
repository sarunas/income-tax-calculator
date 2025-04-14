import { trim, uniqBy } from "lodash-es";
import { parseDate } from "./parse-date";
import type { SoldShare } from "./types";

const LINE_REGEX = /^(\d+)\s+(Sell of (?:Restricted )?Stock|Same Day Sell)\s+([A-Z0-9]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d+)\s+([\d.]+) \$\s+([\d.]+) \$\s+([\d.]+) \$$/;

export function parseSoldShares(content: string): SoldShare[] {
  const result: SoldShare[] = [];
  const lines = trim(content)
    .split(/[\n\r]+/);

  if (lines[0] === "") {
    return result;
  }

  lines.forEach((line) => {
    const match = line.match(LINE_REGEX);

    if (!match) {
      throw new Error(`Invalid line: ${line}`);
    }

    const [_, orderNumber, action, grantNumber, grantDate, grantType, orderDate, sharesSold, salePrice, exercisePrice, totalFees] = match;

    result.push({
      orderNumber,
      action: action as 'Sell of Restricted Stock' | 'Sell of Stock' | 'Same Day Sell',
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