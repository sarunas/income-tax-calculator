import { describe, expect, it } from "vitest";
import { generateReport } from "./generate-report";
import { parseIssuedShares } from "./parse-issued-shares";
import { parseSoldShares } from "./parse-sold-shares";
import { parseSameDayShares } from "./parse-same-day-shares";

describe(generateReport, () => {
  it("it should exclude options from income", async () => {
    const issuedSharesContent = `01/01/2020 1111 RSU 01/06/2020 10 100.00 $ 0.00 $
01/01/2020 1111 RSU 01/06/2023 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2020 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2023 10 100.00 $ 0.00 $`;

    const issuedShares = parseIssuedShares(issuedSharesContent);

    const report = await generateReport(issuedShares, [], () => Promise.resolve(1));
    expect(report).toEqual({
      shareBalancesByGrant: {
        "1111": [
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
            remainingShares: 10,
          },
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
            remainingShares: 10,
          },
        ],
        "2222": [
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
            remainingShares: 10,
          },
          {
            vesting: {
              grantDate: new Date("2020-02-02T00:00:00.000Z"),
              grantNumber: "2222",
              grantType: "RSU",
              vestingDate: new Date("2023-06-01T00:00:00.000Z"),
              vestedShares: 10,
              stockPrice: 100,
              exercisePrice: 0,
            },
            remainingShares: 10,
          },
        ],
      },
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
    expect(report.shareBalancesByGrant["1111"][0].remainingShares).toBe(5); // 10 - 5
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

  it('should work with same day sells', async () => {
    const soldSharesContent = `5191057 Same Day Sell 131168 8/11/2021 RSU 22/11/2024 100 215.49 $ 0.00 $ 10 $`;

    const issuedShares = parseIssuedShares('');
    const soldShares = parseSoldShares(soldSharesContent);
    const sameDayShares = parseSameDayShares(soldSharesContent);

    sameDayShares.forEach((entry) =>
      issuedShares.push({
        grantDate: entry.grantDate,
        grantNumber: entry.grantNumber,
        grantType: entry.grantType,
        vestingDate: entry.orderDate,
        vestedShares: entry.sharesSold,
        stockPrice: entry.salePrice,
        exercisePrice: entry.exercisePrice,
      }),
    );

    const report = await generateReport(issuedShares, soldShares, () => Promise.resolve(1));

    expect(report.incomeByYear).toEqual({});

    expect(report.gainByYear[2024].total).toBe(21539);
    expect(report.gainByYear[2024].transactions).toHaveLength(1);
    
    const sale = report.gainByYear[2024].transactions[0];

    expect(sale.amount).toBe(21549);
    expect(sale.cost).toBe(0);
    expect(sale.gain).toBe(21539);
  });

  it('should make balance calculations in FIFO order', async () => {
    const issuedSharesContent = `8/11/2021 131168 RSU 8/2/2022 10 118.47 $ 0.00 $
8/11/2021 131168 RSU 8/5/2022 10 71.95 $ 0.00 $
8/11/2021 131168 RSU 8/8/2022 11 72.48 $ 0.00 $
8/11/2021 131168 RSU 8/11/2022 10 69.71 $ 0.00 $`;

    const soldSharesContent = `3813190 Sell of Restricted Stock 131168 8/11/2021 RSU 19/5/2022 20 68.01 $ 0.00 $ 10 $
4624511 Sell of Restricted Stock 131168 8/11/2021 RSU 14/12/2023 11 113.05 $ 0.00 $ 10 $
4761074 Sell of Restricted Stock 131168 8/11/2021 RSU 28/02/2024 10 139.21 $ 0.00 $ 10 $
5191057 Same Day Sell 131168 8/11/2021 RSU 22/11/2024 100 215.49 $ 0.00 $ 10 $`;

    const issuedShares = parseIssuedShares(issuedSharesContent);
    const soldShares = parseSoldShares(soldSharesContent);
    const sameDayShares = parseSameDayShares(soldSharesContent);

    sameDayShares.forEach((entry) =>
        issuedShares.push({
          grantDate: entry.grantDate,
          grantNumber: entry.grantNumber,
          grantType: entry.grantType,
          vestingDate: entry.orderDate,
          vestedShares: entry.sharesSold,
          stockPrice: entry.salePrice,
          exercisePrice: entry.exercisePrice,
        }),
    );

    const report = await generateReport(issuedShares, soldShares, () => Promise.resolve(1));

    expect(report.shareBalancesByGrant["131168"][0].remainingShares).toBe(0);
    expect(report.shareBalancesByGrant["131168"][1].remainingShares).toBe(0);
    expect(report.shareBalancesByGrant["131168"][2].remainingShares).toBe(0);
    expect(report.shareBalancesByGrant["131168"][3].remainingShares).toBe(0);
    expect(report.shareBalancesByGrant["131168"][4].remainingShares).toBe(0);
  });
}); 