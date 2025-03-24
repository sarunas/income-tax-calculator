import { isAfter, differenceInYears, formatDate, formatters, longFormatters } from "date-fns";
import { round } from "./round";
import { sortBy, groupBy } from "lodash-es";
import { 
  IssuedShare, 
  SoldShare, 
  ShareSaleWithTax, 
  Report, 
  VestedShareWithTax, 
  YearlyIncome, 
  YearlyGain,
  ShareBalance
} from "./types";

// Force date-fns formatters to be included in the bundle for Parcel
const _FORCE_BUNDLE = [formatters, longFormatters];

// Exclude options where grant date is after 2020-02-01 and vesting period is 3+ years
function isOptionTaxExempt(share: IssuedShare): boolean {
  return isAfter(share.grantDate, new Date("2020-02-01")) && 
    differenceInYears(share.vestingDate, share.grantDate) >= 3;
}

function excludeOptions(share: IssuedShare): boolean {
  return !isOptionTaxExempt(share);
}

export async function generateReport(
  issuedShares: IssuedShare[],
  soldShares: SoldShare[],
  fetchExchangeRate: (date: string, currency: string) => Promise<number>,
): Promise<Report> {
  console.log("Generating report please wait...\n");

  // Create share balances for gain calculations from all issued shares
  const sortedIssuedShares = sortBy(issuedShares, ["vestingDate"]);
  const shareBalances: ShareBalance[] = sortedIssuedShares.map(share => ({
    vesting: share,
    remainingShares: share.vestedShares
  }));
  const shareBalancesByGrant = groupBy(shareBalances, (item) => item.vesting.grantNumber);

  const filteredIssuedShares = sortedIssuedShares.filter(excludeOptions);
  const vestedSharesWithTax: VestedShareWithTax[] = await Promise.all(filteredIssuedShares.map(async share => {
    const date = formatDate(share.vestingDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    return {
      vesting: share,
      exchangeRate: exchangeRate,
      cost: round((share.vestedShares * share.stockPrice) / exchangeRate),
      incomeAmount: round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / exchangeRate),
    };
  }));

  const sortedSoldShares = sortBy(soldShares, ["orderDate"]);
  const shareSalesWithTax: ShareSaleWithTax[] = await Promise.all(sortedSoldShares.map(async share => {
    // Calculate sale amount and fees
    const date = formatDate(share.orderDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    const amount = round((share.sharesSold * share.salePrice) / exchangeRate);
    const totalFeesInEur = round(share.totalFees / exchangeRate);

    // Calculate cost basis using FIFO method
    let remainingSharesToSell = share.sharesSold;
    let totalCost = totalFeesInEur;

    for (const shareBalance of shareBalancesByGrant[share.grantNumber]) {
      if (shareBalance.remainingShares <= 0) continue;

      const sharesToUse = Math.min(shareBalance.remainingShares, remainingSharesToSell);
      const vestingDate = formatDate(shareBalance.vesting.vestingDate, "yyyy-MM-dd");
      const vestingExchangeRate = await fetchExchangeRate(vestingDate, "USD");

      const costPerShare = isOptionTaxExempt(shareBalance.vesting) ? 0 : round((shareBalance.vesting.stockPrice) / vestingExchangeRate);
      const cost = round(sharesToUse * costPerShare);

      shareBalance.remainingShares -= sharesToUse;
      remainingSharesToSell -= sharesToUse;
      totalCost += cost;

      if (remainingSharesToSell <= 0) break;
    }

    if (remainingSharesToSell > 0) {
      throw new Error(`Not enough shares available for grant ${share.grantNumber}. Attempted to sell ${share.sharesSold} shares but only ${share.sharesSold - remainingSharesToSell} were available.`);
    }

    // Calculate final gain
    const gain = round(amount - totalCost);

    return {
      sale: share,
      exchangeRate,
      amount,
      totalFeesInEur,
      cost: totalCost,
      gain
    };
  }));

  // income by year
  const incomeByYear = vestedSharesWithTax.reduce((acc, share) => {
    const year = share.vesting.vestingDate.getFullYear();
    if (!acc[year]) {
      acc[year] = { total: 0, shares: [] };
    }
    acc[year].total += share.incomeAmount;
    acc[year].shares.push(share);
    return acc;
  }, {} as Record<number, YearlyIncome>);

  // profit by year
  const gainByYear = shareSalesWithTax.reduce((acc, transaction) => {
    const year = transaction.sale.orderDate.getFullYear();
    if (!acc[year]) {
      acc[year] = { total: 0, transactions: [] };
    }
    acc[year].total += transaction.gain;
    acc[year].transactions.push(transaction);
    return acc;
  }, {} as Record<number, YearlyGain>);

  return {
    shareBalancesByGrant,
    incomeByYear,
    gainByYear,
  };
} 