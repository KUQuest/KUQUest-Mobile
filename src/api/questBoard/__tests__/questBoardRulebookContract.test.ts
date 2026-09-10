import {
  questBoardCardSchema,
  questBoardCursorSchema,
  questBoardDetailSchema,
  questBoardModeSchema,
  questBoardParticipationSchema,
  questBoardStatusSchema,
} from "../questBoardContracts";

const questId = "2ad5b944-830b-4e28-95a7-5fe2792b713a";
const tagId = "58818dc3-6dad-424f-8dfd-d20b6747aeb3";
const schedule = {
  startTime: "2026-09-30T09:00:00.000+07:00",
  dueAt: "2026-09-30T11:00:00.000+07:00",
};

const groupFcfsCard = {
  id: questId,
  title: "Support the campus event",
  questReward: 180,
  tag: { id: tagId, name: "Campus life" },
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "GROUP",
  headcount: 3,
  activeWorkerCount: 3,
  ...schedule,
  hirerName: "Demo Hirer",
  location: "Student activity building",
};

describe("Quest Board Rulebook transport contract", () => {
  test("accepts a realistic full GROUP FCFS Board card", () => {
    expect(questBoardCardSchema.parse(groupFcfsCard)).toEqual(groupFcfsCard);
  });

  test.each([
    "QUEST_DRAFT",
    "QUEST_OPEN",
    "QUEST_ASSIGNED",
    "QUEST_IN_PROGRESS",
    "QUEST_COMPLETED",
    "QUEST_CANCELLED",
    "QUEST_FAILED",
  ] as const)("accepts canonical Quest status %s at runtime", (status) => {
    expect(questBoardStatusSchema.parse(status)).toBe(status);
  });

  test.each(["FIRST_COME_FIRST_SERVED", "CANDIDATE"] as const)(
    "accepts canonical Selection Mode %s at runtime",
    (mode) => {
      expect(questBoardModeSchema.parse(mode)).toBe(mode);
    }
  );

  test.each(["SINGLE", "GROUP"] as const)(
    "accepts canonical Participation %s at runtime",
    (participation) => {
      expect(questBoardParticipationSchema.parse(participation)).toBe(
        participation
      );
    }
  );

  test("rejects legacy mode and status aliases", () => {
    expect(() => questBoardModeSchema.parse("NO_CANDIDATE")).toThrow();
    expect(() => questBoardStatusSchema.parse("QUEST_DISPUTED")).toThrow();
  });

  test("preserves an empty page and opaque server cursor", () => {
    expect(
      questBoardCursorSchema.parse({
        items: [],
        nextCursor: "opaque/server-token==",
      })
    ).toEqual({
      items: [],
      nextCursor: "opaque/server-token==",
    });
  });

  test("preserves nullable tag and dueAt in Board and public-detail responses", () => {
    const nullableCard = {
      ...groupFcfsCard,
      tag: null,
      dueAt: null,
    };
    expect(questBoardCardSchema.parse(nullableCard)).toEqual(nullableCard);

    const { location, ...cardWithoutLocation } = nullableCard;
    const nullableDetail = {
      ...cardWithoutLocation,
      description: null,
      condition: {
        items: [{ position: 0, text: "Complete the checklist." }],
      },
      state: "QUEST_OPEN",
      proofRequired: false,
      locations: [{ label: location }],
      images: [],
    };

    expect(questBoardDetailSchema.parse(nullableDetail)).toEqual(nullableDetail);
  });

  test("accepts canonical detail state without adding client lifecycle fields", () => {
    const { location, ...cardWithoutLocation } = groupFcfsCard;
    const detail = {
      ...cardWithoutLocation,
      description: "Coordinate the event support checklist.",
      condition: {
        items: [{ position: 0, text: "Complete the checklist." }],
      },
      state: "QUEST_ASSIGNED",
      proofRequired: false,
      locations: [{ label: location }],
      images: [],
    };

    expect(questBoardDetailSchema.parse(detail)).toEqual(detail);
  });
});
