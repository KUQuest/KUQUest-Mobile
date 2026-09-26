const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const THAI_GREGORIAN_LOCALE = "th-TH-u-ca-gregory";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateFormatters: Partial<Record<"en" | "th", Intl.DateTimeFormat>> = {};
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
  const date = new Date(`${dateValue}T${timeValue}:00+07:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return formatTimestampDateTime(date, locale);
}

export function formatTimestamp(
  value: string | null | undefined,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!value) return emptyLabel;
  return formatTimestampDateTime(value, locale);
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: BANGKOK_TIME_ZONE,
    }
  );
  timestampDateTimeFormatters[locale] = formatter;
  return formatter;
}

export function formatTimestampDate(
  value: string | Date | undefined,
  locale: "en" | "th"
): string | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : undefined;
  }
  return getDateFormatter(locale).format(date);
}

export function formatTimestampDateTime(
  value: string | Date,
  locale: "en" | "th"
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return getTimestampDateTimeFormatter(locale).format(date);
}

export function formatTimeInBangkok(
  value: string | Date | null | undefined
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return bangkokTimeFormatter.format(date);
}

const calendarFormatters = new Map<string, Intl.DateTimeFormat>();

function getCalendarFormatter(
  locale: "en" | "th",
  key: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const cacheKey = `${locale}:${key}`;
  let formatter = calendarFormatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      locale === "th" ? THAI_GREGORIAN_LOCALE : "en-GB",
      options
    );
    calendarFormatters.set(cacheKey, formatter);
  }
  return formatter;
}

/**
 * Month and Gregorian year of a device-local calendar date (no time-zone
 * shift), e.g. a date-picker month or a profile issue month.
 */
export function formatCalendarMonthYear(
  date: Date,
  locale: "en" | "th",
  month: "short" | "long" = "short"
): string {
  if (Number.isNaN(date.getTime())) return "";
  return getCalendarFormatter(locale, `month-year-${month}`, {
    month,
    year: "numeric",
  }).format(date);
}

/** Narrow weekday label of a device-local calendar date. */
export function formatCalendarWeekday(date: Date, locale: "en" | "th"): string {
  return getCalendarFormatter(locale, "weekday-narrow", {
    weekday: "narrow",
  }).format(date);
}
