import { trim, uniqBy } from "lodash-es";
import { parseDate } from "./parse-date.js";
import { IssuedShare } from "./types.js";

export function parseIssuedShares(content: string): IssuedShare[] {
  const result: IssuedShare[] = [];
  const lines = trim(content)
    .split(/[\n\r]+/)
    .filter((line) => line);
  lines.forEach((line) => {
    const [grantDate, grantNumber, grantType, vestingDate, vestedShares, stockPrice, _1, exercisePrice, _2] =
      line.split(" ");
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
