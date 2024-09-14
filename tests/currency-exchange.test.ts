import { fetchExchangeRate } from '../lib/currency-exchange';
import axios from 'axios';

jest.mock('axios');

describe('fetchExchangeRate', () => {
  it('should fetch correct exchange rate for a given date and currency', async () => {
    const mockResponse = {
      status: 200,
      data: '<html><body id="curr_rates"><span>1,1234</span></body></html>',
    };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(mockResponse);

    const rate: number = await fetchExchangeRate('2021-01-01', 'USD');
    expect(rate).toBe(1.1234);
  });

  it('should throw an error if unable to extract rate', async () => {
    const mockResponse = {
      status: 200,
      data: '<html><body>No rate here</body></html>',
    };
    (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(mockResponse);

    await expect(fetchExchangeRate('2021-01-01', 'USD')).rejects.toThrow('Failed to extract exchange rate');
  });
});