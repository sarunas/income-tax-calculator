import { describe, expect, it } from "vitest";
import { parseSoldShares } from "./parse-sold-shares";

describe("parseSoldShares", () => {
  it("should parse valid sold shares data", () => {
    const content = `2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2575819 Sell of Stock ESPP12256 31/08/2018 ESPP 11/09/2018 8 111.60 $ 63.79 $ 10.11 $`;

    const result = parseSoldShares(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      orderNumber: "2729432",
      action: "Sell of Stock",
      grantNumber: "ESPP13783",
      grantDate: new Date("2019-02-28T00:00:00.000Z"),
      grantType: "ESPP",
      orderDate: new Date("2019-03-13T00:00:00.000Z"),
      sharesSold: 10,
      salePrice: 108.44,
      exercisePrice: 92.86,
      totalFees: 8.29,
    });
  });

  it("should parse restricted stock sales", () => {
    const content = `2365869 Sell of Restricted Stock 5535 14/06/2016 RSU 06/03/2018 45 79.60 $ .00 $ 32.99 $`;

    const result = parseSoldShares(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      orderNumber: "2365869",
      action: "Sell of Restricted Stock",
      grantNumber: "5535",
      grantDate: new Date("2016-06-14T00:00:00.000Z"),
      grantType: "RSU",
      orderDate: new Date("2018-03-06T00:00:00.000Z"),
      sharesSold: 45,
      salePrice: 79.60,
      exercisePrice: 0,
      totalFees: 32.99,
    });
  });

  it("should handle empty input", () => {
    const result = parseSoldShares("");
    expect(result).toHaveLength(0);
  });

  it("should handle whitespace-only input", () => {
    const result = parseSoldShares("   \n  \t  ");
    expect(result).toHaveLength(0);
  });

  it("should remove duplicate entries based on order number", () => {
    const content = `2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $`;

    const result = parseSoldShares(content);
    expect(result).toHaveLength(1);
  });
}); 