import { describe, expect, it } from "vitest";
import { parseSameDayShares } from "./parse-same-day-shares";

describe("parseSameDayShares", () => {
  it("should parse valid same day share sales", () => {
    const content = `2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 28/02/2019 10 108.44 $ 92.86 $ 8.29 $
2575819 Same Day Sell ESPP12256 31/08/2018 ESPP 31/08/2018 8 111.60 $ 63.79 $ 10.11 $`;

    const result = parseSameDayShares(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      orderNumber: "2729432",
      grantNumber: "ESPP13783",
      grantDate: new Date("2019-02-28T00:00:00.000Z"),
      grantType: "ESPP",
      orderDate: new Date("2019-02-28T00:00:00.000Z"),
      sharesSold: 10,
      salePrice: 108.44,
      exercisePrice: 92.86,
      totalFees: 8.29,
    });
  });

  it("should ignore non-same-day sales", () => {
    const content = `2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 28/02/2019 10 108.44 $ 92.86 $ 8.29 $
2575819 Sell of Stock ESPP12256 31/08/2018 ESPP 11/09/2018 8 111.60 $ 63.79 $ 10.11 $`;

    const result = parseSameDayShares(content);
    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe("2729432");
  });

  it("should handle empty input", () => {
    const result = parseSameDayShares("");
    expect(result).toHaveLength(0);
  });

  it("should handle whitespace-only input", () => {
    const result = parseSameDayShares("   \n  \t  ");
    expect(result).toHaveLength(0);
  });

  it("should handle malformed input gracefully", () => {
    const content = `2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 28/02/2019 10 108.44 $ 92.86 $ 8.29 $
invalid line
2575819 Same Day Sell ESPP12256 31/08/2018 ESPP 31/08/2018 8 111.60 $ 63.79 $ 10.11 $`;

    const result = parseSameDayShares(content);
    expect(result).toHaveLength(2);
    expect(result[0].orderNumber).toBe("2729432");
    expect(result[1].orderNumber).toBe("2575819");
  });

  it("should remove duplicate entries based on order number", () => {
    const content = `2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 28/02/2019 10 108.44 $ 92.86 $ 8.29 $
2729432 Same Day Sell ESPP13783 28/02/2019 ESPP 28/02/2019 10 108.44 $ 92.86 $ 8.29 $`;

    const result = parseSameDayShares(content);
    expect(result).toHaveLength(1);
  });
}); 