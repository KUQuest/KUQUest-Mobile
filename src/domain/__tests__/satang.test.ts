import { formatSatang, parseSatangInput } from "../satang";

describe("Satang domain primitives", () => {
  test("renders exact format with two decimals", () => {
    expect(formatSatang(125000, "en", "exact")).toEqual("฿1,250.00");
    expect(formatSatang(400, "en", "exact")).toEqual("฿4.00");
    expect(formatSatang(28, "en", "exact")).toEqual("฿0.28");
  });

  test("keeps compact output unchanged", () => {
    expect(formatSatang(125000, "en")).toEqual("฿1,250");
    expect(formatSatang(50428, "en")).toEqual("฿504.28");
  });

  test("parses THB input without floating-point arithmetic", () => {
    expect(parseSatangInput("10.5")).toEqual(1050);
    expect(parseSatangInput("10.50")).toEqual(1050);
    expect(parseSatangInput("0.01")).toEqual(1);
    expect(parseSatangInput("abc")).toEqual(null);
    expect(parseSatangInput("1.234")).toEqual(null);
  });
});
