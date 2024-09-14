import { Report,  AugmentedSoldShare } from '../lib/generate-report';
import { get, uniq, concat, keys } from 'lodash';
import { round } from '../lib/round';
import {generateTaxFillInstructionsData} from "../lib/generate-tax-fill-instructions-data";

/**
 * TaxInstructions interface defines the structure of the tax instructions data.
 */
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

describe('generateTaxFillInstructionsData', () => {
  it('should handle an empty report', () => {
    const report: Report = {
      incomeByYear: {},
      gainByYear: {},
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {};
    const result = generateTaxFillInstructionsData(report, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should handle a single year with income only', () => {
    const report: Report = {
      incomeByYear: {
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {},
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should handle a single year with gain only', () => {
    const report  = {
      incomeByYear: {},
      gainByYear: {
        2023: {
          total: 10000,
          taxAmount: 2000,
          transactions: [
            { exchangeRate: 1.2, amount: 10000, totalFeesInEur: 300, cost: 2000, gain: 7700 }
          ]
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 0 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 10000 },
              { name: "F2", value: 2300 },
              { name: "F4", value: 7200 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should correctly set headings for the current year vs. past year', () => {
    const currentYear = new Date().getFullYear();
    const report  = {
      incomeByYear: {
        [currentYear]: { total: 60000, taxAmount: 12000, shares: [] },
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {},
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 }
        ]
      },
      [currentYear.toString()]: {
        heading: "Preliminary Tax Declaration of ",
        fields: [
          { name: "GPM308P", value: 60000 }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should correctly split gain with partner when splitGainWithPartner is true', () => {
    const report = {
      incomeByYear: {
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {
        2023: {
          total: 10001,
          taxAmount: 2002,
          transactions: [
            { exchangeRate: 1.1, amount: 10001, totalFeesInEur: 301, cost: 2001, gain: 7700 }
          ]
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = true;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 5000.5 },
              { name: "F2", value: 1151 },
              { name: "F4", value: 3349.5 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should not split gain when splitGainWithPartner is false', () => {
    const report = {
      incomeByYear: {
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {
        2023: {
          total: 10000,
          taxAmount: 2000,
          transactions: [
            { exchangeRate: 1.2, amount: 10000, totalFeesInEur: 300, cost: 2000, gain: 7700 }
          ]
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 10000 },
              { name: "F2", value: 2300 },
              { name: "F4", value: 7200 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should handle missing values gracefully', () => {
    const report  = {
      incomeByYear: {
        2022: { total: 45000, taxAmount: 9000, shares: [] }
      },
      gainByYear: {
        2023: {
          total: 7000,
          taxAmount: 1400,
          transactions: [
            { exchangeRate: 1.1, amount: 7000, totalFeesInEur: 200, cost: 1500, gain: 5300 }
          ]
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2022": {
        heading: "Tax Declaration of 2022",
        fields: [
          { name: "GPM308P", value: 45000 }
        ]
      },
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 0 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 7000 },
              { name: "F2", value: 1700 },
              { name: "F4", value: 4800 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as unknown as Report, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should handle edge case with negative F4 value correctly', () => {
    const report  = {
      incomeByYear: {
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {
        2023: {
          total: 600,
          taxAmount: 120,
          transactions: [
            { exchangeRate: 1.1, amount: 600, totalFeesInEur: 500, cost: 200, gain: -100 }
          ]
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 600 },
              { name: "F2", value: 700 },
              { name: "F4", value: 0 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });

  it('should handle a large number of transactions efficiently', () => {
    const transactions = Array.from({ length: 1000 }, () => ({
      exchangeRate: 1.1,
      amount: 1000,
      totalFeesInEur: 30,
      cost: 200,
      gain: 770
    }));

    const report  = {
      incomeByYear: {
        2023: { total: 50000, taxAmount: 10000, shares: [] }
      },
      gainByYear: {
        2023: {
          total: 1000000,
          taxAmount: 200000,
          transactions
        }
      },
      calculationDetails: {}
    };
    const splitGainWithPartner = false;
    const expected = {
      "2023": {
        heading: "Tax Declaration of 2023",
        fields: [
          { name: "GPM308P", value: 50000 },
          {
            name: "GPM308F",
            subfields: [
              { name: "F1", value: 1000000 },
              { name: "F2", value: 230000 },
              { name: "F4", value: 769500 }
            ]
          }
        ]
      }
    };
    const result = generateTaxFillInstructionsData(report as any, splitGainWithPartner);
    expect(result).toEqual(expected);
  });
});
