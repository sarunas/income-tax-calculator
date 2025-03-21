import moment from "moment";
import { round } from "./round.js";
import { sortBy, groupBy } from "lodash-es";
import { IssuedShare, SoldShare, SoldShareTax, Report, IssuedShareTax, YearlyIncome, YearlyGain } from "./types";

const excludeOptions = (share: IssuedShare): boolean => {
  const grantDate = moment(share.grantDate);
  const vestingDate = moment(share.vestingDate);
  return !(grantDate.isAfter("2020-02-01") && vestingDate.diff(grantDate, "years") >= 3);
};

export const generateReport = async (
  issuedShares: IssuedShare[],
  soldShares: SoldShare[],
  fetchExchangeRate: (date: string, currency: string) => Promise<number>,
): Promise<Report> => {
  console.log("Generating report please wait...\n");

  const issuedSharesSortedByDate: IssuedShareTax[] = [];
  for (const share of sortBy(issuedShares, ["vestingDate"]).filter(excludeOptions)) {
    const exchangeRate = await fetchExchangeRate(moment(share.vestingDate).format("YYYY-MM-DD"), "USD");
    issuedSharesSortedByDate.push({
      ...share,
      balance: share.vestedShares,
      exchangeRate: exchangeRate,
      cost: round((share.vestedShares * share.stockPrice) / exchangeRate),
      incomeAmount: round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / exchangeRate),
    });
  }

  const shareGroups = groupBy(issuedSharesSortedByDate, (item) => item.grantNumber);

  const soldSharesSortedByDate: SoldShareTax[] = [];
  for (const transaction of sortBy(soldShares, ["orderDate"])) {
    const date = moment(transaction.orderDate).format("YYYY-MM-DD");
    const exchangeRate = await fetchExchangeRate(date, "USD");
    soldSharesSortedByDate.push({
      ...transaction,
      exchangeRate,
      amount: round((transaction.sharesSold * transaction.salePrice) / exchangeRate),
      totalFeesInEur: round(transaction.totalFees / exchangeRate),
      cost: 0,
      gain: 0,
    });
  }

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