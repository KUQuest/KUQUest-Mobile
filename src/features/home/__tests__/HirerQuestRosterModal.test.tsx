import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { HirerQuestRosterModal } from "../components/HirerQuestRosterModal";

describe("HirerQuestRosterModal", () => {
  const defaultProps = {
    visible: true,
    questTitle: "Science Exhibition Booth Setup",
    questId: "quest-123",
    status: "QUEST_ASSIGNED" as const,
    headcount: 2,
    assignedWorkers: [
      {
        id: "worker-1",
        displayName: "Chat Worker",
        faculty: "Engineering",
      },
    ],
    applicants: [
      {
        id: "applicant-1",
        displayName: "Somchai Applicant",
        faculty: "Science",
      },
    ],
    onClose: jest.fn(),
    onOpenWorkerProfile: jest.fn(),
    onOpenManageQuest: jest.fn(),
  };
  it("renders assigned workers and applicants with their names and faculties", async () => {
    const { getByText, getByTestId } = await render(
      <HirerQuestRosterModal {...defaultProps} />
    );

    expect(getByText("Science Exhibition Booth Setup")).toBeTruthy();
    expect(getByText("Chat Worker")).toBeTruthy();
    expect(getByText("Engineering")).toBeTruthy();
    expect(getByText("Somchai Applicant")).toBeTruthy();
    expect(getByText("Science")).toBeTruthy();

    expect(getByTestId("roster-worker-worker-1")).toBeTruthy();
    expect(getByTestId("roster-applicant-applicant-1")).toBeTruthy();
  });
  it("triggers profile navigation when tapping view profile", async () => {
    const onOpenWorkerProfile = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = await render(
      <HirerQuestRosterModal
        {...defaultProps}
        onClose={onClose}
        onOpenWorkerProfile={onOpenWorkerProfile}
      />
    );

    fireEvent.press(getByTestId("roster-worker-profile-worker-1"));
    expect(onClose).toHaveBeenCalled();
    expect(onOpenWorkerProfile).toHaveBeenCalledWith("worker-1");
  });

  it("triggers manage quest navigation when tapping manage button", async () => {
    const onOpenManageQuest = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = await render(
      <HirerQuestRosterModal
        {...defaultProps}
        onClose={onClose}
        onOpenManageQuest={onOpenManageQuest}
      />
    );

    fireEvent.press(getByTestId("hirer-roster-manage-button"));
    expect(onClose).toHaveBeenCalled();
    expect(onOpenManageQuest).toHaveBeenCalledWith("quest-123");
  });
});
