import { trim, uniqBy } from "lodash-es";
import { parseDate } from "./parse-date";
import type { SoldShare } from "./types";

const LINE_REGEX = /^(\d+)\s+(Sell of (?:Restricted )?Stock|Same Day Sell)\s+([A-Z]*\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d+)\s+([\d.]+) \$\s+([\d.]+) \$\s+([\d.]+) \$$/;

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
      return;
    }

    result.push({
      orderNumber: match[1],
      action: match[2] as 'Sell of Restricted Stock' | 'Sell of Stock' | 'Same Day Sell',
      grantNumber: match[3],
      grantDate: parseDate(match[4]),
      grantType: match[5],
      orderDate: parseDate(match[6]),
      sharesSold: parseInt(match[7], 10),
      salePrice: parseFloat(match[8]),
      exercisePrice: parseFloat(match[9]),
      totalFees: parseFloat(match[10]),
    });
  });
  return uniqBy(result, ({ orderNumber }) => {
    return orderNumber;
  });
} 