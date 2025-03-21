import { describe, expect, it } from "vitest";
import { round } from "./round";

describe("round", () => {
  it("should round to 2 decimal places", () => {
    expect(round(1.234)).toBe(1.23);
    expect(round(1.235)).toBe(1.24);
    expect(round(1.236)).toBe(1.24);
  });

  it("should handle whole numbers", () => {
    expect(round(1)).toBe(1);
    expect(round(0)).toBe(0);
    expect(round(-1)).toBe(-1);
  });

  it("should handle negative numbers", () => {
    expect(round(-1.234)).toBe(-1.23);
    expect(round(-1.235)).toBe(-1.24);
    expect(round(-1.236)).toBe(-1.24);
  });

  it("should handle zero decimal places", () => {
    expect(round(1.0)).toBe(1);
    expect(round(1.00)).toBe(1);
    expect(round(1.000)).toBe(1);
  });

  it("should handle large numbers", () => {
    expect(round(1234567.89)).toBe(1234567.89);
    expect(round(1234567.891)).toBe(1234567.89);
    expect(round(1234567.895)).toBe(1234567.90);
  });
}); 