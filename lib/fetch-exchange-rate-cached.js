import rates from "../rates.json" with { type: "json" };

export async function fetchExchangeRate(date) {
  return rates[date];
} 
