import {
  calculateTimeRemaining,
  formatCountdownText,
  formatWorkCountdown,
  formatRelativeRemaining,
} from "../datetime";

describe("datetime utils", () => {
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
