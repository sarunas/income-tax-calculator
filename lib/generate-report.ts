// lib/generate-report.ts
import moment from 'moment';
import { round } from './round';
import _ from 'lodash';
import { IssuedShare } from './parse-issued-shares';
import { SoldShare } from './parse-sold-shares';

export interface AugmentedIssuedShare extends IssuedShare {
  balance: number;
  exchangeRate: number;
  cost: number;
  incomeAmount: number;
}

export interface AugmentedSoldShare extends SoldShare {
  exchangeRate: number;
  amount: number;
  totalFeesInEur: number;
  cost: number;
  gain: number;
}

// Yearly Aggregation Interfaces Using Augmented Types
export interface YearlyIncome {
  total: number;
  taxAmount: number;
  shares: AugmentedIssuedShare[];
}

export interface YearlyGain {
  total: number;
  taxAmount: number;
  transactions: AugmentedSoldShare[];
}

export interface Report {
  incomeByYear: { [year: number]: YearlyIncome };
  gainByYear: { [year: number]: YearlyGain };
}

// Tax Rate Functions
function getIncomeTaxRate(date: Date): number {
  return date.getFullYear() > 2018 ? 0.2 : 0.15;
}

function getGainTaxRate(date: Date): number {
  return 0.15;
}

// generateReport Function with Correct Types
export const generateReport = async (
    issuedShares: IssuedShare[],
    soldShares: SoldShare[],
    fetchExchangeRate: (date: string, currency: string) => Promise<number>
): Promise<Report> => {
  console.log('Generating report please wait...\n');

  // Sort issued shares by vestingDate
  const issuedSharesSortedByDate: IssuedShare[] = _.sortBy(issuedShares, ['vestingDate']);

  // Augment Issued Shares with Additional Properties
  const augmentedIssuedShares: AugmentedIssuedShare[] = [];
  for (const share of issuedSharesSortedByDate) {
    const date = moment(share.vestingDate).format('YYYY-MM-DD');
    const exchangeRate = await fetchExchangeRate(date, 'USD');
    const cost = round((share.vestedShares * share.stockPrice) / exchangeRate);
    const incomeAmount = round((share.vestedShares * (share.stockPrice - share.exercisePrice)) / exchangeRate);

    const augmentedShare: AugmentedIssuedShare = {
      ...share,
      balance: share.vestedShares,
      exchangeRate,
      cost,
      incomeAmount,
    };

    augmentedIssuedShares.push(augmentedShare);
  }

  // Group Augmented Issued Shares by grantNumber
  const shareGroups: { [grantNumber: string]: AugmentedIssuedShare[] } = _.groupBy(augmentedIssuedShares, 'grantNumber');

  // Sort sold shares by orderDate
  const soldSharesSortedByDate: SoldShare[] = _.sortBy(soldShares, ['orderDate']);

  // Augment Sold Shares with Additional Properties
  const augmentedSoldShares: AugmentedSoldShare[] = [];
  for (const transaction of soldSharesSortedByDate) {
    const date = moment(transaction.orderDate).format('YYYY-MM-DD');
    const exchangeRate = await fetchExchangeRate(date, 'USD');
    const amount = round((transaction.sharesSold * transaction.salePrice) / exchangeRate);
    const totalFeesInEur = round(transaction.totalFees / exchangeRate);

    const augmentedTransaction: AugmentedSoldShare = {
      ...transaction,
      exchangeRate,
      amount,
      totalFeesInEur,
      cost: 0,  // Initialized to 0; will be calculated later
      gain: 0,  // Initialized to 0; will be calculated later
    };

    augmentedSoldShares.push(augmentedTransaction);
  }

  // Initialize Report Aggregations
  const incomeByYear: { [year: number]: YearlyIncome } = {};
  for (const share of augmentedIssuedShares) {
    const year = share.vestingDate.getFullYear();
    if (!incomeByYear[year]) {
      incomeByYear[year] = { total: 0, taxAmount: 0, shares: [] };
    }

    incomeByYear[year].total += share.incomeAmount;
    incomeByYear[year].taxAmount += round(share.incomeAmount * getIncomeTaxRate(share.vestingDate));
    incomeByYear[year].shares.push(share);
  }

  const gainByYear: { [year: number]: YearlyGain } = {};
  for (const transaction of augmentedSoldShares) {
    const year = transaction.orderDate.getFullYear();
    if (!gainByYear[year]) {
      gainByYear[year] = { total: 0, taxAmount: 0, transactions: [] };
    }

    let gain = transaction.amount - transaction.totalFeesInEur;
    let sharesSold = transaction.sharesSold;

    const sharesForGrant: AugmentedIssuedShare[] = shareGroups[transaction.grantNumber] || [];
    for (const share of sharesForGrant) {
      if (share.balance > 0) {
        if (share.balance >= sharesSold) {
          const cost = round((share.cost / share.vestedShares) * sharesSold);
          share.balance -= sharesSold;
          transaction.cost += cost;
          gain -= cost;
          sharesSold = 0;
        } else {
          const cost = round((share.cost / share.vestedShares) * share.balance);
          sharesSold -= share.balance;
          transaction.cost += cost;
          gain -= cost;
          share.balance = 0;
        }
      }

      if (sharesSold === 0) break;
    }

    transaction.gain = gain;

    gainByYear[year].total += transaction.gain;
    gainByYear[year].taxAmount += round(transaction.gain * getGainTaxRate(transaction.orderDate));
    gainByYear[year].transactions.push(transaction);
  }

  return { incomeByYear, gainByYear };
};
