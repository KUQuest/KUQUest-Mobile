import React from "react";
import { fireEvent, within } from "@testing-library/react-native";
import { renderWithAppTheme as render } from "@/testing/queryTestUtils";

import { HirerQuestProgressCard } from "../components/HirerQuestProgressCard";

describe("HirerQuestProgressCard", () => {
  it("keeps participant, profile and Quest details actions independent", async () => {
    const onOpenWorkerProfile = jest.fn();
    const onViewRoster = jest.fn();
    const onOpenDetails = jest.fn();
    const { getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q1"
        title="Science Project"
        status="QUEST_ASSIGNED"
        dueAt="2026-09-20T17:00:00.000+07:00"
        onOpenDetails={onOpenDetails}
        onOpenWorkerProfile={onOpenWorkerProfile}
        onViewRoster={onViewRoster}
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
    expect(getByText(/คณะวิศวกรรมศาสตร์/)).toBeTruthy();

    await fireEvent.press(getByTestId("hirer-quest-card-worker-profile-q1"));
    expect(onOpenWorkerProfile).toHaveBeenCalledWith("worker-1");
    expect(onViewRoster).not.toHaveBeenCalled();
    expect(onOpenDetails).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId("hirer-quest-card-worker-q1"));
    expect(onViewRoster).toHaveBeenCalledTimes(1);
    expect(onOpenDetails).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId("hirer-quest-card-details-q1"));
    expect(onOpenDetails).toHaveBeenCalledTimes(1);
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

    await fireEvent.press(getByTestId("hirer-quest-card-workers-q2"));
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

    await fireEvent.press(getByTestId("hirer-quest-card-applicants-q3"));
    expect(onViewRoster).toHaveBeenCalled();
  });
  it("renders waiting banner when no applicants or workers", async () => {
    const onOpenDetails = jest.fn();
    const { getByText, getByTestId } = await render(
      <HirerQuestProgressCard
        questId="q4"
        title="Empty Quest"
        status="QUEST_OPEN"
        dueAt="2026-09-23T17:00:00.000+07:00"
        onOpenDetails={onOpenDetails}
      />
    );

    expect(getByText("ยังไม่มีผู้สมัคร")).toBeTruthy();

    await fireEvent.press(getByTestId("hirer-quest-card-waiting-q4"));
    expect(onOpenDetails).toHaveBeenCalled();
  });
  it("shows completed Quests at the final accessible progress step", async () => {
    const { getByTestId, getByText } = await render(
      <HirerQuestProgressCard
        questId="q5"
        title="Finished Quest"
        status="QUEST_COMPLETED"
        onOpenDetails={jest.fn()}
      />
    );

    expect(getByText("ขั้นตอนที่ 5 จาก 5")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-progress-q5").props).toMatchObject({
      accessibilityRole: "progressbar",
      accessibilityValue: { min: 1, max: 5, now: 5 },
    });
    expect(
      getByTestId("hirer-quest-card-progress-q5").props.accessibilityLabel
    ).toContain("ขั้นตอนที่ 5 จาก 5");
  });

  it("shows the Quest start and end times with every timeline stage", async () => {
    const { getByTestId, getByText } = await render(
      <HirerQuestProgressCard
        questId="q6"
        title="Scheduled Quest"
        status="QUEST_ASSIGNED"
        startTime="2026-09-20T09:00:00.000+07:00"
        dueAt="2026-09-25T06:30:00.000+07:00"
        onOpenDetails={jest.fn()}
      />
    );

    expect(getByText("20 ก.ย. 2026 09:00")).toBeTruthy();
    expect(getByText("25 ก.ย. 2026 06:30")).toBeTruthy();
    expect(
      getByTestId("hirer-quest-card-schedule-q6").props.accessibilityLabel
    ).toBe("เริ่มงาน 20 ก.ย. 2026 09:00. สิ้นสุด 25 ก.ย. 2026 06:30");
    const timeline = within(getByTestId("hirer-quest-card-progress-q6"));
    for (const label of [
      "เปิดรับสมัคร",
      "รอเริ่มงาน",
      "กำลังทำงาน",
      "ส่งงาน / ตรวจรับ",
      "เสร็จสิ้น",
    ]) {
      expect(timeline.getByText(label)).toBeTruthy();
    }
  });
});
