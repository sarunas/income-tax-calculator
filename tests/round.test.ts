import { round } from '../lib/round';

describe('round', () => {
  it('should correctly round numbers to two decimal places', () => {
    expect(round(1.234)).toBe(1.23);
    expect(round(1.235)).toBe(1.24);
    expect(round(1.005)).toBe(1.01);
  });

  it('should handle negative numbers', () => {
    expect(round(-1.234)).toBe(-1.23);
    expect(round(-1.235)).toBe(-1.24);
  });

  it('should handle zero', () => {
    expect(round(0)).toBe(0);
  });
});