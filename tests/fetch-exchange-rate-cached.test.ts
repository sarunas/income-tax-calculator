// tests/fetch-exchange-rate-cached.test.ts
import { fetchExchangeRate } from '../lib/fetch-exchange-rate-cached';
import rates from '../rates.json';

jest.mock('../rates.json', () => ({
  '2021-01-01': 1.2271,
  '2021-01-02': 1.2271,
}));

describe('fetchExchangeRate', () => {
  it('should return correct exchange rate for a given date', async () => {
    const rate: number = await fetchExchangeRate('2021-01-01');
    expect(rate).toBe(1.2271);
  });

  it('should throw an error for non-existent date', async () => {
    await expect(fetchExchangeRate('2000-01-01')).rejects.toThrow('Exchange rate not found for date: 2000-01-01');
  });
});