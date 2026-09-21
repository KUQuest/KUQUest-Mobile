/**
 * Formats a date string or timestamp for compact Quest cards and listings.
 * e.g. "1 Oct" (en) or "1 ต.ค." (th).
 */
export function formatQuestDate(
  value: string | null | undefined,
  locale: "en" | "th" = "en"
): string {
  if (!value) return "—";
  const dateValue = value.length > 10 ? value.slice(0, 10) : value;
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Formats a date for profiles and history listings (e.g. "Oct 2026").
 */
export function formatDisplayMonthYear(
  value: string | Date | null | undefined,
  locale: "en" | "th" = "en"
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export type TimeRemaining = {
  isOverdue: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Computes remaining time until `dueAt`. Returns null if `dueAt` is missing or invalid.
 */
export function calculateTimeRemaining(
  dueAt: string | null | undefined,
  now: number = Date.now()
): TimeRemaining | null {
  if (!dueAt) return null;
  const target = new Date(dueAt).getTime();
  if (Number.isNaN(target)) return null;

  const diff = target - now;
  const isOverdue = diff <= 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  return {
    isOverdue,
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Formats countdown text with custom message templates.
 */
export function formatCountdownText(
  dueAt: string | null | undefined,
  now: number,
  messages: { dueNow: string; remaining: string; noDueAt: string }
): string {
  const remaining = calculateTimeRemaining(dueAt, now);
  if (!remaining) return messages.noDueAt;
  if (remaining.isOverdue) return messages.dueNow;

  return messages.remaining
    .replace("{days}", String(remaining.days))
    .replace("{hours}", String(remaining.hours))
    .replace("{minutes}", String(remaining.minutes));
}

/**
 * Formats countdown text for active work hub (e.g. "1d 4h 30m remaining").
 */
export function formatWorkCountdown(
  dueAt: string | null | undefined,
  now: number,
  messages: { dueNow: string; remaining: string; noDueAt: string }
): string {
  if (!dueAt) return messages.noDueAt;
  const remaining = calculateTimeRemaining(dueAt, now);
  if (!remaining) return messages.noDueAt;
  if (remaining.isOverdue) return messages.dueNow;

  const parts: string[] = [];
  if (remaining.days > 0) parts.push(`${remaining.days}d`);
  if (remaining.hours > 0 || remaining.days > 0)
    parts.push(`${remaining.hours}h`);
  parts.push(`${remaining.minutes}m`);
  return `${parts.join(" ")} ${messages.remaining}`;
}

/**
 * Formats concise relative deadline string (e.g. "2d 4h remaining", "3h 12m remaining", "Due now").
 * Returns null if dueAt is null, undefined, or invalid.
 */
export function formatRelativeRemaining(
  dueAt: string | null | undefined,
  now: number = Date.now()
): string | null {
  if (!dueAt) return null;
  const remaining = calculateTimeRemaining(dueAt, now);
  if (!remaining) return null;
  if (remaining.isOverdue) return "Due now";

  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h remaining`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}m remaining`;
  }
  return `${remaining.minutes}m remaining`;
}
