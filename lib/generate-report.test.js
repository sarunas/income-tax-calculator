const {generateReport} = require('./generate-report');
const {parseIssuedShares} = require('./parse-issued-shares');

describe(generateReport, () => {
    it('it should exclude options from income', async () => {
        const issuedSharesContent = `01/01/2020 1111 RSU 01/06/2020 10 100.00 $ 0.00 $
01/01/2020 1111 RSU 01/06/2023 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2020 10 100.00 $ 0.00 $
02/02/2020 2222 RSU 01/06/2023 10 100.00 $ 0.00 $`;

        const issuedShares = parseIssuedShares(issuedSharesContent);

        const report = await generateReport(issuedShares, [], () => 1);
        expect(report).toEqual({
                "incomeByYear": {
                    "2020": {
                        "total": 2000,
                        "shares": [{
                            "grantDate": new Date("2020-01-01T00:00:00.000Z"),
                            "grantNumber": "1111",
                            "grantType": "RSU",
                            "vestingDate": new Date("2020-06-01T00:00:00.000Z"),
                            "vestedShares": 10,
                            "stockPrice": 100,
                            "exercisePrice": 0,
                            "balance": 10,
                            "exchangeRate": 1,
                            "cost": 1000,
                            "incomeAmount": 1000
                        }, {
                            "grantDate": new Date("2020-02-02T00:00:00.000Z"),
                            "grantNumber": "2222",
                            "grantType": "RSU",
                            "vestingDate": new Date("2020-06-01T00:00:00.000Z"),
                            "vestedShares": 10,
                            "stockPrice": 100,
                            "exercisePrice": 0,
                            "balance": 10,
                            "exchangeRate": 1,
                            "cost": 1000,
                            "incomeAmount": 1000
                        }]
                    },
                    "2023": {
                        "total": 1000,
                        "shares": [{
                            "grantDate": new Date("2020-01-01T00:00:00.000Z"),
                            "grantNumber": "1111",
                            "grantType": "RSU",
                            "vestingDate": new Date("2023-06-01T00:00:00.000Z"),
                            "vestedShares": 10,
                            "stockPrice": 100,
                            "exercisePrice": 0,
                            "balance": 10,
                            "exchangeRate": 1,
                            "cost": 1000,
                            "incomeAmount": 1000
                        }]
                    }
                }, "gainByYear": {}
            }
        );
    });
});
