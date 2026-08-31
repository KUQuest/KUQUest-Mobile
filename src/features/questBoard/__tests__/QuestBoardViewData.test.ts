import {
  applyQuestBoardFilters,
  getQuestAvailability,
  getStartTimeBucket,
  getVisibleQuests,
  getQuestBoardTags,
  getQuestImageCount,
  sortQuests,
} from "../questBoardViewData";
import {
  emptyQuestBoardFilter,
  QuestStatus,
  type QuestBoardFilter,
  type QuestBoardQuest,
} from "../types";
import {
  getLocalizedQuest,
  getLocalizedTag,
  questFixtures,
} from "../questFixtures";

const quests: QuestBoardQuest[] = [
  {
    id: "design-match",
    title: "Design a faculty event poster",
    tags: ["Design & creative", "Campus life"],
    description: "Create a poster for the faculty event.",
    completionCriteria: "A final PNG poster is approved.",
    proofRequired: "required",
    rewardPerPerson: 700,
    headcount: 2,
    acceptedParticipants: 1,
    startDate: "2026-08-14",
    deadline: "2026-08-16",
    timeRange: "17:00–20:00",
    postedAt: "2026-08-10T09:00:00.000Z",
    location: "On campus",
    locationMode: "on-campus",
    participationMode: "single",
    candidateMode: "CANDIDATE",
    creator: { name: "Nicha", faculty: "Architecture" },
    studentInterestMatch: true,
    ownerStudentId: "creator-1",
  },
  {
    id: "tech-soon",
    title: "Fix a small React bug",
    tags: ["Technology"],
    description: "Resolve a small UI issue.",
    completionCriteria: "The fix passes review.",
    proofRequired: "optional",
    rewardPerPerson: 450,
    headcount: 1,
    acceptedParticipants: 0,
    startDate: "2026-08-13",
    deadline: "2026-08-13",
    timeRange: "09:00–12:00",
    postedAt: "2026-08-11T09:00:00.000Z",
    location: "Online",
    locationMode: "online",
    participationMode: "single",
    candidateMode: "NO_CANDIDATE",
    creator: { name: "Ploy", faculty: "Engineering" },
    studentInterestMatch: false,
    ownerStudentId: "creator-2",
  },
  {
    id: "campus-full",
    title: "Welcome desk helper",
    tags: ["Campus life"],
    description: "Help visitors find their way.",
    completionCriteria: "Attend the full shift.",
    proofRequired: "none",
    rewardPerPerson: 300,
    headcount: 1,
    acceptedParticipants: 1,
    startDate: "2026-08-15",
    deadline: "2026-08-20",
    timeRange: "10:00–13:00",
    postedAt: "2026-08-09T09:00:00.000Z",
    location: "On campus",
    locationMode: "on-campus",
    participationMode: "single",
    candidateMode: "NO_CANDIDATE",
    creator: { name: "Beam", faculty: "Education" },
    studentInterestMatch: false,
    ownerStudentId: "creator-3",
  },
  {
    id: "own-quest",
    title: "My own quest",
    tags: ["Technology"],
    description: "Created by the current Student.",
    completionCriteria: "Complete it.",
    proofRequired: "none",
    rewardPerPerson: 1000,
    headcount: 1,
    acceptedParticipants: 0,
    startDate: "2026-08-14",
    deadline: "2026-08-20",
    timeRange: "18:00–21:00",
    postedAt: "2026-08-12T09:00:00.000Z",
    location: "Online",
    locationMode: "online",
    participationMode: "single",
    candidateMode: "CANDIDATE",
    creator: { name: "Current Student", faculty: "Engineering" },
    studentInterestMatch: true,
    ownerStudentId: "current-student",
  },
];

