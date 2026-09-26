import {
  formatDate,
  formatTimeInBangkok,
  formatTimestampDate,
} from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";

/** Formats the date shown on compact My Quests cards. */
export function formatQuestDate(
  value: string | null | undefined,
  locale: SupportedLocale
): string {
  if (!value) return "—";
  if (value.includes("T")) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return formatTimestampDate(date, locale) ?? "—";
  }
  const dateValue = value.length > 10 ? value.slice(0, 10) : value;
  return formatDate(dateValue, locale, "—");
}

/** Formats one schedule endpoint as its date and Bangkok time. */
export function formatQuestDateTime(
  value: string,
  locale: SupportedLocale
): string {
  const time = formatTimeInBangkok(value);
  const date = formatQuestDate(value, locale);
  return time ? `${date} · ${time}` : date;
}

/** Maps Quest categories to their existing My Quests card tone. */
export function getCategoryTone(tag: string): "green" | "blue" | "purple" {
  if (!tag) return "green";
  const lower = tag.toLocaleLowerCase();
  if (
    tag === "Academic" ||
    tag === "วิชาการ" ||
    lower.includes("print") ||
    tag.includes("ถ่าย")
  ) {
    return "blue";
  }
  if (
    tag === "Event" ||
    tag === "กิจกรรม" ||
    lower.includes("design") ||
    tag.includes("ออกแบบ")
  ) {
    return "purple";
  }
  return "green";
}
