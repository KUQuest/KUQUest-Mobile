import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import QuestReviewScreen from "../QuestReviewScreen";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockSnapshot: Record<string, unknown>;

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: () => "review-key-1",
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
}));

jest.mock("@/components/layout/ScreenLayout", () => {
  const ReactRuntime = jest.requireActual("react");
  const native = jest.requireActual("react-native");
  return {
    ScreenLayout: ({ children }: { children: unknown }) =>
      ReactRuntime.createElement(native.View, null, children),
  };
});

jest.mock("@/components/ui/TopBar", () => {
  const ReactRuntime = jest.requireActual("react");
  const native = jest.requireActual("react-native");
  return {
    TopBar: ({
      title,
      onBackPress,
    }: {
      title: string;
      onBackPress: () => void;
    }) =>
      ReactRuntime.createElement(
        native.Pressable,
        { onPress: onBackPress, testID: "review-back" },
        ReactRuntime.createElement(native.Text, null, title)
      ),
  };
});

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
    Pressable: native.Pressable,
    ScrollView: native.ScrollView,
    Text: native.Text,
    View: native.View,
  };
});

jest.mock("lucide-react-native", () => ({
  Star: () => null,
}));

function completedSnapshot(
  assignments: unknown[] = [{ workerId: "worker-1" }]
) {
  return {
    assignments,
    capabilities: { canCreateReview: true },
    participants: [{ id: "worker-1", displayName: "Jane Worker" }],
    quest: { id: "quest-1", title: "Campus Quest" },
  };
}

describe("QuestReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapshot = completedSnapshot();
    mockMutateAsync.mockResolvedValue({});
  });

  it("submits a rating and optional comment for the selected Worker", async () => {
    const screen = await render(<QuestReviewScreen questId="quest-1" />);

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
    mockSnapshot = completedSnapshot([
      { state: "ASSIGNMENT_CANCELLED", workerId: "worker-1" },
    ]);
    const screen = await render(<QuestReviewScreen questId="quest-1" />);

    expect(screen.getByText("No Workers to review")).toBeTruthy();
    await fireEvent.press(screen.getByText("Done"));
    expect(mockBack).toHaveBeenCalled();
  });
});
