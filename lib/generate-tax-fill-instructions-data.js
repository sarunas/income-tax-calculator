const { get } = require('lodash');
const { round } = require('./round');

const generateTaxFillInstructionsData = (report, splitGainWithPartner = false) => {
  const currentYear = new Date().getFullYear();
  const years = Object.keys(report.incomeByYear);
  const instructions = {};

  for (const year of years) {
    instructions[year] = {};
    instructions[year].heading = year == currentYear ? 'Preliminary Tax Declaration of ' : 'Tax Declaration of ' + year;
    instructions[year].fields = [];
    instructions[year].fields[0] = {
      name: 'GPM308P',
      value: report.incomeByYear[year].total
    };

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
      instructions[year].fields[1] = {
        name: 'GPM308F',
        subfields: [
          {
            name: 'F1',
            value: finalF1
          },
          {
            name: 'F2',
            value: finalF2
          },
          {
            name: 'F4',
            value: round(Math.max(finalF1 - finalF2 - 500, 0))
          }
        ]
      };
    }
  }
  
  return instructions;
};

module.exports = {
  generateTaxFillInstructionsData
};