describe("Quest Board view data", () => {
  it("shows only discoverable Quests and excludes the current Student own Quest", () => {
    expect(
      getVisibleQuests(quests, {
        currentStudentId: "current-student",
        now: new Date("2026-08-12T09:00:00.000Z"),
      }).map((quest) => quest.id)
    ).toEqual(["design-match", "tech-soon"]);
  });

  it("shows only OPEN raw Quest statuses when the status projection is present", () => {
    const openQuest = { ...quests[0], status: QuestStatus.QUEST_OPEN };
    const assignedQuest = { ...quests[1], status: QuestStatus.QUEST_ASSIGNED };

    expect(
      getVisibleQuests([openQuest, assignedQuest], {
        now: new Date("2026-08-12T09:00:00.000Z"),
      }).map((quest) => quest.id)
    ).toEqual(["design-match"]);
  });

  it("filters by search text, tags, reward bounds, deadline, start time, and location", () => {
    const filter: QuestBoardFilter = {
      query: "poster",
      tags: ["Design & creative"],
      rewardMin: 700,
      rewardMax: 700,
      deadline: "within-7-days",
      startTimeBuckets: ["evening"],
      locationModes: ["on-campus"],
    };

    expect(
      applyQuestBoardFilters(quests, filter, {
        currentStudentId: "current-student",
        now: new Date("2026-08-12T09:00:00.000Z"),
      }).map((quest) => quest.id)
    ).toEqual(["design-match"]);
  });

  it("derives sorted tags and classifies start-time buckets", () => {
    expect(
      getQuestBoardTags(quests.filter((quest) => quest.id !== "campus-full"))
    ).toEqual(["Campus life", "Design & creative", "Technology"]);
    expect(getStartTimeBucket("11:59–12:30")).toBe("morning");
    expect(getStartTimeBucket("12:00–18:00")).toBe("afternoon");
    expect(getStartTimeBucket("16:59–17:30")).toBe("afternoon");
    expect(getStartTimeBucket("17:00–20:00")).toBe("evening");
    expect(getStartTimeBucket(undefined)).toBeNull();
    expect(getStartTimeBucket("not a schedule")).toBeNull();
  });

  it("searches creator, description, and location text", () => {
    const options = { now: new Date("2026-08-12T09:00:00.000Z") };
    expect(
      applyQuestBoardFilters(
        quests,
        { ...emptyQuestBoardFilter, query: "nicha" },
        options
      ).map((quest) => quest.id)
    ).toEqual(["design-match"]);
    expect(
      applyQuestBoardFilters(
        quests,
        { ...emptyQuestBoardFilter, query: "on campus" },
        options
      ).map((quest) => quest.id)
    ).toEqual(["design-match"]);
  });

  it("caps displayed image metadata at the three-image Quest limit", () => {
    expect(
      getQuestImageCount({
        ...quests[0],
        imageUris: ["one", "two", "three", "four"],
      })
    ).toBe(3);
    expect(getQuestImageCount(quests[0])).toBe(0);
  });

  it("uses inclusive reward bounds and OR semantics within tag and start-time facets", () => {
    const filter: QuestBoardFilter = {
      query: "",
      tags: ["Technology", "Design & creative"],
      rewardMin: 450,
      rewardMax: 800,
      deadline: null,
      startTimeBuckets: ["morning", "evening"],
      locationModes: [],
    };

    expect(
      applyQuestBoardFilters(quests, filter, {
        now: new Date("2026-08-12T09:00:00.000Z"),
      }).map((quest) => quest.id)
    ).toEqual(["design-match", "tech-soon"]);
  });

  it("uses deterministic secondary sort order", () => {
    const discoverable = getVisibleQuests(quests, {
      currentStudentId: "current-student",
      now: new Date("2026-08-12T09:00:00.000Z"),
    });

    expect(
      sortQuests(discoverable, "reward-highest").map((quest) => quest.id)
    ).toEqual(["design-match", "tech-soon"]);
    expect(
      sortQuests(discoverable, "deadline-soonest").map((quest) => quest.id)
    ).toEqual(["tech-soon", "design-match"]);
  });

  it("reports availability from capacity and deadline independently", () => {
    expect(
      getQuestAvailability(quests[2], new Date("2026-08-12T09:00:00.000Z"))
    ).toBe("full");
    expect(
      getQuestAvailability(quests[1], new Date("2026-08-14T09:00:00.000Z"))
    ).toBe("closed");
    expect(
      getQuestAvailability(quests[0], new Date("2026-08-12T09:00:00.000Z"))
    ).toBe("available");
  });

  it("localizes Quest content and tags for Thai without changing English", () => {
    expect(getLocalizedTag("moving", "th")).toBe("ยกของ");
    expect(
      getLocalizedQuest(
        { ...quests[0], id: "move-boxes", tags: ["moving"] },
        "th"
      )
    ).toMatchObject({
      title: "ช่วยยกกล่องไปหอพัก",
      tags: ["ยกของ"],
      description: "ช่วยขนกล่องที่ติดป้ายจากลานจอดรถไปยังหอพัก 13",
    });
    expect(getLocalizedQuest(quests[0], "en")).toBe(quests[0]);
  });

  it("localizes every Quest fixture for Thai", () => {
    questFixtures.forEach((quest) => {
      const localized = getLocalizedQuest(quest, "th");
      expect(localized).not.toBe(quest);
      expect(localized.tags).not.toEqual(quest.tags);
    });
  });
});
