import { fetchExchangeRate } from '../lib/currency-exchange';
import fetch, { Response } from 'node-fetch';

jest.mock('node-fetch');

describe('fetchExchangeRate', () => {
  it('should fetch correct exchange rate for a given date and currency', async () => {
    const mockResponse: Partial<Response> = {
      status: 200,
      text: jest.fn().mockResolvedValue('<html><body id="curr_rates"><span>1,1234</span></body></html>'),
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);

    const rate: number = await fetchExchangeRate('2021-01-01', 'USD');
    expect(rate).toBe(1.1234);
  });

  it('should throw an error for HTTP error', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({ status: 404 } as Response);

    await expect(fetchExchangeRate('2021-01-01', 'USD')).rejects.toThrow('HTTP error! status: 404');
  });

  it('should throw an error if unable to extract rate', async () => {
    const mockResponse: Partial<Response> = {
      status: 200,
      text: jest.fn().mockResolvedValue('<html><body>No rate here</body></html>'),
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);

    await expect(fetchExchangeRate('2021-01-01', 'USD')).rejects.toThrow('Failed to extract exchange rate');
  });
});