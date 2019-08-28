const moment = require('moment');
const { get } = require('lodash');
const { round } = require('./round');
const _ = require('lodash');

function getIncomeTaxRate(date) {
  if (date.getFullYear() > 2018) {
    return 0.2;
  }
  return 0.15;
}

function getGainTaxRate(date) {
  return 0.15;
}

const generateReport = async (issuedShares, soldShares, fetchExchangeRate) => {
  console.log('Generating report please wait...\n');
  const issuedSharesSortedByDate = _.sortBy(issuedShares, ['vestingDate']);
  for (const share of issuedSharesSortedByDate) {
    const date = moment(share.vestingDate).format('YYYY-MM-DD');
    share.balance = share.vestedShares;
    share.exchangeRate = await fetchExchangeRate(date, 'USD');
    share.cost = round(share.vestedShares * share.stockPrice / share.exchangeRate);
    share.incomeAmount = round(share.vestedShares * (share.stockPrice - share.exercisePrice) / share.exchangeRate);
  }

  const shareGroups = _(issuedSharesSortedByDate)
    .groupBy(item => item.grantNumber)
    .value();

  const soldSharesSortedByDate = _.sortBy(soldShares, ['orderDate']);
  for (const transaction of soldSharesSortedByDate) {
    const date = moment(transaction.orderDate).format('YYYY-MM-DD');
    transaction.exchangeRate = await fetchExchangeRate(date, 'USD');
    transaction.amount = round(transaction.sharesSold * transaction.salePrice / transaction.exchangeRate);
    transaction.totalFeesInEur = round(transaction.totalFees / transaction.exchangeRate);
  }

  // income tax by year
  const incomeByYear = {};
  for (const share of issuedSharesSortedByDate) {
    const year = share.vestingDate.getFullYear();
    if (incomeByYear[year] === undefined) {
      incomeByYear[year] = {
        total: 0,
        taxAmount: 0,
        shares: []
      };
    }

    incomeByYear[year].total += share.incomeAmount;
    incomeByYear[year].taxAmount += round(share.incomeAmount * getIncomeTaxRate(share.vestingDate))
    incomeByYear[year].shares.push(share);
  }

  // profit tax by year
  const gainByYear = {};
  for (const transaction of soldSharesSortedByDate) {
    const year = transaction.orderDate.getFullYear();
    if (gainByYear[year] === undefined) {
      gainByYear[year] = {
        total: 0,
        taxAmount: 0,
        transactions: []
      };
    }

    let gain = transaction.amount - transaction.totalFeesInEur;
    let sharesSold = transaction.sharesSold;

    transaction.cost = 0;
    for (const share of shareGroups[transaction.grantNumber]) {
      
      if (share.balance > 0) {
        if (share.balance > sharesSold) {
          const cost = round(share.cost / share.vestedShares * sharesSold);
          share.balance -= sharesSold;
          transaction.cost += cost;
          gain -= cost;
          sharesSold = 0;
        } else {
          const cost = round(share.cost / share.vestedShares * share.balance);
          sharesSold -= share.balance;
          transaction.cost += cost
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
    gainByYear[year].taxAmount += round(transaction.gain * getGainTaxRate(transaction.orderDate));
    gainByYear[year].transactions.push(transaction);
  }

  const years = Object.keys(incomeByYear);

  for (const year of years) {
    const f1 = get(gainByYear, `[${year}].transactions`, []).reduce(
      (result, transaction) => {
        result += transaction.amount;
        return result;
      },
      0,
    );
    const f2 = get(gainByYear, `[${year}].transactions`, []).reduce(
      (result, transaction) => {
        result += transaction.cost;
        result += transaction.totalFeesInEur;
        return result;
      },
      0,
    );

    gainByYear[year].f1 = f1;
    gainByYear[year].f2 = f2;
  }

  return {
    incomeByYear,
    gainByYear
  };
};

module.exports = {
  generateReport,
};
