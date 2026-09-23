import type { SupportedLocale } from "@/locales/locale";

/** Formats the date shown on compact My Quests cards. */
export function formatQuestDate(
  value: string | null | undefined,
  locale: SupportedLocale = "en"
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
