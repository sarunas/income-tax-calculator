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

export interface CalculationDetail {
  type: 'income' | 'gain';
  description: string;
  calculation: string;
  result: number;
}

export interface Report {
  incomeByYear: { [year: number]: YearlyIncome };
  gainByYear: { [year: number]: YearlyGain };
  calculationDetails: { [year: number]: CalculationDetail[] };
}

function getIncomeTaxRate(date: Date): number {
  return date.getFullYear() > 2018 ? 0.2 : 0.15;
}

function getGainTaxRate(date: Date): number {
  return 0.15;
}

export const generateReport = async (
    issuedShares: IssuedShare[],
    soldShares: SoldShare[],
    fetchExchangeRate: (date: string, currency: string) => Promise<number>
): Promise<Report> => {
  console.log('Generating report please wait...\n');

  const issuedSharesSortedByDate: IssuedShare[] = _.sortBy(issuedShares, ['vestingDate']);

  const augmentedIssuedShares: (AugmentedIssuedShare &  IssuedShare)[] = [];
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

  const shareGroups: { [grantNumber: string]: AugmentedIssuedShare[] } = _.groupBy(augmentedIssuedShares, 'grantNumber');

  const soldSharesSortedByDate: SoldShare[] = _.sortBy(soldShares, ['orderDate']);

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
      cost: 0,
      gain: 0,
    };

    augmentedSoldShares.push(augmentedTransaction);
  }

  const incomeByYear: { [year: number]: YearlyIncome } = {};
  const gainByYear: { [year: number]: YearlyGain } = {};
  const calculationDetails: { [year: number]: CalculationDetail[] } = {};

  for (const share of augmentedIssuedShares) {
    const year = share.vestingDate.getFullYear();
    if (!incomeByYear[year]) {
      incomeByYear[year] = { total: 0, taxAmount: 0, shares: [] };
    }
    if (!calculationDetails[year]) {
      calculationDetails[year] = [];
    }

    incomeByYear[year].total += share.incomeAmount;
    const taxRate = getIncomeTaxRate(share.vestingDate);
    const taxAmount = round(share.incomeAmount * taxRate);
    incomeByYear[year].taxAmount += taxAmount;
    incomeByYear[year].shares.push(share);

    calculationDetails[year].push({
      type: 'income',
      description: `Income calculation for vested shares on ${share.vestingDate.toISOString().split('T')[0]}`,
      calculation: `(${share.vestedShares} * (${share.stockPrice} - ${share.exercisePrice})) / ${share.exchangeRate}`,
      result: share.incomeAmount
    });

    calculationDetails[year].push({
      type: 'income',
      description: `Tax calculation for income on ${share.vestingDate.toISOString().split('T')[0]}`,
      calculation: `${share.incomeAmount} * ${taxRate}`,
      result: taxAmount
    });
  }

  for (const transaction of augmentedSoldShares) {
    const year = transaction.orderDate.getFullYear();
    if (!gainByYear[year]) {
      gainByYear[year] = { total: 0, taxAmount: 0, transactions: [] };
    }
    if (!calculationDetails[year]) {
      calculationDetails[year] = [];
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
    const taxRate = getGainTaxRate(transaction.orderDate);
    const taxAmount = round(transaction.gain * taxRate);
    gainByYear[year].taxAmount += taxAmount;
    gainByYear[year].transactions.push(transaction);

    calculationDetails[year].push({
      type: 'gain',
      description: `Gain calculation for sold shares on ${transaction.orderDate.toISOString().split('T')[0]}`,
      calculation: `(${transaction.sharesSold} * ${transaction.salePrice} / ${transaction.exchangeRate}) - ${transaction.totalFeesInEur} - (${transaction.sharesSold} * ${transaction.exercisePrice} / ${transaction.exchangeRate})`,
      result: transaction.gain
    });

    calculationDetails[year].push({
      type: 'gain',
      description: `Tax calculation for gain on ${transaction.orderDate.toISOString().split('T')[0]}`,
      calculation: `${transaction.gain} * ${taxRate}`,
      result: taxAmount
    });
  }

  return { incomeByYear, gainByYear, calculationDetails };
};