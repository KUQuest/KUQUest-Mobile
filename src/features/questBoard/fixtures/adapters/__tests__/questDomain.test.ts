import {
  questFixtureAdapter,
  type QuestFixtureCreateInput,
} from "../questFixtureAdapter";

describe("quest domain projections", () => {
  const fixedNow = new Date("2026-08-12T09:00:00.000Z");

  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it("counts only incoming messages newer than the viewer read cursor", () => {
    const conversation = questFixtureAdapter.getConversation(
      "campus-survey-crew",
      "student-demo",
      fixedNow
    );

    expect(conversation?.unreadCount).toBe(2);

    const markedRead = questFixtureAdapter.markConversationRead(
      "campus-survey-crew",
      "student-demo",
      fixedNow
    );

    expect(markedRead.ok).toBe(true);
    if (markedRead.ok) expect(markedRead.value.unreadCount).toBe(0);
  });

  it("filters searchable team members by query and excludes occupied workers", () => {
    const members = questFixtureAdapter.searchMembers(
      "team-forming-demo",
      "WORKER B",
      "demo-team-leader",
      fixedNow
    );

    expect(members).toEqual([
      {
        id: "team-worker-b",
        workerId: "team-worker-b",
        displayName: "Team Worker B",
      },
    ]);
  });

  it("uses the default viewer as the omitted team leader", () => {
    const payload: QuestFixtureCreateInput = {
      title: "Find a campus team",
      tag: "campus-life",
      description: "Find a team for the event.",
      conditions: "Join the event team.",
      proofRequired: "none",
      startDate: "2099-08-26",
      deadline: "2099-08-27",
      startTime: "09:00",
      endTime: "12:00",
      location: { label: "Student activity building" },
      candidateMode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      rewardSatang: 10000,
      imageUris: [],
    };
    const created = questFixtureAdapter.createAndPublishQuest(
      payload,
      "demo-hirer",
      fixedNow
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const formed = questFixtureAdapter.createTeam(
      created.state.quest.id,
      undefined,
      fixedNow
    );
    expect(formed.ok).toBe(true);
    if (!formed.ok) return;

    expect(
      questFixtureAdapter.searchMembers(
        created.state.quest.id,
        "worker",
        undefined,
        fixedNow
      )
    ).toEqual([
      {
        id: "demo-worker-2",
        workerId: "demo-worker-2",
        displayName: "Demo Worker 2",
      },
      {
        id: "demo-worker-3",
        workerId: "demo-worker-3",
        displayName: "Demo Worker 3",
      },
      {
        id: "demo-worker-4",
        workerId: "demo-worker-4",
        displayName: "Demo Worker 4",
      },
      {
        id: "team-worker-a",
        workerId: "team-worker-a",
        displayName: "Team Worker A",
      },
      {
        id: "team-worker-b",
        workerId: "team-worker-b",
        displayName: "Team Worker B",
      },
      {
        id: "team-worker-c",
        workerId: "team-worker-c",
        displayName: "Team Worker C",
      },
    ]);
  });
});
