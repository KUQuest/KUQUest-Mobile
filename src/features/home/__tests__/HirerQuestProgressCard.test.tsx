import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import { QuestStatus } from "@/features/questBoard/types";

import {
  HirerQuestProgressCard,
  type HirerQuestProgressCardProps,
} from "../components/HirerQuestProgressCard";

jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("HirerQuestProgressCard", () => {
  const baseProps: HirerQuestProgressCardProps = {
    questId: "quest-progress-1",
    title: "Sweep the area around campus",
    status: QuestStatus.QUEST_IN_PROGRESS,
    worker: {
      id: "worker-1",
      displayName: "Nattaphon Jaidee",
    },
    dueAt: "2026-09-19T18:00:00+07:00",
    onOpenDetails: jest.fn(),
    onOpenWorkerProfile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the Quest, Worker, readable progress, and due action", async () => {
    const view = await render(<HirerQuestProgressCard {...baseProps} />);

    expect(view.getByText("Sweep the area around campus")).toBeTruthy();
    expect(view.getByText("Nattaphon Jaidee")).toBeTruthy();
    expect(view.getAllByText("In progress")).toHaveLength(2);
    expect(view.getByText("QUEST TIMELINE")).toBeTruthy();
    const card = view.getByTestId("hirer-quest-card-quest-progress-1");
    expect(card.props.accessibilityLabel).toContain("QUEST TIMELINE");
    expect(card.props.accessibilityLabel).toContain("Open for applications");
    expect(card.props.accessibilityLabel).toContain("In progress");
    expect(view.getByText("Due 19 Sept · 18:00")).toBeTruthy();
    expect(view.queryByText("QUEST_IN_PROGRESS")).toBeNull();

    await fireEvent.press(
      view.getByTestId("hirer-quest-card-details-quest-progress-1")
    );
    await fireEvent.press(
      view.getByTestId("hirer-quest-card-worker-quest-progress-1")
    );
    expect(baseProps.onOpenDetails).toHaveBeenCalledTimes(1);
    expect(baseProps.onOpenWorkerProfile).toHaveBeenCalledTimes(1);
  });

  it("keeps terminal status readable without exposing the transport enum", async () => {
    const view = await render(
      <HirerQuestProgressCard
        {...baseProps}
        status={QuestStatus.QUEST_FAILED}
      />
    );

    expect(view.getAllByText("Not completed")).toHaveLength(2);
    expect(view.queryByText("QUEST_FAILED")).toBeNull();
  });
});
