import { formatDate, formatTimestamp } from "@/domain/datetime";

describe("quest datetime formatting", () => {
  it("uses Gregorian Thai dates and Bangkok time for UTC timestamps", () => {
    expect(formatDate("2026-10-15", "th", "")).toBe("15 ต.ค. 2026");
    expect(formatTimestamp("2026-10-14T17:00:00Z", "th", "")).toBe(
      "15 ต.ค. 2026 00:00"
    );
  });
});
