import {
  formatDate,
  formatDateTime,
  formatTimestamp,
  formatTimestampDateTime,
} from "@/domain/datetime";

describe("quest datetime formatting", () => {
  it("uses a shared day-month-year date and 24-hour time format", () => {
    const timestamp = "2026-10-14T17:00:00Z";

    expect(formatDate("2026-10-15", "th", "")).toBe("15 ต.ค. 2026");
    expect(formatTimestamp(timestamp, "th", "")).toBe("15 ต.ค. 2026 00:00");
    expect(formatTimestampDateTime(timestamp, "th")).toBe("15 ต.ค. 2026 00:00");
    expect(formatDateTime("2026-10-15", "00:00", "en", "—")).toBe(
      "15 Oct 2026, 00:00"
    );
    expect(formatDateTime("2026-10-15", "25:00", "en", "—")).toBe("—");
  });
});
