import { formatDisplayMonthYear } from "../profileFormatting";

describe("profile date formatting", () => {
  it("formats a valid date as month and year in English", () => {
    expect(formatDisplayMonthYear("2026-10-15T00:00:00Z", "en")).toMatch(
      /Oct\s+2026/i
    );
  });

  it("formats a valid date with Gregorian year in Thai (e.g. 2026, not 2569)", () => {
    const formatted = formatDisplayMonthYear("2026-10-15T00:00:00Z", "th");
    expect(formatted).toContain("2026");
    expect(formatted).not.toContain("2569");
  });

  it("returns an empty string for missing values", () => {
    expect(formatDisplayMonthYear(null, "en")).toBe("");
    expect(formatDisplayMonthYear(undefined, "en")).toBe("");
    expect(formatDisplayMonthYear(null, "th")).toBe("");
  });

  it("returns an unparseable date string unchanged", () => {
    expect(formatDisplayMonthYear("not-a-date", "en")).toBe("not-a-date");
    expect(formatDisplayMonthYear("not-a-date", "th")).toBe("not-a-date");
  });
});
