const { get } = require('lodash');
const { round } = require('./round');

const generateTaxFillInstructions = (report, splitGainWithPartner = false) => {
  const currentYear = new Date().getFullYear();
  const years = Object.keys(report.incomeByYear).filter(year => year < currentYear);

  for (const year of years) {
    console.log(year);
    console.log('GPM308P', report.incomeByYear[year].total);
    const f1 = get(report.gainByYear, `[${year}].transactions`, []).reduce((result, transaction) => {
      result += transaction.amount;
      return result;
    }, 0);
    const f2 = get(report.gainByYear, `[${year}].transactions`, []).reduce((result, transaction) => {
      result += transaction.cost;
      result += transaction.totalFeesInEur;
      return result;
    }, 0);

    const finalF1 = splitGainWithPartner ? round(f1 / 2) : f1;
    const finalF2 = splitGainWithPartner ? round(f2 / 2) : f2;

    if (finalF1 > 0 || finalF2 > 0) {
      console.log('GPM308F');
      console.log('F1', finalF1);
      console.log('F2', finalF2);
      console.log('F4', Math.max(finalF1 - finalF2 - 500, 0));
    }
    console.log('---');
  }
};

module.exports = {
  generateTaxFillInstructions
};
