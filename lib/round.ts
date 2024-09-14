// lib/round.ts
import Decimal from 'decimal.js';

export function round(amount: number): number {
  return new Decimal(amount).toDecimalPlaces(2).toNumber();
}