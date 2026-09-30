import { fireEvent, render, waitFor } from "@testing-library/react-native";

import {
  QuestActor,
  QuestAssignmentStatus,
} from "@/features/questBoard/domain/types";
import { QuestReviewModal } from "../components/QuestReviewModal";

const mockClose = jest.fn();
const mockMutateAsync = jest.fn();
const mockUpdateAsync = jest.fn();
const mockRefetch = jest.fn();
const mockReviewsRefetch = jest.fn();
let mockSnapshot: Record<string, unknown>;
let mockAssignments: { data?: unknown[]; error: Error | null };
let mockReviews: { data?: unknown[]; error: Error | null };
let mockViewerId = "hirer-1";
let mockKeyCount = 0;

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: () => `review-key-${++mockKeyCount}`,
}));

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({
    data: { user: { id: mockViewerId } },
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
  useUpdateReviewMutation: () => ({
    isPending: false,
    mutateAsync: mockUpdateAsync,
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
  useQuestReviewsQuery: () => ({
    ...mockReviews,
    isPending: false,
    refetch: mockReviewsRefetch,
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

function completedSnapshot(
  actor: (typeof QuestActor)[keyof typeof QuestActor] = QuestActor.HIRER
) {
  return {
    actor,
    capabilities: { canCreateReview: true },
    participants: [
      { id: "worker-1", displayName: "Jane Worker" },
      { id: "worker-2", displayName: "Kai Worker" },
    ],
    quest: {
      id: "quest-1",
      title: "Campus Quest",
      hirerName: "Professor Oak",
    },
  };
}

describe("QuestReviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeyCount = 0;
    mockViewerId = "hirer-1";
    mockSnapshot = completedSnapshot();
    mockAssignments = {
      data: [
        {
          workerId: "worker-1",
          state: QuestAssignmentStatus.ASSIGNMENT_COMPLETED,
        },
      ],
      error: null,
    };
    mockReviews = { data: [], error: null };
    mockMutateAsync.mockResolvedValue({});
    mockUpdateAsync.mockResolvedValue({});
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

  it("lets a Worker review the Hirer without sending revieweeId", async () => {
    mockViewerId = "worker-1";
    mockSnapshot = completedSnapshot(QuestActor.WORKER);
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(screen.getByText("Professor Oak")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("quest-review-rating-5"));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    const [request] = mockMutateAsync.mock.calls[0] as [
      { input: Record<string, unknown> },
    ];
    expect(request.input).toEqual({ rating: 5 });
    expect(request.input).not.toHaveProperty("revieweeId");
  });

  it("opens an authored review in edit mode and updates its review id", async () => {
    mockReviews = {
      data: [
        {
          id: "review-1",
          reviewerId: "hirer-1",
          revieweeId: "worker-1",
          rating: 3,
          comment: "Good work",
        },
      ],
      error: null,
    };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(screen.getByRole("header", { name: "Edit review" })).toBeTruthy();
    expect(screen.getByTestId("quest-review-comment").props.value).toBe(
      "Good work"
    );
    await fireEvent.press(screen.getByTestId("quest-review-rating-5"));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));

    await waitFor(() => expect(mockUpdateAsync).toHaveBeenCalledTimes(1));
    expect(mockUpdateAsync).toHaveBeenCalledWith({
      questId: "quest-1",
      viewerId: "hirer-1",
      reviewId: "review-1",
      revieweeId: "worker-1",
      input: { rating: 5, comment: "Good work" },
      idempotencyKey: "review-key-1",
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
  it("reuses an uncertain review key for retry and rotates it for another Worker", async () => {
    mockAssignments = {
      data: [
        {
          workerId: "worker-1",
          state: QuestAssignmentStatus.ASSIGNMENT_COMPLETED,
        },
        {
          workerId: "worker-2",
          state: QuestAssignmentStatus.ASSIGNMENT_COMPLETED,
        },
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
    await fireEvent.press(screen.getByTestId("quest-review-worker-worker-2"));
    await fireEvent.press(screen.getByTestId("quest-review-rating-4"));
    await fireEvent.press(screen.getByTestId("quest-review-submit"));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(3));

    const requests = mockMutateAsync.mock.calls.map(([request]) => request);
    expect(
      requests.map((request) => [
        request.input.revieweeId,
        request.idempotencyKey,
      ])
    ).toEqual([
      ["worker-1", "review-key-1"],
      ["worker-1", "review-key-1"],
      ["worker-2", "review-key-2"],
    ]);
  });

  it("shows a retryable review-list error and never creates a review", async () => {
    mockReviews = { data: undefined, error: new Error("Review list failed") };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(
      screen.getByText("We couldn't load the Workers for this Quest.")
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockReviewsRefetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("quest-review-submit")).toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
  it("shows a retryable error instead of an empty state when Assignments fail", async () => {
    mockAssignments = { data: undefined, error: new Error("Forbidden") };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(
      screen.getByText("We couldn't load the Workers for this Quest.")
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockRefetch).toHaveBeenCalled();
    expect(screen.queryByTestId("quest-review-submit")).toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows an actionable empty state when no Worker can be reviewed", async () => {
    mockAssignments = {
      data: [
        {
          state: QuestAssignmentStatus.ASSIGNMENT_CANCELLED,
          workerId: "worker-1",
        },
      ],
      error: null,
    };
    const screen = await render(
      <QuestReviewModal onClose={mockClose} questId="quest-1" />
    );

    expect(screen.getByText("No Workers to review")).toBeTruthy();
    await fireEvent.press(screen.getByText("Done"));
    expect(mockClose).toHaveBeenCalled();
  });
});
