const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const THAI_GREGORIAN_LOCALE = "th-TH-u-ca-gregory";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateFormatters: Partial<Record<"en" | "th", Intl.DateTimeFormat>> = {};
const timestampFormatters: Partial<Record<"en" | "th", Intl.DateTimeFormat>> =
  {};
const bangkokTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: BANGKOK_TIME_ZONE,
});
const timestampDateTimeFormatters: Partial<
  Record<"en" | "th", Intl.DateTimeFormat>
> = {};

function getDateFormatter(locale: "en" | "th"): Intl.DateTimeFormat {
  const cached = dateFormatters[locale];
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(
    locale === "th" ? THAI_GREGORIAN_LOCALE : "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: BANGKOK_TIME_ZONE,
    }
  );
  dateFormatters[locale] = formatter;
  return formatter;
}

function getTimestampFormatter(locale: "en" | "th"): Intl.DateTimeFormat {
  const cached = timestampFormatters[locale];
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH-u-ca-gregory" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: BANGKOK_TIME_ZONE,
    }
  );
  timestampFormatters[locale] = formatter;
  return formatter;
}

export function formatDate(
  value: string,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T12:00:00+07:00`);
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

export function formatTimestamp(
  value: string | null | undefined,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return getTimestampFormatter(locale).format(date);
}

function getTimestampDateTimeFormatter(
  locale: "en" | "th"
): Intl.DateTimeFormat {
  const cached = timestampDateTimeFormatters[locale];
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(
    locale === "th" ? THAI_GREGORIAN_LOCALE : "en-GB",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: BANGKOK_TIME_ZONE,
    }
  );
  timestampDateTimeFormatters[locale] = formatter;
  return formatter;
}

export function formatTimestampDate(
  value: string | undefined,
  locale: "en" | "th"
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return getDateFormatter(locale).format(date);
}

export function formatTimestampDateTime(
  value: string,
  locale: "en" | "th"
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return getTimestampDateTimeFormatter(locale).format(date);
}

export function formatTimeInBangkok(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return bangkokTimeFormatter.format(date);
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
