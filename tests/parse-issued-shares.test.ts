// tests/parse-issued-shares.test.ts
import { parseIssuedShares, IssuedShare } from '../lib/parse-issued-shares';

describe('parseIssuedShares', () => {
  it('should correctly parse issued shares data', () => {
    const input = `28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
31/08/2018 ESPP12256 ESPP 31/08/2018 10 111.10 $ 63.79 $`;

    const result: IssuedShare[] = parseIssuedShares(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      grantDate: new Date(Date.UTC(2019, 1, 28)),
      grantNumber: 'ESPP13783',
      grantType: 'ESPP',
      vestingDate: new Date(Date.UTC(2019, 1, 28)),
      vestedShares: 10,
      stockPrice: 109.25,
      exercisePrice: 92.86,
    });
    expect(result[1]).toEqual({
      grantDate: new Date(Date.UTC(2018, 7, 31)),
      grantNumber: 'ESPP12256',
      grantType: 'ESPP',
      vestingDate: new Date(Date.UTC(2018, 7, 31)),
      vestedShares: 10,
      stockPrice: 111.10,
      exercisePrice: 63.79,
    });
  });

  it('should handle empty input', () => {
    const result: IssuedShare[] = parseIssuedShares('');
    expect(result).toEqual([]);
  });

  it('should handle input with different grant types', () => {
    const input = `28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
14/06/2016 5535 RSU 14/09/2017 15 69.05 $ 0.00 $`;

    const result: IssuedShare[] = parseIssuedShares(input);

    expect(result).toHaveLength(2);
    expect(result[0].grantType).toBe('ESPP');
    expect(result[1].grantType).toBe('RSU');
  });

  it('should remove duplicate entries', () => {
    const input = `28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
31/08/2018 ESPP12256 ESPP 31/08/2018 10 111.10 $ 63.79 $`;

    const result: IssuedShare[] = parseIssuedShares(input);

    expect(result).toHaveLength(2);
  });

  it('should handle invalid input', () => {
    const input = 'invalid input';
    const result: IssuedShare[] = parseIssuedShares(input);
    expect(result).toEqual([]);
  });

  it('should handle invalid date input', () => {
    const input = '32/13/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $';
    const result: IssuedShare[] = parseIssuedShares(input);
    expect(result).toEqual([]);
  });
});