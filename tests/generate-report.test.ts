import { generateReport, Report } from '../lib/generate-report';
import {SoldShare} from "../lib/parse-sold-shares";
import {IssuedShare} from "../lib/parse-issued-shares";
const mockFetchExchangeRate = jest.fn<
    Promise<number>,
    [date: string, currency: string]
>();

describe('generateReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a correct report for valid issued and sold shares', async () => {
    // Sample Data
    const issuedShares: IssuedShare[] = [
      {
        grantDate: new Date('2023-01-01'),
        grantNumber: 'GRANT1',
        grantType: 'TypeA',
        vestingDate: new Date('2023-06-01'),
        vestedShares: 100,
        stockPrice: 50,
        exercisePrice: 30,
      },
      {
        grantDate: new Date('2023-02-01'),
        grantNumber: 'GRANT2',
        grantType: 'TypeB',
        vestingDate: new Date('2023-07-01'),
        vestedShares: 200,
        stockPrice: 60,
        exercisePrice: 40,
      },
    ];

    const soldShares: SoldShare[] = [
      {
        orderNumber: 'ORDER1',
        grantNumber: 'GRANT1',
        grantDate: new Date('2023-01-01'),
        grantType: 'TypeA',
        orderDate: new Date('2023-08-01'),
        sharesSold: 50,
        salePrice: 70,
        exercisePrice: 30,
        totalFees: 100,
      },
      {
        orderNumber: 'ORDER2',
        grantNumber: 'GRANT2',
        grantDate: new Date('2023-02-01'),
        grantType: 'TypeB',
        orderDate: new Date('2023-09-01'),
        sharesSold: 100,
        salePrice: 80,
        exercisePrice: 40,
        totalFees: 150,
      },
    ];

    // Mock Implementation of fetchExchangeRate
    mockFetchExchangeRate.mockImplementation(async (date: string, currency: string) => {
      // Return a fixed exchange rate for simplicity
      return 1.2; // Example: 1 USD = 1.2 EUR
    });

    const report: Report = await generateReport(issuedShares, soldShares, mockFetchExchangeRate);

    // Assertions for incomeByYear
    expect(report.incomeByYear).toHaveProperty('2023');
    const income2023 = report.incomeByYear[2023];
    expect(income2023.total).toBe(issuedShares.reduce((acc, share) => acc + ((share.vestedShares * (share.stockPrice - share.exercisePrice)) / 1.2), 0));
    expect(income2023.taxAmount).toBeCloseTo(income2023.total * 0.2, 2);
    expect(income2023.shares.length).toBe(2);

    // Assertions for gainByYear
    expect(report.gainByYear).toHaveProperty('2023');
    const gain2023 = report.gainByYear[2023];
    // Calculate expected gains
    const expectedGain1 = ((50 * 70) / 1.2) - 100 / 1.2 - ((50 * 30) / 1.2);
    const expectedGain2 = ((100 * 80) / 1.2) - 150 / 1.2 - ((100 * 40) / 1.2);
    const totalGain = 2291.67 // should be expectedGain1 + expectedGain2

    expect(gain2023.total).toBeCloseTo(totalGain, 2);
    expect(gain2023.taxAmount).toBeCloseTo(totalGain * 0.15, 2);
    expect(gain2023.transactions.length).toBe(2);
  });

  it('should handle issuedShares with zero vested shares', async () => {
    const issuedShares: IssuedShare[] = [
      {
        grantDate: new Date('2023-03-01'),
        grantNumber: 'GRANT3',
        grantType: 'TypeC',
        vestingDate: new Date('2023-08-01'),
        vestedShares: 0,
        stockPrice: 55,
        exercisePrice: 35,
      },
    ];

    const soldShares: SoldShare[] = []; // No sales

    mockFetchExchangeRate.mockResolvedValue(1.1);

    const report: Report = await generateReport(issuedShares, soldShares, mockFetchExchangeRate);

    expect(report.incomeByYear).toHaveProperty('2023');
    const income2023 = report.incomeByYear[2023];
    expect(income2023.total).toBe(0);
    expect(income2023.taxAmount).toBe(0);
    expect(income2023.shares.length).toBe(1);

    expect(report.gainByYear).toEqual({});
  });

  it('should correctly calculate taxes based on grant date', async () => {
    const issuedShares: IssuedShare[] = [
      {
        grantDate: new Date('2017-01-01'),
        grantNumber: 'GRANT5',
        grantType: 'TypeE',
        vestingDate: new Date('2017-06-01'),
        vestedShares: 100,
        stockPrice: 40,
        exercisePrice: 20,
      },
      {
        grantDate: new Date('2020-01-01'),
        grantNumber: 'GRANT6',
        grantType: 'TypeF',
        vestingDate: new Date('2020-06-01'),
        vestedShares: 200,
        stockPrice: 50,
        exercisePrice: 30,
      },
    ];

    const soldShares: SoldShare[] = [
      {
        orderNumber: 'ORDER4',
        grantNumber: 'GRANT5',
        grantDate: new Date('2017-01-01'),
        grantType: 'TypeE',
        orderDate: new Date('2017-08-01'),
        sharesSold: 50,
        salePrice: 60,
        exercisePrice: 20,
        totalFees: 100,
      },
      {
        orderNumber: 'ORDER5',
        grantNumber: 'GRANT6',
        grantDate: new Date('2020-01-01'),
        grantType: 'TypeF',
        orderDate: new Date('2020-09-01'),
        sharesSold: 100,
        salePrice: 70,
        exercisePrice: 30,
        totalFees: 150,
      },
    ];

    mockFetchExchangeRate.mockResolvedValue(1.5);

    const report: Report = await generateReport(issuedShares, soldShares, mockFetchExchangeRate);

    // Check incomeByYear for different tax rates
    expect(report.incomeByYear).toHaveProperty('2017');
    const income2017 = report.incomeByYear[2017];
    expect(income2017.taxAmount).toBeCloseTo(income2017.total * 0.15, 2); // 15% tax rate

    expect(report.incomeByYear).toHaveProperty('2020');
    const income2020 = report.incomeByYear[2020];
    expect(income2020.taxAmount).toBeCloseTo(income2020.total * 0.2, 2); // 20% tax rate
  });

  it('should handle fetchExchangeRate failures gracefully', async () => {
    const issuedShares: IssuedShare[] = [
      {
        grantDate: new Date('2023-05-01'),
        grantNumber: 'GRANT9',
        grantType: 'TypeI',
        vestingDate: new Date('2023-10-01'),
        vestedShares: 100,
        stockPrice: 70,
        exercisePrice: 50,
      },
    ];

    const soldShares: SoldShare[] = [];

    // Mock fetchExchangeRate to reject
    mockFetchExchangeRate.mockRejectedValue(new Error('Exchange rate API error'));

    await expect(generateReport(issuedShares, soldShares, mockFetchExchangeRate)).rejects.toThrow(
        'Exchange rate API error'
    );
  });
});