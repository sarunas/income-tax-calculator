// tests/parse-same-day-shares.test.ts
import { parseSameDayShares, SameDayShare } from '../lib/parse-same-day-shares';

describe('parseSameDayShares', () => {
  it('should correctly parse same day shares data', () => {
    const input = '2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $';
    const result = parseSameDayShares(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
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
    const result = parseSameDayShares('');
    expect(result).toEqual([]);
  });

  it('should handle input without Same Day Sell entries', () => {
    const input = '2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $';
    const result = parseSameDayShares(input);
    expect(result).toEqual([]);
  });

  it('should remove duplicate entries', () => {
    const input = `2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $`;
    const result = parseSameDayShares(input);
    expect(result).toHaveLength(1);
  });
});