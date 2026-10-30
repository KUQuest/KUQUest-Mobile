import type { MemberNotification } from "@/api/NotificationApi";
import { groupNotificationsByDay } from "../inbox/groupNotificationsByDay";

function row(id: string, createdAt: string): MemberNotification {
  return {
    id,
    type: "PENALTY_BAN_ENDED",
    createdAt,
    readAt: null,
    questId: null,
    result: null,
    expiresAt: null,
  };
}

// 12:00 on 31 Oct 2026 in Bangkok.
const now = new Date("2026-10-31T05:00:00Z");

function summarize(sections: ReturnType<typeof groupNotificationsByDay>) {
  return sections.map((s) => [s.title, s.data.map((n) => n.id)]);
}

describe("groupNotificationsByDay", () => {
  it("returns no sections for empty input", () => {
    expect(groupNotificationsByDay([], now, "en")).toEqual([]);
  });

  it("splits at Bangkok midnight, not UTC midnight", () => {
    const sections = groupNotificationsByDay(
      [
        row("today-start", "2026-10-30T17:00:00Z"),
        row("yesterday-end", "2026-10-30T16:59:59Z"),
        row("yesterday-start", "2026-10-29T17:00:00Z"),
        row("older", "2026-10-29T16:59:59Z"),
      ],
      now,
      "en"
    );
    expect(summarize(sections)).toEqual([
      ["Today", ["today-start"]],
      ["Yesterday", ["yesterday-end", "yesterday-start"]],
      ["29 Oct 2026", ["older"]],
    ]);
    expect(sections.map((s) => s.key)).toEqual([
      "2026-10-31",
      "2026-10-30",
      "2026-10-29",
    ]);
  });

  it("measures Today against Bangkok when the clock is past UTC midnight", () => {
    const sections = groupNotificationsByDay(
      [row("a", "2026-10-31T17:30:00Z"), row("b", "2026-10-31T10:00:00Z")],
      new Date("2026-10-31T18:00:00Z"),
      "en"
    );
    expect(summarize(sections)).toEqual([
      ["Today", ["a"]],
      ["Yesterday", ["b"]],
    ]);
  });

  it("keeps the input order of rows and sections and localizes titles", () => {
    const sections = groupNotificationsByDay(
      [
        row("1", "2026-10-31T04:00:00Z"),
        row("2", "2026-10-31T03:00:00Z"),
        row("3", "2026-10-30T03:00:00Z"),
      ],
      now,
      "th"
    );
    expect(summarize(sections)).toEqual([
      ["วันนี้", ["1", "2"]],
      ["เมื่อวาน", ["3"]],
    ]);
  });

  it("does not throw on an unparseable timestamp", () => {
    const sections = groupNotificationsByDay([row("x", "nope")], now, "en");
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe("unknown");
  });
});
