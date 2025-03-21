import { describe, expect, it } from "vitest";
import { generateReport } from "./generate-report";
import { parseIssuedShares } from "./parse-issued-shares";
import { parseSoldShares } from "./parse-sold-shares";

describe(generateReport, () => {
  it("it should exclude options from income", async () => {
    const issuedSharesContent = `01/01/2020 1111 RSU 01/06/2020 10 100.00 $ 0.00 $
01/01/2020 1111 RSU 01/06/2023 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2020 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2023 10 100.00 $ 0.00 $`;

    const issuedShares = parseIssuedShares(issuedSharesContent);

    const report = await generateReport(issuedShares, [], () => Promise.resolve(1));
    expect(report).toEqual({
      incomeByYear: {
        2020: {
          total: 2000,
          shares: [
            {
              vesting: {
                grantDate: new Date("2020-01-01T00:00:00.000Z"),
                grantNumber: "1111",
                grantType: "RSU",
                vestingDate: new Date("2020-06-01T00:00:00.000Z"),
                vestedShares: 10,
                stockPrice: 100,
                exercisePrice: 0,
              },
              balance: 10,
              exchangeRate: 1,
              cost: 1000,
              incomeAmount: 1000,
            },
            {
              vesting: {
                grantDate: new Date("2020-02-02T00:00:00.000Z"),
                grantNumber: "2222",
                grantType: "RSU",
                vestingDate: new Date("2020-06-01T00:00:00.000Z"),
                vestedShares: 10,
                stockPrice: 100,
                exercisePrice: 0,
              },
              balance: 10,
              exchangeRate: 1,
              cost: 1000,
              incomeAmount: 1000,
            },
          ],
        },
        2023: {
          total: 1000,
          shares: [
            {
              vesting: {
                grantDate: new Date("2020-01-01T00:00:00.000Z"),
                grantNumber: "1111",
                grantType: "RSU",
                vestingDate: new Date("2023-06-01T00:00:00.000Z"),
                vestedShares: 10,
                stockPrice: 100,
                exercisePrice: 0,
              },
              balance: 10,
              exchangeRate: 1,
              cost: 1000,
              incomeAmount: 1000,
            },
          ],
        },
      },
      gainByYear: {},
    });
  });

  it("should calculate both income and gains correctly", async () => {
    const issuedSharesContent = `01/01/2020 1111 RSU 01/06/2020 10 100.00 $ 0.00 $`;
    const soldSharesContent = `123456 Sell of Stock 1111 01/01/2020 RSU 01/07/2020 5 120.00 $ 0.00 $ 10.00 $`;

    const issuedShares = parseIssuedShares(issuedSharesContent);
    const soldShares = parseSoldShares(soldSharesContent);

    const report = await generateReport(issuedShares, soldShares, () => Promise.resolve(1));

    // Verify income calculation
    expect(report.incomeByYear[2020].total).toBe(1000); // 10 shares * (100 - 0) / 1
    expect(report.incomeByYear[2020].shares).toHaveLength(1);
    expect(report.incomeByYear[2020].shares[0].incomeAmount).toBe(1000);

    // Verify gain calculation
    expect(report.gainByYear[2020].total).toBe(90); // (5 * 120 - 10) - (5 * 100) = 600 - 10 - 500 = 90
    expect(report.gainByYear[2020].transactions).toHaveLength(1);
    const sale = report.gainByYear[2020].transactions[0];
    expect(sale.amount).toBe(600); // 5 * 120 / 1
    expect(sale.totalFeesInEur).toBe(10); // 10 / 1
    expect(sale.cost).toBe(500); // 5 * 100 / 1
    expect(sale.gain).toBe(90); // 600 - 10 - 500

    // Verify remaining balance
    expect(report.incomeByYear[2020].shares[0].balance).toBe(5); // 10 - 5
  });

  it("should throw error when trying to sell more shares than available", async () => {
    const issuedSharesContent = `01/01/2020 1111 RSU 01/06/2020 10 100.00 $ 0.00 $
01/01/2020 1111 RSU 01/06/2021 10 100.00 $ 0.00 $`;

    const soldSharesContent = `123456 Sell of Stock 1111 01/01/2020 RSU 01/07/2020 25 120.00 $ 0.00 $ 10.00 $`;

    const issuedShares = parseIssuedShares(issuedSharesContent);
    const soldShares = parseSoldShares(soldSharesContent);

    await expect(generateReport(issuedShares, soldShares, () => Promise.resolve(1))).rejects.toThrow(
      "Not enough shares available for grant 1111. Attempted to sell 25 shares but only 20 were available."
    );
  });
}); 