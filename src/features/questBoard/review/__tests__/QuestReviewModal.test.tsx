import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { QuestReviewModal } from "../components/QuestReviewModal";

const mockClose = jest.fn();
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockSnapshot: Record<string, unknown>;
let mockAssignments: { data?: unknown[]; error: Error | null };
let mockKeyCount = 0;

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: () => `review-key-${++mockKeyCount}`,
}));

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({
    data: { user: { id: "hirer-1" } },
    error: null,
    isPending: false,
  }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useCreateReviewMutation: () => ({
    isPending: false,
    mutateAsync: mockMutateAsync,
  }),
  useLiveQuestSnapshotQuery: () => ({
    data: mockSnapshot,
    error: null,
    isPending: false,
    refetch: mockRefetch,
  }),
  useQuestAssignmentsQuery: () => ({
    ...mockAssignments,
    isPending: false,
    refetch: mockRefetch,
  }),
}));

jest.mock("@/components/ui/Button", () => {
  const ReactRuntime = jest.requireActual("react");
  const native = jest.requireActual("react-native");
  return {
    Button: ({
      children,
      disabled,
      onPress,
      testID,
    }: {
      children: unknown;
      disabled?: boolean;
      onPress: () => void;
      testID?: string;
    }) =>
      ReactRuntime.createElement(
        native.Pressable,
        { disabled, onPress, testID },
        ReactRuntime.createElement(native.Text, null, children)
      ),
  };
});

jest.mock("@/components/ui/TextArea", () => {
  const ReactRuntime = jest.requireActual("react");
  const native = jest.requireActual("react-native");
  return {
    TextArea: ({
      label,
      ...props
    }: {
      label: string;
      [key: string]: unknown;
    }) =>
      ReactRuntime.createElement(native.TextInput, {
        accessibilityLabel: label,
        ...props,
      }),
  };
});

jest.mock("@/tw", () => {
  const native = jest.requireActual("react-native");
  return {
    KeyboardAvoidingView: native.View,
    Pressable: native.Pressable,
    SafeAreaView: native.View,
    ScrollView: native.ScrollView,
    Text: native.Text,
    View: native.View,
  };
});

jest.mock("lucide-react-native", () => ({
  Star: () => null,
  X: () => null,
}));

function completedSnapshot() {
  return {
    capabilities: { canCreateReview: true },
    participants: [
      { id: "worker-1", displayName: "Jane Worker" },
      { id: "worker-2", displayName: "Kai Worker" },
    ],
    quest: { id: "quest-1", title: "Campus Quest" },
  };
}

describe("QuestReviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeyCount = 0;
    mockSnapshot = completedSnapshot();
    mockAssignments = {
      data: [{ workerId: "worker-1", state: "ASSIGNMENT_COMPLETED" }],
      error: null,
    };
    mockMutateAsync.mockResolvedValue({});
  });

  it("submits a rating and optional comment for the selected Worker", async () => {
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    await fireEvent.press(screen.getByTestId("quest-review-rating-5"));
    await fireEvent.changeText(
      screen.getByTestId("quest-review-comment"),
      "Great communication"
    );
    await fireEvent.press(screen.getByTestId("quest-review-submit"));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    expect(mockMutateAsync).toHaveBeenCalledWith({
      questId: "quest-1",
      input: {
        comment: "Great communication",
        rating: 5,
        revieweeId: "worker-1",
      },
      viewerId: "hirer-1",
      idempotencyKey: "review-key-1",
    });
    expect(screen.getByTestId("quest-review-success")).toBeTruthy();
  });

  it("shows an actionable empty state when no Worker can be reviewed", async () => {
    mockAssignments = {
      data: [{ state: "ASSIGNMENT_CANCELLED", workerId: "worker-1" }],
      error: null,
    };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(screen.getByText("No Workers to review")).toBeTruthy();
    await fireEvent.press(screen.getByText("Done"));
    expect(mockClose).toHaveBeenCalled();
  });

  it("shows a retryable error instead of an empty roster when Assignments fail to load", async () => {
    mockAssignments = { data: undefined, error: new Error("Forbidden") };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(
      screen.getByText("We couldn't load the Workers for this Quest.")
    ).toBeTruthy();
    expect(screen.queryByText("Forbidden")).toBeNull();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("replays an undelivered review with its key and gives each Worker's review a new key", async () => {
    mockAssignments = {
      data: [
        { workerId: "worker-1", state: "ASSIGNMENT_COMPLETED" },
        { workerId: "worker-2", state: "ASSIGNMENT_COMPLETED" },
      ],
      error: null,
    };
    mockMutateAsync
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValue({});
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    await fireEvent.press(screen.getByTestId("quest-review-rating-5"));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(2));
    await fireEvent.press(screen.getByTestId("quest-review-rating-4"));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(3));

    const calls = mockMutateAsync.mock.calls.map(([call]) => [
      call.input.revieweeId,
      call.idempotencyKey,
    ]);
    expect(calls).toEqual([
      ["worker-1", "review-key-1"],
      ["worker-1", "review-key-1"],
      ["worker-2", "review-key-2"],
    ]);
  });
});
