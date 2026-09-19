import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { HirerQuestProgressCard } from "../components/HirerQuestProgressCard";

describe("HirerQuestProgressCard", () => {
  it("renders single assigned worker and triggers profile navigation", async () => {
    const onOpenWorkerProfile = jest.fn();
    const { getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q1"
        title="Science Project"
        status="QUEST_ASSIGNED"
        dueAt="2026-09-20T17:00:00.000+07:00"
        onOpenDetails={jest.fn()}
        onOpenWorkerProfile={onOpenWorkerProfile}
        assignedWorkers={[
          {
            id: "worker-1",
            displayName: "Chat Worker",
            faculty: "Engineering",
          },
        ]}
      />
    );

    expect(getByText("Science Project")).toBeTruthy();
    expect(getByText("Chat Worker")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-worker-q1")).toBeTruthy();

    fireEvent.press(getByTestId("hirer-quest-card-worker-profile-q1"));
    expect(onOpenWorkerProfile).toHaveBeenCalledWith("worker-1");
  });

  it("renders multiple assigned workers and triggers roster view", async () => {
    const onViewRoster = jest.fn();
    const { getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q2"
        title="Group Booth"
        status="QUEST_ASSIGNED"
        headcount={3}
        dueAt="2026-09-21T17:00:00.000+07:00"
        onOpenDetails={jest.fn()}
        onViewRoster={onViewRoster}
        assignedWorkers={[
          { id: "w1", displayName: "Worker One" },
          { id: "w2", displayName: "Worker Two" },
        ]}
      />
    );

    expect(getByText("ผู้เข้าร่วม (2/3 คน)")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-workers-q2")).toBeTruthy();

    fireEvent.press(getByTestId("hirer-quest-card-workers-q2"));
    expect(onViewRoster).toHaveBeenCalled();
  });

  it("renders applicants banner and triggers roster view", async () => {
    const onViewRoster = jest.fn();
    const { getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q3"
        title="Design Logo"
        status="QUEST_OPEN"
        dueAt="2026-09-22T17:00:00.000+07:00"
        onOpenDetails={jest.fn()}
        onViewRoster={onViewRoster}
        applicants={[
          { id: "a1", displayName: "Applicant A" },
          { id: "a2", displayName: "Applicant B" },
        ]}
      />
    );

    expect(getByText("ผู้สมัคร (2 คน)")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-applicants-q3")).toBeTruthy();

    fireEvent.press(getByTestId("hirer-quest-card-applicants-q3"));
    expect(onViewRoster).toHaveBeenCalled();
  });
  it("renders waiting banner when no applicants or workers", async () => {
    const onOpenDetails = jest.fn();
    const { getAllByText, getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q4"
        title="Empty Quest"
        status="QUEST_OPEN"
        dueAt="2026-09-23T17:00:00.000+07:00"
        onOpenDetails={onOpenDetails}
      />
    );

    expect(getAllByText("เปิดรับสมัคร").length).toBeGreaterThanOrEqual(1);
    expect(getByText("ยังไม่มีผู้สมัคร")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-waiting-q4")).toBeTruthy();

    fireEvent.press(getByTestId("hirer-quest-card-waiting-q4"));
    expect(onOpenDetails).toHaveBeenCalled();
  });
});
