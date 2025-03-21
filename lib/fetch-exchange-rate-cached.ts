import rates from "../rates.json" with { type: "json" };
import { ExchangeRates } from "./types";

export async function fetchExchangeRateCached(date: string): Promise<number> {
  return (rates as ExchangeRates)[date];
} 