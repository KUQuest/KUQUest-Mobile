import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react-native";

import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";
import { Text } from "@/tw";
import { useMyWorkerQuestSnapshotsQuery } from "../api/myQuestsQueries";

const mockListWorkerSnapshots = jest.fn();
const mockSubscribeToWorkerAssignmentEvents = jest.fn();

jest.mock("../myQuestService", () => ({
  myQuestService: {
    listMyWorkerQuestSnapshots: (...args: unknown[]) =>
      mockListWorkerSnapshots(...args),
  },
}));

jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToHirerQuestEvents: jest.fn(),
  subscribeToWorkerAssignmentEvents: (...args: unknown[]) =>
    mockSubscribeToWorkerAssignmentEvents(...args),
}));

function WorkerSnapshotProbe() {
  const query = useMyWorkerQuestSnapshotsQuery("worker-1");
  return (
    <Text testID="worker-quest-state">
      {query.data?.[0]?.state ?? "loading"}
    </Text>
  );
}

describe("worker Quest snapshot query updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reloads worker Quest state after a worker assignment invalidation", async () => {
    let invalidate: (() => void) | undefined;
    const snapshot = (state: string) =>
      ({ quest: { id: "quest-1" }, state }) as never;
    mockListWorkerSnapshots
      .mockResolvedValueOnce([snapshot("QUEST_IN_PROGRESS")])
      .mockResolvedValueOnce([snapshot("QUEST_COMPLETED")]);
    mockSubscribeToWorkerAssignmentEvents.mockImplementation(
      (onInvalidated: () => void) => {
        invalidate = onInvalidated;
        return jest.fn();
      }
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });
    const view = await render(
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <WorkerSnapshotProbe />
        </QueryClientProvider>
      </AppThemeProvider>
    );
    await waitFor(() =>
      expect(view.getByTestId("worker-quest-state")).toHaveTextContent(
        "QUEST_IN_PROGRESS"
      )
    );
    expect(mockSubscribeToWorkerAssignmentEvents).toHaveBeenCalledTimes(1);

    await act(async () => {
      if (!invalidate) throw new Error("Expected worker event subscription");
      invalidate();
    });

    await waitFor(() =>
      expect(view.getByTestId("worker-quest-state")).toHaveTextContent(
        "QUEST_COMPLETED"
      )
    );
    expect(mockListWorkerSnapshots).toHaveBeenCalledTimes(2);

    view.unmount();
    queryClient.clear();
  });
});
