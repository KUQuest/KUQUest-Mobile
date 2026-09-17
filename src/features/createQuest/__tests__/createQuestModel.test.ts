import {
  adaptV2PublishCheck,
  addDaysToDate,
  addHoursToTime,
  calculateQuestEscrow,
  formatBangkokIso,
  formatDraftReward,
  formatQuestDuration,
  getDraftRewardSatang,
  getHeadcountForParticipation,
  getNearestQuarterHour,
  getQuestApiErrorMessage,
  getQuestPublishCheck,
  getRelativeDateValue,
  getRewardValidationError,
  getSchedulePickerValue,
  getScheduleTimeValue,
  initialDraft,
  isQuestDraftDirty,
  MAX_REWARD_THB,
  MIN_REWARD_THB,
  parseStoredQuestDraft,
  parseStoredQuestSnapshot,
  toBangkokDateTime,
  toQuestDraftPayload,
  toQuestV2Payload,
  toQuestBoardModeValues,
} from "../createQuestModel";
import type { QuestV2PublishCheck } from "@/api/questV2Contracts";
import { createQuestMessages } from "@/locales/createQuestMessages";

describe("Create Quest model", () => {
  describe("getHeadcountForParticipation", () => {
    test("always returns one Worker for SINGLE", () => {
      expect(getHeadcountForParticipation("SINGLE", "")).toBe("1");
      expect(getHeadcountForParticipation("SINGLE", "4")).toBe("1");
    });

    test("keeps the editable maximum for GROUP", () => {
      expect(getHeadcountForParticipation("GROUP", "4")).toBe("4");
    });
  });

  describe("isQuestDraftDirty", () => {
    test("detects proof and location changes", () => {
      expect(
        isQuestDraftDirty({ ...initialDraft, proofRequired: "optional" })
      ).toBe(true);
      expect(
        isQuestDraftDirty({ ...initialDraft, locationMode: "ONLINE" })
      ).toBe(true);
    });

    test("does not flag an untouched draft", () => {
      expect(isQuestDraftDirty(initialDraft)).toBe(false);
    });
  });

  describe("toQuestBoardModeValues", () => {
    test("maps draft values through the canonical Quest Board vocabulary", () => {
      expect(
        toQuestBoardModeValues({
          candidateMode: "CANDIDATE",
          participation: "GROUP",
          locationMode: "ONLINE",
        })
      ).toEqual({
        candidateMode: "CANDIDATE",
        participationMode: "team",
        locationMode: "online",
      });
    });
  });

  describe("getRewardValidationError", () => {
    test("accepts the minimum funding amount and values with up to two decimal places", () => {
      expect(getRewardValidationError(String(MIN_REWARD_THB))).toBeUndefined();
      expect(getRewardValidationError("1250.50")).toBeUndefined();
    });

    test("rejects malformed decimal values", () => {
      expect(getRewardValidationError("12.345")).toContain(
        "up to 2 decimal places"
      );
      expect(getRewardValidationError("1.2.3")).toContain(
        "up to 2 decimal places"
      );
    });

    test("rejects rewards outside the 1 to 700,000 THB funding bounds", () => {
      expect(getRewardValidationError("0")).toContain("between ฿0");
      expect(getRewardValidationError(String(MAX_REWARD_THB))).toBeUndefined();
      expect(getRewardValidationError("700001")).toContain("between ฿0");
    });
  });

  describe("headcount publish validation", () => {
    const publishableGroupDraft = {
      ...initialDraft,
      title: "Quest",
      description: "Do work",
      conditions: "Work is complete",
      startDate: "2099-08-26",
      deadline: "2099-08-27",
      startTime: "09:00",
      endTime: "12:00",
      location: "Activity building",
      wage: "250",
      participation: "GROUP" as const,
    };

    test.each(["0", "-2", "", "not-a-number", "2.5"])(
      "blocks invalid GROUP headcount %p without one-place escrow fallback",
      (headcount) => {
        const check = getQuestPublishCheck({
          ...publishableGroupDraft,
          headcount,
        });

        expect(check.blockers).toContain("HEADCOUNT_INVALID");
        expect(check.canPublish).toBe(false);
        expect(check.escrow).toMatchObject({
          headcount: 0,
          rewardPoolSatang: 0,
          platformFeeSatang: 0,
          totalRequiredSatang: 0,
        });
      }
    );

    test("preserves a valid positive GROUP headcount for publishing and escrow", () => {
      const check = getQuestPublishCheck({
        ...publishableGroupDraft,
        headcount: "3",
      });

      expect(check.blockers).not.toContain("HEADCOUNT_INVALID");
      expect(check.canPublish).toBe(true);
      expect(check.escrow).toMatchObject({
        headcount: 3,
        rewardPoolSatang: 71427,
        totalRequiredSatang: 75000,
      });
    });

    test("keeps the SINGLE headcount invariant at one", () => {
      const draft = {
        ...publishableGroupDraft,
        participation: "SINGLE" as const,
        headcount: "9",
      };
      const check = getQuestPublishCheck(draft);

      expect(toQuestDraftPayload(draft).headcount).toBe(1);
      expect(check.blockers).not.toContain("HEADCOUNT_INVALID");
      expect(check.escrow.headcount).toBe(1);
    });
  });

  describe("satang payload and Escrow", () => {
    test("parses THB input into integer satang without floating point rounding", () => {
      expect(getDraftRewardSatang({ wage: "1250.50" })).toBe(125050);
      expect(getDraftRewardSatang({ wage: "12.345" })).toBeNull();
      expect(formatDraftReward({ wage: "1250.50" })).toBe("฿1,250.50");
    });

    test("uses a label-only location and canonical mode values in the payload", () => {
      const payload = toQuestDraftPayload({
        ...initialDraft,
        wage: "250.50",
        location: "Library entrance",
        locationMode: "ON_CAMPUS",
        participation: "GROUP",
        headcount: "3",
        candidateMode: "CANDIDATE",
      });
      expect(payload).toMatchObject({
        rewardSatang: 25050,
        participation: "GROUP",
        candidateMode: "CANDIDATE",
        location: { label: "Library entrance" },
      });
      expect(Object.keys(payload.location)).toEqual(["label"]);
    });

    test("maps a draft to the canonical v2 create request", () => {
      const payload = toQuestV2Payload({
        ...initialDraft,
        title: "Clean the library",
        tag: "11111111-1111-4111-8111-111111111111",
        description: "Clean the shared library.",
        conditions: "The library is clean.",
        startDate: "2099-08-26",
        deadline: "2099-08-27",
        startTime: "09:00",
        endTime: "12:00",
        locationMode: "ON_CAMPUS",
        location: "Main library",
        candidateMode: "CANDIDATE",
        participation: "GROUP",
        headcount: "3",
        wage: "250.50",
      });

      expect(payload).toEqual({
        title: "Clean the library",
        description: "Clean the shared library.",
        condition: { items: ["The library is clean."] },
        mode: "CANDIDATE",
        participation: "GROUP",
        questFundingTotal: 250.5,
        headcount: 3,
        startTime: "2099-08-26T09:00:00+07:00",
        dueAt: "2099-08-27T12:00:00+07:00",
        tagId: "11111111-1111-4111-8111-111111111111",
        proofRequired: true,
        locations: [{ label: "Main library" }],
      });
    });

    test("omits dueAt when the deadline is not fully scheduled", () => {
      const payload = toQuestV2Payload({
        ...initialDraft,
        title: "Clean the library",
        conditions: "The library is clean.",
        startDate: "2099-08-26",
        startTime: "09:00",
        wage: "250",
      });
      expect(payload.dueAt).toBeNull();
      expect(payload.startTime).toBe(toBangkokDateTime("2099-08-26", "09:00"));
    });

    test("splits multi-line completion criteria into condition items", () => {
      const payload = toQuestV2Payload({
        ...initialDraft,
        title: "Clean the library",
        conditions: "Photo uploaded\n\n Library is clean \nTrash removed",
        startDate: "2099-08-26",
        startTime: "09:00",
        wage: "250",
      });
      expect(payload.condition.items).toEqual([
        "Photo uploaded",
        "Library is clean",
        "Trash removed",
      ]);
    });

    test("omits non-server fallback tag values from the API payload", () => {
      const payload = toQuestV2Payload({
        ...initialDraft,
        tag: "design",
      });

      expect(payload.tagId).toBeNull();
    });

    test("reports reward pool plus per-Worker Platform Fee with ceiling rounding", () => {
      expect(calculateQuestEscrow(101, 3, 500)).toMatchObject({
        rewardPoolSatang: 288,
        platformFeeSatangPerWorker: 5,
        platformFeeSatang: 15,
        totalRequiredSatang: 303,
      });
    });

    test("allows an image-free publish with a warning when required fields are valid", () => {
      const check = getQuestPublishCheck({
        ...initialDraft,
        title: "Quest",
        description: "Do work",
        conditions: "Work is complete",
        startDate: "2099-08-26",
        deadline: "2099-08-27",
        startTime: "09:00",
        endTime: "12:00",
        location: "Activity building",
        wage: "250",
      });
      expect(check.canPublish).toBe(true);
      expect(check.blockers).toEqual([]);
      expect(check.warnings).toContain("NO_IMAGES");
      expect(check.escrow.totalRequiredSatang).toBe(25000);
    });
  });

  describe("Bangkok time conversion", () => {
    test("formats instants as RFC 3339 with the fixed +07:00 Bangkok offset", () => {
      expect(formatBangkokIso(new Date("2026-10-15T02:00:00Z"))).toBe(
        "2026-10-15T09:00:00+07:00"
      );
      expect(formatBangkokIso(new Date("2026-10-15T18:30:05Z"))).toBe(
        "2026-10-16T01:30:05+07:00"
      );
    });

    test("converts a local schedule selection to Bangkok time or null", () => {
      const localNoon = new Date(2026, 9, 15, 9, 0, 0);
      expect(toBangkokDateTime("2026-10-15", "09:00")).toBe(
        formatBangkokIso(localNoon)
      );
      expect(toBangkokDateTime("26-10-2026", "09:00")).toBeNull();
      expect(toBangkokDateTime("2026-10-15", "9:00")).toBeNull();
      expect(toBangkokDateTime("2026-10-15", "24:00")).toBeNull();
      expect(toBangkokDateTime("2099-02-30", "10:00")).toBeNull();
    });
  });

  describe("adaptV2PublishCheck", () => {
    const serverCheck: QuestV2PublishCheck = {
      canPublish: false,
      blockingReasons: [
        { code: "QUEST_TAG_REQUIRED", message: "Select a tag." },
        { code: "INSUFFICIENT_SPENDING_BALANCE", message: "Top up." },
      ],
      warnings: [{ code: "NO_IMAGES", message: "Optional." }],
      questFundingTotal: 500,
      questFundingTotalSatang: 50000,
      questReward: 490,
      questRewardSatang: 49000,
      platformFee: 10,
      platformFeeSatang: 1000,
      escrowRequirement: 500,
      escrowRequirementSatang: 50000,
      headcount: 3,
      platformFeeBps: 200,
      feeRoundingMode: "UP",
      policyRevisionId: "7df4ea20-21a4-4f01-9a70-3882bbd12345",
      policyRevision: 1,
    };

    test("projects the server quote into the client publish check", () => {
      expect(adaptV2PublishCheck(serverCheck)).toEqual({
        canPublish: false,
        blockers: ["QUEST_TAG_REQUIRED", "INSUFFICIENT_SPENDING_BALANCE"],
        warnings: ["NO_IMAGES"],
        escrow: {
          rewardPoolSatang: 147000,
          platformFeeSatang: 3000,
          totalRequiredSatang: 50000,
          headcount: 3,
          rewardSatangPerWorker: 49000,
          platformFeeSatangPerWorker: 1000,
          feeRateBasisPoints: 200,
        },
      });
    });

    test("keeps a publishable check free of blockers", () => {
      const ready = adaptV2PublishCheck({
        ...serverCheck,
        canPublish: true,
        blockingReasons: [],
        warnings: [],
      });
      expect(ready.canPublish).toBe(true);
      expect(ready.blockers).toEqual([]);
      expect(ready.escrow.totalRequiredSatang).toBe(50000);
    });
  });

  describe("getQuestApiErrorMessage", () => {
    test("maps known API error codes to localized messages", () => {
      expect(
        getQuestApiErrorMessage("INVALID_QUEST_FUNDING_TOTAL", "en")
      ).toContain("700,000");
      expect(getQuestApiErrorMessage("INVALID_TITLE", "th")).toContain("120");
      expect(getQuestApiErrorMessage("INVALID_TITLE", "en")).not.toBe(
        getQuestApiErrorMessage("INVALID_TITLE", "th")
      );
    });

    test("falls back to the generic save error for unknown codes", () => {
      expect(getQuestApiErrorMessage("MYSTERY_CODE", "en")).toBe(
        createQuestMessages.en.saveError
      );
      expect(getQuestApiErrorMessage("MYSTERY_CODE", "th")).toBe(
        createQuestMessages.th.saveError
      );
    });
  });

  describe("localized blocking guidance", () => {
    test("covers every publish blocker code in both locales", () => {
      const codes = [
        "QUEST_TAG_REQUIRED",
        "QUEST_DUE_AT_REQUIRED",
        "QUEST_DUE_AT_NOT_AFTER_START_TIME",
        "QUEST_START_TIME_NOT_IN_FUTURE",
        "QUEST_CONDITION_REQUIRED",
        "QUEST_HEADCOUNT_INVALID",
        "WALLET_NOT_ACTIVE",
        "INSUFFICIENT_SPENDING_BALANCE",
      ] as const;

      for (const locale of ["en", "th"] as const) {
        for (const code of codes) {
          const guidance = createQuestMessages[locale].blockingGuidance[code];
          const text =
            typeof guidance === "function" ? guidance("50.00") : guidance;
          expect(text.length).toBeGreaterThan(0);
        }
        expect(createQuestMessages[locale].topUpAction.length).toBeGreaterThan(
          0
        );
      }
    });
  });

  describe("getSchedulePickerValue", () => {
    test("uses the latest draft value on Android instead of stale iOS picker state", () => {
      const draftValue = new Date(2026, 9, 20, 15, 45);
      const stalePickerValue = new Date(2026, 7, 20, 9, 0);

      expect(
        getSchedulePickerValue("android", draftValue, stalePickerValue)
      ).toBe(draftValue);
    });

    test("keeps the temporary spinner value on iOS", () => {
      const draftValue = new Date(2026, 9, 20, 15, 45);
      const temporaryPickerValue = new Date(2026, 9, 21, 16, 0);

      expect(
        getSchedulePickerValue("ios", draftValue, temporaryPickerValue)
      ).toBe(temporaryPickerValue);
    });
  });

  describe("getScheduleTimeValue", () => {
    test("keeps the selected time independent from an epoch date", () => {
      const timeOnlyPickerValue = new Date(0);
      timeOnlyPickerValue.setHours(7, 0, 0, 0);

      expect(getScheduleTimeValue(timeOnlyPickerValue)).toBe("07:00");
    });
  });

  describe("addHoursToTime", () => {
    test("adds hours correctly within same day", () => {
      expect(addHoursToTime("09:00", 2)).toBe("11:00");
      expect(addHoursToTime("14:30", 3)).toBe("17:30");
    });

    test("wraps around midnight", () => {
      expect(addHoursToTime("23:15", 2)).toBe("01:15");
    });
  });

  describe("formatQuestDuration", () => {
    test("formats duration in Thai", () => {
      const start = new Date("2026-09-20T09:00:00").getTime();
      const end = new Date("2026-09-20T12:30:00").getTime();
      expect(formatQuestDuration(start, end, "th")).toBe("3 ชั่วโมง 30 นาที");
    });

    test("formats duration in English with days and hours", () => {
      const start = new Date("2026-09-20T09:00:00").getTime();
      const end = new Date("2026-09-21T11:00:00").getTime();
      expect(formatQuestDuration(start, end, "en")).toBe("1d 2h");
    });

    test("returns empty string when end is before or equal to start", () => {
      const time = new Date("2026-09-20T09:00:00").getTime();
      expect(formatQuestDuration(time, time)).toBe("");
      expect(formatQuestDuration(time, time - 1000)).toBe("");
    });
  });

  describe("getRelativeDateValue", () => {
    test("returns YYYY-MM-DD pattern for today and tomorrow", () => {
      expect(getRelativeDateValue(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(getRelativeDateValue(1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("addDaysToDate", () => {
    test("adds days to YYYY-MM-DD correctly", () => {
      expect(addDaysToDate("2026-09-20", 1)).toBe("2026-09-21");
      expect(addDaysToDate("2026-09-30", 1)).toBe("2026-10-01");
    });
  });

  describe("getNearestQuarterHour", () => {
    test("rounds up minutes to nearest 5 minutes", () => {
      const d = new Date(2026, 8, 20, 14, 12);
      expect(getNearestQuarterHour(d)).toEqual({ hours: "14", minutes: "15" });
    });
  });

  describe("parseStoredQuestDraft", () => {
    test("clears epoch dates left by the old time picker flow", () => {
      expect(
        parseStoredQuestDraft(
          JSON.stringify({ startDate: "1970-01-01", startTime: "07:00" })
        )
      ).toMatchObject({
        startDate: "",
        startTime: "07:00",
      });
    });

    test("restores valid fields and limits image previews to three", () => {
      const draft = parseStoredQuestDraft(
        JSON.stringify({
          title: "Design a poster",
          tag: "design",
          imageUris: ["one", "two", "three", "four"],
          candidateMode: "review",
          participation: "team",
        })
      );

      expect(draft).toMatchObject({
        title: "Design a poster",
        tag: "design",
        candidateMode: "CANDIDATE",
        participation: "GROUP",
      });
      expect(draft?.imageUris).toEqual(["one", "two", "three"]);
    });

    test("migrates legacy mode and participation values", () => {
      expect(
        parseStoredQuestDraft(
          JSON.stringify({
            candidateMode: "NO_CANDIDATE",
            participation: "single",
          })
        )
      ).toMatchObject({
        candidateMode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        headcount: "1",
      });
    });

    test("restores the current step, state, schedule, and location mode", () => {
      expect(
        parseStoredQuestSnapshot(
          JSON.stringify({
            draft: {
              startTime: "09:00",
              endTime: "12:00",
              locationMode: "on-campus",
              location: "Faculty building",
            },
            step: 2,
            state: "OPEN",
          })
        )
      ).toMatchObject({
        step: 2,
        state: "OPEN",
        draft: {
          startTime: "09:00",
          endTime: "12:00",
          locationMode: "ON_CAMPUS",
          location: "Faculty building",
        },
      });
    });

    test("supports legacy flat drafts with safe defaults", () => {
      expect(
        parseStoredQuestSnapshot(
          JSON.stringify({ title: "Legacy Quest", state: "DRAFT" })
        )
      ).toMatchObject({
        step: 1,
        state: "DRAFT",
        draft: {
          title: "Legacy Quest",
          startTime: "",
          endTime: "",
          locationMode: "ON_CAMPUS",
        },
      });
    });

    test("normalizes unsupported stored values and enforces single headcount", () => {
      expect(
        parseStoredQuestDraft(
          JSON.stringify({
            participation: "SINGLE",
            candidateMode: "unknown",
            locationMode: "unknown",
            headcount: "9",
            imageUris: [1, "valid", null],
          })
        )
      ).toMatchObject({
        participation: "SINGLE",
        candidateMode: "FIRST_COME_FIRST_SERVED",
        locationMode: "ON_CAMPUS",
        headcount: "1",
        imageUris: ["valid"],
      });
    });

    test("ignores corrupt stored data", () => {
      expect(parseStoredQuestDraft("{not-json")).toBeNull();
      expect(parseStoredQuestDraft("null")).toBeNull();
      expect(parseStoredQuestSnapshot("{not-json")).toBeNull();
    });
  });
});
