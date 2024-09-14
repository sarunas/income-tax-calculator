import { parseSoldShares, SoldShare } from '../lib/parse-sold-shares';

describe('parseSoldShares', () => {
  it('should correctly parse sold shares data', () => {
    const input = '2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $';
    const result: SoldShare[] = parseSoldShares(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<SoldShare>({
      orderNumber: '2729432',
      grantNumber: 'ESPP13783',
      grantDate: new Date(Date.UTC(2019, 1, 28)),
      grantType: 'ESPP',
      orderDate: new Date(Date.UTC(2019, 2, 13)),
      sharesSold: 10,
      salePrice: 108.44,
      exercisePrice: 92.86,
      totalFees: 8.29,
    });
  });

  it('should handle empty input', () => {
    const result: SoldShare[] = parseSoldShares('');
    expect(result).toEqual([]);
  });

  it('should handle different types of sales', () => {
    const input = `2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2729433 Sell of Restricted Stock RSU5535 14/06/2016 RSU 06/03/2018 45 79.60 $ .00 $ 32.99 $
2729434 Same Day Sell ESPP13784 01/03/2019 ESPP 01/03/2019 5 110.00 $ 93.50 $ 4.15 $`;
    const result: SoldShare[] = parseSoldShares(input);
    expect(result).toHaveLength(3);
  });

  it('should remove duplicate entries', () => {
    const input = `2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $`;
    const result: SoldShare[] = parseSoldShares(input);
    expect(result).toHaveLength(1);
  });
});