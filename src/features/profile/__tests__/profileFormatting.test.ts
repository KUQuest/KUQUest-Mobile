import { formatDisplayMonthYear } from "../profileFormatting";

describe("profile date formatting", () => {
  it("formats a valid date as month and year", () => {
    expect(formatDisplayMonthYear("2026-10-15T00:00:00Z", "en")).toMatch(
      /Oct\s+2026/i
    );
  });

  it("returns an empty string for missing values", () => {
    expect(formatDisplayMonthYear(null)).toBe("");
    expect(formatDisplayMonthYear(undefined)).toBe("");
  });

  it("returns an unparseable date string unchanged", () => {
    expect(formatDisplayMonthYear("not-a-date")).toBe("not-a-date");
  });
});
