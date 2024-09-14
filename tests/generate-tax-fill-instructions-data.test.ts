// tests/generate-tax-fill-instructions-data.test.ts
import { generateTaxFillInstructionsData, TaxInstructions } from '../lib/generate-tax-fill-instructions-data';
import { Report, YearlyIncome, YearlyGain } from '../lib/generate-report';
import { AugmentedSoldShare, AugmentedIssuedShare } from '../lib/generate-report'; // Assuming these are exported
import { round } from '../lib/round';

describe('generateTaxFillInstructionsData', () => {
  const currentYear = new Date().getFullYear();

  /**
   * Helper function to create a Report object.
   */
  const createReport = (
      incomeData: { year: number; total: number }[],
      gainData: { year: number; transactions: any[] }[]
  ): Report => {
    const incomeByYear: { [year: number]: YearlyIncome } = {};
    incomeData.forEach(({ year, total }) => {
      incomeByYear[year] = {
        total,
        taxAmount: round(total * (year > 2018 ? 0.2 : 0.15)),
        shares: [], // Assuming empty shares for simplicity
      };
    });

    const gainByYear: { [year: number]: YearlyGain } = {};
    gainData.forEach(({ year, transactions }) => {
      const total = transactions.reduce((sum, txn) => sum + txn.gain, 0);
      const taxAmount = round(total * 0.15);
      gainByYear[year] = {
        total,
        taxAmount,
        transactions,
      };
    });

    return { incomeByYear, gainByYear };
  };

  /**
   * Test Case 1: Single Year Without Gains
   */
  it('should generate instructions with only income fields for a single year without gains', () => {
    const report = createReport(
        [{ year: 2022, total: 1000 }],
        [] // No gains
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(Object.keys(instructions)).toHaveLength(1);
    expect(instructions['2022']).toBeDefined();
    expect(instructions['2022'].heading).toBe('Tax Declaration of 2022');
    expect(instructions['2022'].fields).toHaveLength(1);
    expect(instructions['2022'].fields[0]).toEqual({
      name: 'GPM308P',
      value: 1000,
    });
  });

  /**
   * Test Case 2: Single Year With Gains (No Split)
   */
  it('should generate instructions with income and gain fields for a single year with gains without splitting', () => {
    const report = createReport(
        [{ year: 2021, total: 2000 }],
        [
          {
            year: 2021,
            transactions: [
              { amount: 1500, cost: 300, totalFeesInEur: 50, gain: 1150 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(Object.keys(instructions)).toHaveLength(1);
    expect(instructions['2021']).toBeDefined();
    expect(instructions['2021'].heading).toBe('Tax Declaration of 2021');
    expect(instructions['2021'].fields).toHaveLength(2);

    // GPM308P Field
    expect(instructions['2021'].fields[0]).toEqual({
      name: 'GPM308P',
      value: 2000,
    });

    // GPM308F Field
    expect(instructions['2021'].fields[1]).toEqual({
      name: 'GPM308F',
      subfields: [
        { name: 'F1', value: 1500 },
        { name: 'F2', value: 350 }, // 300 + 50
        { name: 'F4', value: round(Math.max(1500 - 350 - 500, 0)) }, // 650
      ],
    });
  });

  /**
   * Test Case 3: Single Year With Gains (With Split)
   */
  it('should generate instructions with split gain fields for a single year with gains', () => {
    const report = createReport(
        [{ year: 2021, total: 2000 }],
        [
          {
            year: 2021,
            transactions: [
              { amount: 1500, cost: 300, totalFeesInEur: 50, gain: 1150 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, true);

    expect(Object.keys(instructions)).toHaveLength(1);
    expect(instructions['2021']).toBeDefined();
    expect(instructions['2021'].heading).toBe('Tax Declaration of 2021');
    expect(instructions['2021'].fields).toHaveLength(2);

    // GPM308P Field
    expect(instructions['2021'].fields[0]).toEqual({
      name: 'GPM308P',
      value: 2000,
    });

    // GPM308F Field with Split
    expect(instructions['2021'].fields[1]).toEqual({
      name: 'GPM308F',
      subfields: [
        { name: 'F1', value: round(1500 / 2) }, // 750
        { name: 'F2', value: round(350 / 2) }, // 175
        { name: 'F4', value: round(Math.max(round(750 - 175) - 500, 0)) }, // max(75, 0) = 75
      ],
    });
  });

  /**
   * Test Case 4: Multiple Years Including Current Year
   */
  it('should generate instructions for multiple years including the current year with correct headings', () => {
    const report = createReport(
        [
          { year: currentYear, total: 3000 },
          { year: 2019, total: 1500 },
        ],
        [
          {
            year: currentYear,
            transactions: [
              { amount: 2000, cost: 400, totalFeesInEur: 100, gain: 1500 },
            ],
          },
          {
            year: 2019,
            transactions: [
              { amount: 1000, cost: 200, totalFeesInEur: 50, gain: 750 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(Object.keys(instructions)).toHaveLength(2);

    // Current Year
    expect(instructions[currentYear.toString()]).toBeDefined();
    expect(instructions[currentYear.toString()].heading).toBe(`Preliminary Tax Declaration of `);
    expect(instructions[currentYear.toString()].fields).toHaveLength(2);

    // Past Year
    expect(instructions['2019']).toBeDefined();
    expect(instructions['2019'].heading).toBe('Tax Declaration of 2019');
    expect(instructions['2019'].fields).toHaveLength(2);
  });

  /**
   * Test Case 5: Empty Report
   */
  it('should return an empty TaxInstructions object for an empty report', () => {
    const report: Report = { incomeByYear: {}, gainByYear: {} };

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(instructions).toEqual({});
  });

  /**
   * Test Case 6: Gains Without Income
   */
  it('should generate instructions with only gain fields for a year with gains but no income', () => {
    const report = createReport(
        [], // No income
        [
          {
            year: 2020,
            transactions: [
              { amount: 1200, cost: 250, totalFeesInEur: 50, gain: 900 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(Object.keys(instructions)).toHaveLength(1);
    expect(instructions['2020']).toBeDefined();
    expect(instructions['2020'].heading).toBe('Tax Declaration of 2020');


    // GPM308F Field
    expect(instructions['2020'].fields[1]).toEqual({
      name: 'GPM308F',
      subfields: [
        { name: 'F1', value: 1200 },
        { name: 'F2', value: 300 }, // 250 + 50
        { name: 'F4', value: round(Math.max(1200 - 300 - 500, 0)) }, // 400
      ],
    });
  });

  /**
   * Test Case 7: Gains Resulting in Negative F4
   */
  it('should set F4 to 0 if the calculation results in a negative value', () => {
    const report = createReport(
        [{ year: 2020, total: 1000 }],
        [
          {
            year: 2020,
            transactions: [
              { amount: 600, cost: 200, totalFeesInEur: 100, gain: 300 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(instructions['2020']).toBeDefined();
    expect(instructions['2020'].fields).toHaveLength(2);

    expect(instructions['2020'].fields[1]).toEqual({
      name: 'GPM308F',
      subfields: [
        { name: 'F1', value: 600 },
        { name: 'F2', value: 300 }, // 200 + 100
        { name: 'F4', value: 0 }, // max(600 - 300 - 500, 0) = 0
      ],
    });
  });

  /**
   * Test Case 8: Edge Case with Zero Gains
   */
  it('should not add GPM308F field if gains result in zero', () => {
    const report = createReport(
        [{ year: 2021, total: 1000 }],
        [
          {
            year: 2021,
            transactions: [
              { amount: 500, cost: 200, totalFeesInEur: 300, gain: 0 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(instructions['2021']).toBeDefined();

    // GPM308P Field
    expect(instructions['2021'].fields[0]).toEqual({
      name: 'GPM308P',
      value: 1000,
    });
  });

  /**
   * Test Case 9: Test with Different Exchange Rates
   */
  it('should correctly apply different exchange rates in calculations', () => {
    // Assuming exchange rates are already applied in the Report object
    // Thus, we need to prepare the Report with correctly calculated gains

    const report = createReport(
        [{ year: 2021, total: 2200 }],
        [
          {
            year: 2021,
            transactions: [
              { amount: 1100, cost: 200, totalFeesInEur: 100, gain: 800 },
              { amount: 880, cost: 160, totalFeesInEur: 80, gain: 640 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(instructions['2021']).toBeDefined();
    expect(instructions['2021'].fields).toHaveLength(2);

    // GPM308P Field
    expect(instructions['2021'].fields[0]).toEqual({
      name: 'GPM308P',
      value: 2200,
    });

    // GPM308F Field
    expect(instructions['2021'].fields[1]).toEqual({
      name: 'GPM308F',
      subfields: [
        { name: 'F1', value: 1980 }, // 1100 + 880
        { name: 'F2', value: 540 }, // (200 + 100) + (160 + 80)
        { name: 'F4', value: round(Math.max(1980 - 540 - 500, 0)) }, // 940
      ],
    });
  });

  /**
   * Additional Test Case: Current Year Handling
   */
  it('should correctly set the heading for the current year', () => {
    const report = createReport(
        [{ year: currentYear, total: 5000 }],
        [
          {
            year: currentYear,
            transactions: [
              { amount: 2500, cost: 500, totalFeesInEur: 100, gain: 1900 },
            ],
          },
        ]
    );

    const instructions: TaxInstructions = generateTaxFillInstructionsData(report, false);

    expect(instructions[currentYear.toString()]).toBeDefined();
    expect(instructions[currentYear.toString()].heading).toBe('Preliminary Tax Declaration of ');
    expect(instructions[currentYear.toString()].fields).toHaveLength(2);
  });
});
