import { TIME_PATTERN } from "./createQuestModel";

const dateFormatters: Partial<Record<"en" | "th", Intl.DateTimeFormat>> = {};

function getDateFormatter(locale: "en" | "th"): Intl.DateTimeFormat {
  const cached = dateFormatters[locale];
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH" : "en-GB",
    { day: "2-digit", month: "short", year: "numeric" }
  );
  dateFormatters[locale] = formatter;
  return formatter;
}

export function formatDate(
  value: string,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return getDateFormatter(locale).format(date);
}

export function formatDateTime(
  dateValue: string,
  timeValue: string,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!dateValue || !TIME_PATTERN.test(timeValue)) return emptyLabel;
  return `${formatDate(dateValue, locale, emptyLabel)} · ${timeValue}`;
}

export function getDatePickerValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date();
}

export function getDateTimePickerValue(
  dateValue: string,
  timeValue: string
): Date {
  const date = getDatePickerValue(dateValue);
  const match = TIME_PATTERN.exec(timeValue);
  if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}
