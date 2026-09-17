import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import DraftQuestsScreen from "../DraftQuestsScreen";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockListDrafts = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, [effect]),
}));
jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/components/navigation/NavigationVisibilityContext", () => ({
  useNavigationVisibility: () => ({ handleScroll: jest.fn() }),
}));
jest.mock("../myQuestService", () => ({
  formatQuestDate: (value: string) => value.slice(0, 10),
  myQuestService: {
    listAllMyHirerQuests: (...args: unknown[]) => mockListDrafts(...args),
  },
}));

const draftQuest = (id: string, title: string, updatedAt: string) => ({
  id,
  version: 1,
  hiddenAt: null,
  title,
  description: "Help the campus community.",
  condition: { items: [{ position: 0, text: "Complete the task." }] },
  tag: { id: "campus", name: "Campus" },
  mode: "FIRST_COME_FIRST_SERVED" as const,
  participation: "SINGLE" as const,
  state: "QUEST_DRAFT" as const,
  questFundingTotal: 250,
  headcount: 1,
  startTime: "2026-10-01T09:00:00Z",
  dueAt: "2026-10-01T12:00:00Z",
  proofRequired: true,
  locations: [{ label: "Main Campus" }],
  createdAt: "2026-09-17T10:00:00Z",
  updatedAt,
});

describe("DraftQuestsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListDrafts.mockResolvedValue([
      draftQuest("draft-old", "Older Quest", "2026-09-18T08:00:00Z"),
      draftQuest("draft-new", "Newest Quest", "2026-09-19T08:00:00Z"),
    ]);
  });

  it("lists drafts newest first and opens the selected Quest editor", async () => {
    const screen = await render(<DraftQuestsScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("draft-quests-list")).toBeTruthy()
    );
    const cards = screen.getAllByTestId(/^draft-quest-card-/);
    expect(cards.map((card) => card.props.testID)).toEqual([
      "draft-quest-card-draft-new",
      "draft-quest-card-draft-old",
    ]);

    fireEvent.press(screen.getByTestId("draft-quest-card-draft-new"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/create",
      params: { editQuestId: "draft-new" },
    });
  });
});
