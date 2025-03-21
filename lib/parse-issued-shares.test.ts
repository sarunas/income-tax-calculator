import { describe, expect, it } from "vitest";
import { parseIssuedShares } from "./parse-issued-shares";

describe("parseIssuedShares", () => {
  it("should parse valid issued shares data", () => {
    const content = `28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
31/08/2018 ESPP12256 ESPP 31/08/2018 10 111.10 $ 63.79 $`;

    const result = parseIssuedShares(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      grantDate: new Date("2019-02-28T00:00:00.000Z"),
      grantNumber: "ESPP13783",
      grantType: "ESPP",
      vestingDate: new Date("2019-02-28T00:00:00.000Z"),
      vestedShares: 10,
      stockPrice: 109.25,
      exercisePrice: 92.86,
    });
  });

  it("should handle empty input", () => {
    const result = parseIssuedShares("");
    expect(result).toHaveLength(0);
  });

  it("should handle whitespace-only input", () => {
    const result = parseIssuedShares("   \n  \t  ");
    expect(result).toHaveLength(0);
  });
}); 