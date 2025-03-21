import { isAfter, differenceInYears, format, formatters, longFormatters } from "date-fns";
import { round } from "./round";
import { sortBy, groupBy } from "lodash";
import { IssuedShare, SoldShare, SoldShareTax, Report, IssuedShareTax, YearlyIncome, YearlyGain } from "./types";

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
  const issuedSharesSortedByDate: IssuedShareTax[] = await Promise.all(filteredIssuedShares.map(async share => {
    const date = format(share.vestingDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    return {
      ...share,
      balance: share.vestedShares,
      exchangeRate: exchangeRate,
      cost: round((share.vestedShares * share.stockPrice) / exchangeRate),
      incomeAmount: round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / exchangeRate),
    };
  }));
  const shareGroups = groupBy(issuedSharesSortedByDate, (item) => item.grantNumber);

  const filteredSoldShares = sortBy(soldShares, ["orderDate"]);
  const soldSharesSortedByDate: SoldShareTax[] = await Promise.all(filteredSoldShares.map(async transaction => {
    const date = format(transaction.orderDate, "yyyy-MM-dd");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    return {
      ...transaction,
      exchangeRate,
      amount: round((transaction.sharesSold * transaction.salePrice) / exchangeRate),
      totalFeesInEur: round(transaction.totalFees / exchangeRate),
      cost: 0,
      gain: 0,
    };
  }));

  // income by year
  const incomeByYear: Record<number, YearlyIncome> = {};
  for (const share of issuedSharesSortedByDate) {
    const year = share.vestingDate.getFullYear();
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
  for (const transaction of soldSharesSortedByDate) {
    const year = transaction.orderDate.getFullYear();
    if (gainByYear[year] === undefined) {
      gainByYear[year] = {
        total: 0,
        transactions: [],
      };
    }

    let gain = transaction.amount! - transaction.totalFeesInEur!;
    let sharesSold = transaction.sharesSold;

    transaction.cost = 0;
    for (const share of shareGroups[transaction.grantNumber]) {
      if (share.balance! > 0) {
        if (share.balance! > sharesSold) {
          const cost = round((share.cost! / share.vestedShares) * sharesSold);
          share.balance = share.balance! - sharesSold;
          transaction.cost = transaction.cost! + cost;
          gain -= cost;
          sharesSold = 0;
        } else {
          const cost = round((share.cost! / share.vestedShares) * share.balance!);
          sharesSold -= share.balance!;
          transaction.cost = transaction.cost! + cost;
          gain -= cost;
          share.balance = 0;
        }
      }

      if (sharesSold === 0) {
        break;
      }
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