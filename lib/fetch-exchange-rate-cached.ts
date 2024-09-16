import rates from '../rates.json';

interface RatesData {
  [date: string]: number;
}

const typedRates: RatesData = rates;

export const fetchExchangeRate = (date: string): Promise<number> => {
  if (date in typedRates) {
    return Promise.resolve(typedRates[date]);
  } else {
    return Promise.reject(new Error(`Exchange rate not found for date: ${date}`));
  }
};