import { describe, expect, it } from "vitest";
import { generateTaxFillInstructionsData } from "./generate-tax-fill-instructions-data";
import type { Report } from "./types";

describe("generateTaxFillInstructionsData", () => {
  const currentYear = new Date().getFullYear();

  it("should generate tax instructions for income only", () => {
    const report: Report = {
      shareBalancesByGrant: {},
      incomeByYear: {
        2020: {
          total: 1000,
          shares: [],
        },
      },
      gainByYear: {},
    };

    const result = generateTaxFillInstructionsData(report);

    expect(result).toEqual({
      2020: {
        heading: "Tax Declaration of 2020",
        fields: [
          {
            name: "GPM308P",
            value: 1000,
          },
        ],
      },
    });
  });

  it("should generate tax instructions for gains only", () => {
    const report: Report = {
      shareBalancesByGrant: {},
      incomeByYear: {},
      gainByYear: {
        2020: {
          total: 500,
          transactions: [
            {
              sale: {
                orderNumber: "123",
                grantNumber: "GRANT1",
                grantDate: new Date("2020-01-01"),
                grantType: "ESPP",
                orderDate: new Date("2020-12-31"),
                sharesSold: 10,
                salePrice: 100,
                exercisePrice: 50,
                totalFees: 10,
              },
              exchangeRate: 1,
              amount: 1000,
              totalFeesInEur: 10,
              cost: 500,
              gain: 490,
            },
          ],
        },
      },
    };

    const result = generateTaxFillInstructionsData(report);

    expect(result).toEqual({
      2020: {
        heading: "Tax Declaration of 2020",
        fields: [
          {
            name: "GPM308P",
            value: 0,
          },
          {
            name: "GPM308F",
            subfields: [
              {
                name: "F1",
                value: 1000,
              },
              {
                name: "F2",
                value: 510,
              },
              {
                name: "F4",
                value: 0, // 1000 - 510 - 500 = -10, but minimum is 0
              },
            ],
          },
        ],
      },
    });
  });

  it("should generate tax instructions for both income and gains", () => {
    const report: Report = {
      shareBalancesByGrant: {},
      incomeByYear: {
        2020: {
          total: 1000,
          shares: [],
        },
      },
      gainByYear: {
        2020: {
          total: 500,
          transactions: [
            {
              sale: {
                orderNumber: "123",
                grantNumber: "GRANT1",
                grantDate: new Date("2020-01-01"),
                grantType: "ESPP",
                orderDate: new Date("2020-12-31"),
                sharesSold: 10,
                salePrice: 100,
                exercisePrice: 50,
                totalFees: 10,
              },
              exchangeRate: 1,
              amount: 1000,
              totalFeesInEur: 10,
              cost: 500,
              gain: 490,
            },
          ],
        },
      },
    };

    const result = generateTaxFillInstructionsData(report);

    expect(result).toEqual({
      2020: {
        heading: "Tax Declaration of 2020",
        fields: [
          {
            name: "GPM308P",
            value: 1000,
          },
          {
            name: "GPM308F",
            subfields: [
              {
                name: "F1",
                value: 1000,
              },
              {
                name: "F2",
                value: 510,
              },
              {
                name: "F4",
                value: 0,
              },
            ],
          },
        ],
      },
    });
  });

  it("should handle splitting gains with partner", () => {
    const report: Report = {
      shareBalancesByGrant: {},
      incomeByYear: {},
      gainByYear: {
        2020: {
          total: 1000,
          transactions: [
            {
              sale: {
                orderNumber: "123",
                grantNumber: "GRANT1",
                grantDate: new Date("2020-01-01"),
                grantType: "ESPP",
                orderDate: new Date("2020-12-31"),
                sharesSold: 10,
                salePrice: 100,
                exercisePrice: 50,
                totalFees: 10,
              },
              exchangeRate: 1,
              amount: 1000,
              totalFeesInEur: 10,
              cost: 500,
              gain: 490,
            },
          ],
        },
      },
    };

    const result = generateTaxFillInstructionsData(report, true);

    expect(result).toEqual({
      2020: {
        heading: "Tax Declaration of 2020",
        fields: [
          {
            name: "GPM308P",
            value: 0,
          },
          {
            name: "GPM308F",
            subfields: [
              {
                name: "F1",
                value: 500, // Split 1000/2
              },
              {
                name: "F2",
                value: 255, // Split 510/2
              },
              {
                name: "F4",
                value: 0,
              },
            ],
          },
        ],
      },
    });
  });

  it("should handle current year with different heading", () => {
    const report: Report = {
      shareBalancesByGrant: {},
      incomeByYear: {
        [currentYear]: {
          total: 1000,
          shares: [],
        },
      },
      gainByYear: {},
    };

    const result = generateTaxFillInstructionsData(report);

    expect(result[currentYear].heading).toBe("Preliminary Tax Declaration of ");
  });
}); 