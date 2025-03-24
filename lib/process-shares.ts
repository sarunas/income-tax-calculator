import { parseIssuedShares } from './parse-issued-shares';
import { parseSoldShares } from './parse-sold-shares';
import type { IssuedShare, SoldShare, ShareProcessingResult } from './types';

export function processShares(issuedShares: IssuedShare[], soldShares: SoldShare[]): ShareProcessingResult {
  const processedIssuedShares = [...issuedShares];

  const sameDayShares = soldShares.filter((entry) => entry.action === "Same Day Sell");
  sameDayShares.forEach((entry) =>
    processedIssuedShares.push({
      grantDate: entry.grantDate,
      grantNumber: entry.grantNumber,
      grantType: entry.grantType,
      vestingDate: entry.orderDate,
      vestedShares: entry.sharesSold,
      stockPrice: entry.salePrice,
      exercisePrice: entry.exercisePrice,
    }),
  );

  return {
    issuedShares: processedIssuedShares,
    soldShares,
  };
}

export function processShareInputs(issuedSharesContent: string, soldSharesContent: string): ShareProcessingResult {
  const issuedShares = parseIssuedShares(issuedSharesContent);
  const soldShares = parseSoldShares(soldSharesContent);
  return processShares(issuedShares, soldShares);
} 