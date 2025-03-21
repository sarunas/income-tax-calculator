import { get, uniq, concat, keys } from "lodash";
import { round } from "./round";

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

interface TaxField {
  name: string;
  value?: number;
  subfields?: {
    name: string;
    value: number;
  }[];
}

interface YearInstructions {
  heading: string;
  fields: TaxField[];
}

interface TaxInstructions {
  [year: number]: YearInstructions;
}

export const generateTaxFillInstructionsData = (
  report: Report,
  splitGainWithPartner = false
): TaxInstructions => {
  const currentYear = new Date().getFullYear();
  const years = uniq(concat(keys(report.incomeByYear), keys(report.gainByYear))).sort().map(Number);
  const instructions: TaxInstructions = {};

  for (const year of years) {
    instructions[year] = {
      heading: year === currentYear ? "Preliminary Tax Declaration of " : "Tax Declaration of " + year,
      fields: [],
    };

    instructions[year].fields[0] = {
      name: "GPM308P",
      value: get(report.incomeByYear, `[${year}].total`, 0),
    };

    const f1 = get(report.gainByYear, `[${year}].transactions`, []).reduce((result: number, transaction) => {
      result += transaction.amount!;
      return result;
    }, 0);

    const f2 = get(report.gainByYear, `[${year}].transactions`, []).reduce((result: number, transaction) => {
      result += transaction.cost!;
      result += transaction.totalFeesInEur!;
      return result;
    }, 0);

    const finalF1 = splitGainWithPartner ? round(f1 / 2) : f1;
    const finalF2 = splitGainWithPartner ? round(f2 / 2) : f2;

    if (finalF1 > 0 || finalF2 > 0) {
      instructions[year].fields[1] = {
        name: "GPM308F",
        subfields: [
          {
            name: "F1",
            value: finalF1,
          },
          {
            name: "F2",
            value: finalF2,
          },
          {
            name: "F4",
            value: round(Math.max(finalF1 - finalF2 - 500, 0)),
          },
        ],
      };
    }
  }

  return instructions;
}; 