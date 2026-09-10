import {
  addConditionItem,
  calculateQuestEscrow,
  CONDITION_ITEM_MAX_LENGTH,
  formatDraftFundingTotal,
  getBangkokDateTimeParts,
  getBangkokIsoDateTime,
  getConditionValidationErrors,
  getDraftFundingTotalSatang,
  getFundingValidationError,
  getHeadcountForParticipation,
  getQuestPublishCheck,
  getSchedulePickerValue,
  getScheduleTimeValue,
  initialDraft,
  isBangkokIsoDateTime,
  isQuestDraftDirty,
  MAX_FUNDING_TOTAL_THB,
  moveConditionItem,
  parseStoredQuestDraft,
  parseStoredQuestSnapshot,
  removeConditionItem,
  toQuestBoardModeValues,
  toQuestDraftPayload,
  toQuestFixtureDraftPayload,
  updateConditionItem,
} from "../createQuestModel";

const tagId = "58818dc3-6dad-424f-8dfd-d20b6747aeb3";
const validDraft = {
  ...initialDraft,
  title: "Quest",
  tagId,
  description: "Do work",
  conditionItems: ["  Work is complete  ", "Leave the room clean"],
  startTime: "2099-08-26T09:00:00.000+07:00",
  dueAt: "2099-08-27T12:00:00.000+07:00",
  location: "Activity building",
  questFundingTotal: "250.50",
};

