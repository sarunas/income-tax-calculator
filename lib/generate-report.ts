import { isAfter, differenceInYears, format, formatters, longFormatters } from "date-fns";
import { round } from "./round";
import { sortBy, groupBy } from "lodash-es";
import { 
  IssuedShare, 
  SoldShare, 
  ShareSaleWithTax, 
  Report, 
  VestedShareWithTax, 
  YearlyIncome, 
  YearlyGain 
} from "./types";

const _FORCE_BUNDLE = [formatters, longFormatters];

const excludeOptions = (share: IssuedShare): boolean => {
  return !(isAfter(share.grantDate, new Date("2020-02-01")) && 
          differenceInYears(share.vestingDate, share.grantDate) >= 3);
};

export const generateReport = async (
  issuedShares: IssuedShare[],
  soldShares: SoldShare[],
  fetchExchangeRate: (date: string, currency: string) => Promise<number>,
): Promise<Report> => {
  console.log("Generating report please wait...\n");

  const filteredIssuedShares = sortBy(issuedShares, ["vestingDate"]).filter(excludeOptions);
  const vestedSharesWithTax: VestedShareWithTax[] = await Promise.all(filteredIssuedShares.map(async share => {
    const date = format(share.vestingDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    return {
      vesting: share,
      balance: share.vestedShares,
      exchangeRate: exchangeRate,
      cost: round((share.vestedShares * share.stockPrice) / exchangeRate),
      incomeAmount: round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / exchangeRate),
    };
  }));
  const shareGroups = groupBy(vestedSharesWithTax, (item) => item.vesting.grantNumber);

  const filteredSoldShares = sortBy(soldShares, ["orderDate"]);
  const shareSalesWithTax: ShareSaleWithTax[] = await Promise.all(filteredSoldShares.map(async share => {
    const date = format(share.orderDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    return {
      sale: share,
      exchangeRate,
      amount: round((share.sharesSold * share.salePrice) / exchangeRate),
      totalFeesInEur: round(share.totalFees / exchangeRate),
      cost: 0,
      gain: 0,
    };
  }));

  // income by year
  const incomeByYear: Record<number, YearlyIncome> = {};
  for (const share of vestedSharesWithTax) {
    const year = share.vesting.vestingDate.getFullYear();
    if (incomeByYear[year] === undefined) {
      incomeByYear[year] = {
        total: 0,
        shares: [],
      };
    }

    incomeByYear[year].total += share.incomeAmount!;
    incomeByYear[year].shares.push(share);
  }

  // profit by year
  const gainByYear: Record<number, YearlyGain> = {};
  for (const transaction of shareSalesWithTax) {
    const year = transaction.sale.orderDate.getFullYear();
    if (gainByYear[year] === undefined) {
      gainByYear[year] = {
        total: 0,
        transactions: [],
      };
    }

    let gain = transaction.amount - transaction.totalFeesInEur;
    let sharesSold = transaction.sale.sharesSold;

    for (const share of shareGroups[transaction.sale.grantNumber]) {
      const sharesToUse = Math.min(sharesSold, share.balance);
      const costPerShare = share.cost / share.vesting.vestedShares;
      const cost = round(costPerShare * sharesToUse);
      
      share.balance = share.balance - sharesToUse;
      transaction.cost = transaction.cost + cost;
      gain -= cost;
      sharesSold -= sharesToUse;

      if (sharesSold === 0) break;
    }

    if (sharesSold > 0) {
      throw new Error(`Not enough shares available for grant ${transaction.sale.grantNumber}. Attempted to sell ${transaction.sale.sharesSold} shares but only ${transaction.sale.sharesSold - sharesSold} were available.`);
    }

    transaction.gain = gain;

    gainByYear[year].total += transaction.gain;
    gainByYear[year].transactions.push(transaction);
  }

  return {
    incomeByYear,
    gainByYear,
  };
}; 