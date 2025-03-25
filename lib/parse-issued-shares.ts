import { trim, uniqBy } from "lodash-es";
import { parseDate } from "./parse-date";
import type { IssuedShare } from "./types";

const LINE_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Z0-9]+)\s+([A-Z]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d+)\s+([\d.]+)\s+\$\s+([\d.]+)\s+\$$/;

export function parseIssuedShares(content: string): IssuedShare[] {
  const result: IssuedShare[] = [];
  const lines = trim(content)
    .split(/[\n\r]+/)
    .filter((line) => line);
  lines.forEach((line) => {
    const match = line.match(LINE_REGEX);

    if (!match) {
      throw new Error(`Invalid line: ${line}`);
    }

    const [_, grantDate, grantNumber, grantType, vestingDate, vestedShares, stockPrice, exercisePrice] = match;

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
