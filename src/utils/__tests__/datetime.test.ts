import {
  formatQuestDate,
  formatDisplayMonthYear,
  calculateTimeRemaining,
  formatCountdownText,
  formatWorkCountdown,
  formatRelativeRemaining,
} from "../datetime";

describe("datetime utils", () => {
  describe("formatQuestDate", () => {
    it("formats ISO date strings in English", () => {
      const formatted = formatQuestDate("2026-10-01T09:00:00Z", "en");
      expect(formatted).toMatch(/1\s+Oct/i);
    });

    it("formats date-only strings in Thai", () => {
      const formatted = formatQuestDate("2026-10-01", "th");
      expect(formatted).toContain("1");
      expect(formatted).toContain("ต.ค.");
    });

    it("returns dash fallback for empty or invalid values", () => {
      expect(formatQuestDate(null)).toBe("—");
      expect(formatQuestDate(undefined)).toBe("—");
      expect(formatQuestDate("invalid-date")).toBe("—");
    });
  });

  describe("formatDisplayMonthYear", () => {
    it("formats valid date string to month and year", () => {
      const formatted = formatDisplayMonthYear("2026-10-15T00:00:00Z", "en");
      expect(formatted).toMatch(/Oct\s+2026/i);
    });

    it("returns empty string for null or undefined", () => {
      expect(formatDisplayMonthYear(null)).toBe("");
      expect(formatDisplayMonthYear(undefined)).toBe("");
    });

    it("returns raw value for unparseable date strings", () => {
      expect(formatDisplayMonthYear("not-a-date")).toBe("not-a-date");
    });
  });

  describe("calculateTimeRemaining", () => {
    const fixedNow = new Date("2026-10-01T12:00:00Z").getTime();

    it("computes accurate time delta for future deadlines", () => {
      // 2 days, 3 hours, 15 minutes in the future
      const dueAt = new Date(
        fixedNow + (2 * 24 * 3600 + 3 * 3600 + 15 * 60) * 1000
      ).toISOString();

      const result = calculateTimeRemaining(dueAt, fixedNow);
      expect(result).not.toBeNull();
      expect(result?.isOverdue).toBe(false);
      expect(result?.days).toBe(2);
      expect(result?.hours).toBe(3);
      expect(result?.minutes).toBe(15);
    });

    it("flags overdue deadlines accurately", () => {
      const pastDue = new Date(fixedNow - 3600 * 1000).toISOString();
      const result = calculateTimeRemaining(pastDue, fixedNow);
      expect(result?.isOverdue).toBe(true);
    });

    it("returns null for missing or invalid dueAt", () => {
      expect(calculateTimeRemaining(null, fixedNow)).toBeNull();
      expect(calculateTimeRemaining("not-a-date", fixedNow)).toBeNull();
    });
  });

  describe("formatCountdownText", () => {
    const fixedNow = new Date("2026-10-01T12:00:00Z").getTime();
    const messages = {
      dueNow: "Due immediately",
      remaining: "{days} days, {hours} hours left",
      noDueAt: "Open-ended",
    };

    it("formats template for future deadlines", () => {
      const future = new Date(
        fixedNow + (1 * 24 * 3600 + 4 * 3600) * 1000
      ).toISOString();
      expect(formatCountdownText(future, fixedNow, messages)).toBe(
        "1 days, 4 hours left"
      );
    });

    it("returns dueNow message for expired deadlines", () => {
      const past = new Date(fixedNow - 1000).toISOString();
      expect(formatCountdownText(past, fixedNow, messages)).toBe(
        "Due immediately"
      );
    });

    it("returns noDueAt message when dueAt is not provided", () => {
      expect(formatCountdownText(null, fixedNow, messages)).toBe("Open-ended");
    });
  });

  describe("formatWorkCountdown", () => {
    const fixedNow = new Date("2026-10-01T12:00:00Z").getTime();
    const messages = {
      dueNow: "Due now",
      remaining: "remaining",
      noDueAt: "No deadline",
    };

    it("formats parts correctly with days and hours", () => {
      const future = new Date(
        fixedNow + (2 * 24 * 3600 + 5 * 3600 + 30 * 60) * 1000
      ).toISOString();
      expect(formatWorkCountdown(future, fixedNow, messages)).toBe(
        "2d 5h 30m remaining"
      );
    });

    it("formats parts without days when under 24 hours", () => {
      const future = new Date(
        fixedNow + (5 * 3600 + 20 * 60) * 1000
      ).toISOString();
      expect(formatWorkCountdown(future, fixedNow, messages)).toBe(
        "5h 20m remaining"
      );
    });
  });

  describe("formatRelativeRemaining", () => {
    const fixedNow = new Date("2026-10-01T12:00:00Z").getTime();

    it("returns days and hours when over 24h", () => {
      const future = new Date(
        fixedNow + (3 * 24 * 3600 + 2 * 3600) * 1000
      ).toISOString();
      expect(formatRelativeRemaining(future, fixedNow)).toBe("3d 2h remaining");
    });

    it("returns hours and minutes when under 24h", () => {
      const future = new Date(
        fixedNow + (4 * 3600 + 12 * 60) * 1000
      ).toISOString();
      expect(formatRelativeRemaining(future, fixedNow)).toBe(
        "4h 12m remaining"
      );
    });

    it("returns 'Due now' when overdue", () => {
      const past = new Date(fixedNow - 5000).toISOString();
      expect(formatRelativeRemaining(past, fixedNow)).toBe("Due now");
    });

    it("returns null for missing or invalid dates", () => {
      expect(formatRelativeRemaining(null, fixedNow)).toBeNull();
      expect(formatRelativeRemaining("bad-date", fixedNow)).toBeNull();
    });
  });
});
