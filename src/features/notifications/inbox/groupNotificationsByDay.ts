import type { MemberNotification } from "@/api/NotificationApi";
import { formatTimestampDate } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const UNKNOWN_DAY = "unknown";

export type NotificationDaySection = {
  /** Bangkok calendar day as `YYYY-MM-DD`, or `unknown` for an unparseable timestamp. */
  key: string;
  title: string;
  data: MemberNotification[];
};

/** Bangkok has no DST, so a fixed +07:00 shift gives its calendar day. */
function bangkokDayKey(value: Date): string {
  if (Number.isNaN(value.getTime())) return UNKNOWN_DAY;
  return new Date(value.getTime() + BANGKOK_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Groups notifications into Bangkok calendar-day sections, titled Today,
 * Yesterday, or the formatted date. Sections and the rows inside them keep
 * the order of first appearance in `items`.
 */
export function groupNotificationsByDay(
  items: readonly MemberNotification[],
  now: Date,
  locale: SupportedLocale
): NotificationDaySection[] {
  const messages = memberNotificationMessages[locale];
  const todayKey = bangkokDayKey(now);
  const yesterdayKey = bangkokDayKey(new Date(now.getTime() - DAY_MS));
  const sections = new Map<string, NotificationDaySection>();
  for (const item of items) {
    const key = bangkokDayKey(new Date(item.createdAt));
    let section = sections.get(key);
    if (!section) {
      let title: string;
      if (key === todayKey) title = messages.today;
      else if (key === yesterdayKey) title = messages.yesterday;
      else title = formatTimestampDate(item.createdAt, locale) ?? "";
      section = { key, title, data: [] };
      sections.set(key, section);
    }
    section.data.push(item);
  }
  return [...sections.values()];
}
