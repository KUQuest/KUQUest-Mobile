import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { WorkerQuickAccessBar } from "../WorkerQuickAccessBar";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("WorkerQuickAccessBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null when assignment is null", async () => {
    const view = await render(
      <WorkerQuickAccessBar assignment={null} bottomInset={60} />
    );

    expect(view.toJSON()).toBeNull();
  });

  it("renders null when assignment state is COMPLETED", async () => {
    const view = await render(
      <WorkerQuickAccessBar
        assignment={{
          id: "assign-comp",
          questId: "quest-12345678",
          workerId: "worker-1",
          state: "ASSIGNMENT_COMPLETED",
          questState: "QUEST_COMPLETED",
          startedAt: null,
          createdAt: "2026-09-18T00:00:00Z",
        }}
        bottomInset={60}
      />
    );

    expect(view.toJSON()).toBeNull();
  });

  it("renders the floating bar when assignment is active", async () => {
    const view = await render(
      <WorkerQuickAccessBar
        assignment={{
          id: "assign-act",
          questId: "11223344-5566-7788-9900-aabbccddeeff",
          workerId: "worker-1",
          state: "ASSIGNMENT_ACTIVE",
          questState: "QUEST_IN_PROGRESS",
          startedAt: "2026-09-18T08:00:00Z",
          createdAt: "2026-09-18T08:00:00Z",
        }}
        bottomInset={60}
      />
    );

    expect(view.getByTestId("worker-quick-access-bar")).toBeTruthy();
    expect(view.getByText("Working in progress")).toBeTruthy();
    expect(view.getByText(/Quest #11223344/)).toBeTruthy();
  });

  it("navigates to quest on press", async () => {
    const view = await render(
      <WorkerQuickAccessBar
        assignment={{
          id: "assign-act",
          questId: "11223344-5566-7788-9900-aabbccddeeff",
          workerId: "worker-1",
          state: "ASSIGNMENT_ACTIVE",
          questState: "QUEST_IN_PROGRESS",
          startedAt: "2026-09-18T08:00:00Z",
          createdAt: "2026-09-18T08:00:00Z",
        }}
        bottomInset={60}
      />
    );

    fireEvent.press(view.getByTestId("worker-quick-access-bar"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof",
      params: { id: "11223344-5566-7788-9900-aabbccddeeff" },
    });
  });
});
