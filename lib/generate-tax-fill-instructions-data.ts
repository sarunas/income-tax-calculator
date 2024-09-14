// lib/generate-tax-fill-instructions-data.ts
import { get, uniq, concat, keys } from 'lodash';
import { round } from './round';
import { Report } from './generate-report';

export interface TaxInstructions {
  [year: string]: {
    heading: string;
    fields: Array<{
      name: string;
      value?: number;
      subfields?: Array<{
        name: string;
        value: number;
      }>;
    }>;
  };
}

export const generateTaxFillInstructionsData = (report: Report, splitGainWithPartner: boolean = false): TaxInstructions => {
  const currentYear: number = new Date().getFullYear();
  const years: string[] = uniq(concat(keys(report.incomeByYear), keys(report.gainByYear))).sort();
  const instructions: TaxInstructions = {};

  years.forEach((year: string) => {
    instructions[year] = {
      heading: year == currentYear.toString() ? 'Preliminary Tax Declaration of ' : 'Tax Declaration of ' + year,
      fields: []
    };
    instructions[year].fields[0] = {
      name: 'GPM308P',
      value: get(report.incomeByYear, `[${year}].total`, 0),
    };

    const f1: number = get(report.gainByYear, `[${year}].transactions`, []).reduce((result: number, transaction: any) => {
      result += transaction.amount;
      return result;
    }, 0);

    const f2: number = get(report.gainByYear, `[${year}].transactions`, []).reduce((result: number, transaction: any) => {
      result += transaction.cost;
      result += transaction.totalFeesInEur;
      return result;
    }, 0);

    const finalF1: number = splitGainWithPartner ? round(f1 / 2) : f1;
    const finalF2: number = splitGainWithPartner ? round(f2 / 2) : f2;

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
  });

  return instructions;
};
