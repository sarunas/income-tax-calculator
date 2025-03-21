import moment from "moment";
import { round } from "./round.js";
import _ from "lodash";

interface IssuedShare {
  grantDate: Date;
  vestingDate: Date;
  vestedShares: number;
  stockPrice: number;
  exercisePrice: number;
  grantNumber: string;
  balance?: number;
  exchangeRate?: number;
  cost?: number;
  incomeAmount?: number;
}

interface SoldShare {
  orderDate: Date;
  sharesSold: number;
  salePrice: number;
  totalFees: number;
  grantNumber: string;
  exchangeRate?: number;
  amount?: number;
  totalFeesInEur?: number;
  cost?: number;
  gain?: number;
}

interface YearlyIncome {
  total: number;
  shares: IssuedShare[];
}

interface YearlyGain {
  total: number;
  transactions: SoldShare[];
}

interface Report {
  incomeByYear: Record<number, YearlyIncome>;
  gainByYear: Record<number, YearlyGain>;
}

const excludeOptions = (share: IssuedShare): boolean => {
  const grantDate = moment(share.grantDate);
  const vestingDate = moment(share.vestingDate);
  return !(grantDate.isAfter("2020-02-01") && vestingDate.diff(grantDate, "years") >= 3);
};

export const generateReport = async (
  issuedShares: IssuedShare[],
  soldShares: SoldShare[],
  fetchExchangeRate: (date: string, currency: string) => Promise<number>
): Promise<Report> => {
  console.log("Generating report please wait...\n");
  const issuedSharesSortedByDate = _.sortBy(issuedShares, ["vestingDate"]).filter(excludeOptions);
  for (const share of issuedSharesSortedByDate) {
    const date = moment(share.vestingDate).format("YYYY-MM-DD");
    share.balance = share.vestedShares;
    share.exchangeRate = await fetchExchangeRate(date, "USD");
    share.cost = round((share.vestedShares * share.stockPrice) / share.exchangeRate!);
    share.incomeAmount = round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / share.exchangeRate!);
  }

  const shareGroups = _(issuedSharesSortedByDate)
    .groupBy((item) => item.grantNumber)
    .value();

  const soldSharesSortedByDate = _.sortBy(soldShares, ["orderDate"]);
  for (const transaction of soldSharesSortedByDate) {
    const date = moment(transaction.orderDate).format("YYYY-MM-DD");
    transaction.exchangeRate = await fetchExchangeRate(date, "USD");
    transaction.amount = round((transaction.sharesSold * transaction.salePrice) / transaction.exchangeRate!);
    transaction.totalFeesInEur = round(transaction.totalFees / transaction.exchangeRate!);
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