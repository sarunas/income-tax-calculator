const { round } = require('./round');

const generateTaxFillInstructions = (report, splitGainWithPartner = false) => {
  const currentYear = new Date().getFullYear();
  const years = Object.keys(report.incomeByYear).filter(year => year < currentYear);

  for (const year of years) {
    console.log(year);
    console.log('GPM308P', report.incomeByYear[year].total);
    console.log('GPM308F');
    const f1 = report.gainByYear[year].transactions.reduce((result, transaction) => {
      result += transaction.amount;
      return result;
    }, 0);
    const f2 = report.gainByYear[year].transactions.reduce((result, transaction) => {
      result += transaction.cost;
      result += transaction.totalFeesInEur;
      return result;
    }, 0);

    console.log('F1', (splitGainWithPartner ? round(f1 / 2) : f1) - 500);
    console.log('F2', (splitGainWithPartner ? round(f2 / 2) : f2));
    console.log('---');
  }
};

module.exports = {
  generateTaxFillInstructions
};
