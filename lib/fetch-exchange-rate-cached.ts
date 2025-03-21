import rates from "../rates.json" with { type: "json" };

interface ExchangeRates {
  [date: string]: number;
}

export async function fetchExchangeRateCached(date: string): Promise<number> {
  return (rates as ExchangeRates)[date];
} 