describe("Create Quest v2 model", () => {
  describe("canonical Board values", () => {
    test("maps the supported mode, participation, and location values", () => {
      expect(toQuestBoardModeValues({
        mode: "CANDIDATE",
        participation: "GROUP",
        locationMode: "ONLINE",
      })).toEqual({
        mode: "CANDIDATE",
        participation: "GROUP",
        locationMode: "online",
      });
    });
  });

  describe("condition items", () => {
    test("supports add, edit, remove, and ordered movement", () => {
      const added = addConditionItem(["first"]);
      expect(added).toEqual(["first", ""]);
      const edited = updateConditionItem(added, 1, "second");
      expect(moveConditionItem(edited, 1, "up")).toEqual(["second", "first"]);
      expect(removeConditionItem(["first", "second"], 0)).toEqual(["second"]);
    });

    test("requires a non-empty trimmed item and accepts exactly 255 characters", () => {
      expect(getConditionValidationErrors(["   "])).toEqual([
        "CONDITION_REQUIRED",
      ]);
      expect(
        getConditionValidationErrors([` ${"x".repeat(CONDITION_ITEM_MAX_LENGTH)} `]),
      ).toEqual([undefined]);
      expect(
        getConditionValidationErrors(["x".repeat(CONDITION_ITEM_MAX_LENGTH + 1)]),
      ).toEqual(["CONDITION_TOO_LONG"]);
    });

    test("publishes the ordered, trimmed condition object", () => {
      expect(toQuestDraftPayload(validDraft).condition).toEqual({
        items: ["Work is complete", "Leave the room clean"],
      });
    });
  });

  describe("mode and participation", () => {
    test.each(["FIRST_COME_FIRST_SERVED", "CANDIDATE"] as const)(
      "supports canonical mode %s",
      (mode) => {
        expect(toQuestDraftPayload({ ...validDraft, mode }).mode).toBe(mode);
      },
    );

    test("locks SINGLE to one and accepts GROUP headcount from 2 through 20", () => {
      expect(getHeadcountForParticipation("SINGLE", "9")).toBe("1");
      expect(toQuestDraftPayload({ ...validDraft, headcount: "9" }).headcount).toBe(1);
      expect(toQuestDraftPayload({ ...validDraft, participation: "GROUP", headcount: "2" }).headcount).toBe(2);
      expect(toQuestDraftPayload({ ...validDraft, participation: "GROUP", headcount: "20" }).headcount).toBe(20);
      expect(getQuestPublishCheck({ ...validDraft, participation: "GROUP", headcount: "1" }).blockers).toContain("HEADCOUNT_INVALID");
      expect(getQuestPublishCheck({ ...validDraft, participation: "GROUP", headcount: "21" }).blockers).toContain("HEADCOUNT_INVALID");
    });

    test("does not retain the legacy NO_CANDIDATE value in the production model", () => {
      expect(toQuestDraftPayload(validDraft)).not.toHaveProperty("NO_CANDIDATE");
      expect(["FIRST_COME_FIRST_SERVED", "CANDIDATE"]).toContain(validDraft.mode);
    });
  });

  describe("inclusive Quest Funding Total", () => {
    test("parses and formats the entered total without applying deductions", () => {
      expect(getDraftFundingTotalSatang({ questFundingTotal: "250.50" })).toBe(25050);
      expect(formatDraftFundingTotal({ questFundingTotal: "250.50" })).toBe("฿250.50");
      expect(getFundingValidationError("12.345")).toContain("up to 2");
      expect(getFundingValidationError(String(MAX_FUNDING_TOTAL_THB + 1))).toContain("between ฿0");
    });

    test("serializes questFundingTotal in Baht and omits legacy reward fields", () => {
      const payload = toQuestDraftPayload(validDraft);
      expect(payload.questFundingTotal).toBe(250.5);
      expect(payload).not.toHaveProperty("rewardSatang");
      expect(payload).not.toHaveProperty("reward");
      expect(getQuestPublishCheck({ ...validDraft, participation: "GROUP", headcount: "3" }).escrow).toMatchObject({
        headcount: 3,
        totalRequiredSatang: 75150,
        rewardPoolSatang: 0,
        platformFeeSatang: 0,
      });
    });

    test("keeps the old escrow calculator available only for fixture calculations", () => {
      expect(calculateQuestEscrow(101, 3, 500)).toMatchObject({
        rewardPoolSatang: 303,
        platformFeeSatangPerWorker: 6,
        platformFeeSatang: 18,
        totalRequiredSatang: 321,
      });
    });
  });

  describe("Bangkok schedule serialization", () => {
    test("serializes selected local picker values with the +07:00 offset", () => {
      const iso = getBangkokIsoDateTime(new Date(2099, 7, 26, 9, 5));
      expect(iso).toBe("2099-08-26T09:05:00.000+07:00");
      expect(isBangkokIsoDateTime(iso)).toBe(true);
      expect(toQuestDraftPayload({ ...validDraft, startTime: iso }).startTime).toBe(iso);
      expect(getBangkokDateTimeParts(iso)).toEqual({ date: "2099-08-26", time: "09:05" });
    });

    test("does not serialize timezone-less schedule values", () => {
      const payload = toQuestDraftPayload({ ...validDraft, startTime: "2099-08-26T09:00" });
      expect(payload).not.toHaveProperty("startTime");
      expect(payload.dueAt).toBe(validDraft.dueAt);
      expect(isBangkokIsoDateTime("2099-08-26T09:00")).toBe(false);
    });

    test("serializes an unselected optional dueAt as null", () => {
      expect(toQuestDraftPayload({ ...validDraft, dueAt: "" }).dueAt).toBeNull();
    });
  });

  describe("v2 request shape", () => {
    test("uses nullable description/tag and label-only locations", () => {
      expect(toQuestDraftPayload({ ...validDraft, description: "", tagId: "", locationMode: "ONLINE" })).toMatchObject({
        description: null,
        tagId: null,
        locations: [],
        proofRequired: true,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
      });
      expect(toQuestDraftPayload(validDraft).locations).toEqual([{ label: "Activity building" }]);
    });

    test("keeps fixture serialization isolated from the production v2 body", () => {
      const fixturePayload = toQuestFixtureDraftPayload(validDraft);
      expect(fixturePayload).toMatchObject({
        tag: tagId,
        conditions: "Work is complete\nLeave the room clean",
        rewardSatang: 25050,
        startDate: "2099-08-26",
        deadline: "2099-08-27",
      });
      expect(toQuestDraftPayload(validDraft)).not.toHaveProperty("conditions");
    });
  });

  describe("stored drafts", () => {
    test("round-trips only a versioned v2 schema", () => {
      const stored = JSON.stringify({ version: 2, draft: validDraft, step: 2, state: "DRAFT" });
      expect(parseStoredQuestDraft(stored)).toEqual(validDraft);
      expect(parseStoredQuestSnapshot(stored)).toMatchObject({ version: 2, step: 2, state: "DRAFT" });
    });

    test("requires review for legacy or incomplete v2 storage without inferring values", () => {
      expect(parseStoredQuestSnapshot(JSON.stringify({ conditions: "old", wage: "50" }))).toEqual({
        requiresReview: true,
        reason: "LEGACY_SCHEMA",
      });
      expect(parseStoredQuestSnapshot(JSON.stringify({ version: 2, draft: { title: "Missing fields" } }))).toEqual({
        requiresReview: true,
        reason: "INVALID_V2_DRAFT",
      });
      expect(parseStoredQuestSnapshot(JSON.stringify({
        version: 2,
        draft: validDraft,
        step: 4,
        state: "DRAFT",
      }))).toEqual({
        requiresReview: true,
        reason: "INVALID_V2_DRAFT",
      });
      expect(parseStoredQuestSnapshot(JSON.stringify({
        version: 2,
        draft: { ...validDraft, startTime: "2099-08-26T09:00" },
        step: 1,
        state: "DRAFT",
      }))).toEqual({
        requiresReview: true,
        reason: "INVALID_V2_DRAFT",
      });
      expect(parseStoredQuestDraft("{not-json")).toBeNull();
      expect(parseStoredQuestDraft("null")).toBeNull();
    });
  });

  describe("other model behavior", () => {
    test("detects edits including condition and funding changes", () => {
      expect(isQuestDraftDirty(initialDraft)).toBe(false);
      expect(isQuestDraftDirty({ ...initialDraft, conditionItems: ["one"] })).toBe(true);
      expect(isQuestDraftDirty({ ...initialDraft, questFundingTotal: "1" })).toBe(true);
      expect(isQuestDraftDirty({ ...initialDraft, proofRequired: false })).toBe(true);
      expect(isQuestDraftDirty({ ...initialDraft, locationMode: "ONLINE" })).toBe(true);
    });

    test("allows an image-free publish when required v2 fields are valid", () => {
      const check = getQuestPublishCheck(validDraft);
      expect(check.canPublish).toBe(true);
      expect(check.blockers).toEqual([]);
      expect(check.warnings).toContain("NO_IMAGES");
      expect(check.escrow).toMatchObject({
        headcount: 1,
        totalRequiredSatang: 25050,
        platformFeeSatang: 0,
      });
    });

    test("blocks a schedule whose dueAt is not after startTime", () => {
      const check = getQuestPublishCheck({
        ...validDraft,
        dueAt: validDraft.startTime,
      });
      expect(check.blockers).toContain("TIME_ORDER_INVALID");
      expect(check.canPublish).toBe(false);
    });

    test("keeps picker state behavior and time-only formatting", () => {
      const draftValue = new Date(2026, 9, 20, 15, 45);
      expect(getSchedulePickerValue("android", draftValue, new Date(2026, 7, 20))).toBe(draftValue);
      expect(getSchedulePickerValue("ios", draftValue, new Date(2026, 9, 21))).toEqual(new Date(2026, 9, 21));
      const timeOnlyPickerValue = new Date(0);
      timeOnlyPickerValue.setHours(7, 0, 0, 0);
      expect(getScheduleTimeValue(timeOnlyPickerValue)).toBe("07:00");
    });
  });
});
