import { fireEvent, render, waitFor } from "@testing-library/react-native";
import mockReact, { type ReactNode } from "react";

import QuestBoardScreen from "../QuestBoardScreen";
import type {
  ApiQuestBoardItem,
  ApiQuestBoardPage,
} from "@/api/questBoardMapper";
import type { QuestBoardRepository } from "../questBoardRepository";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible
      ? mockReact.createElement(mockReact.Fragment, null, children)
      : null,
}));

const item: ApiQuestBoardItem = {
  questId: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
  title: "API Quest",
  reward: 980,
  tag: {
    id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
    name: "Design",
  },
  mode: "NO_CANDIDATE",
  participation: "SOLO",
  headcount: 1,
  startTime: "2099-09-30T09:00:00.000+07:00",
  estimatedDurationMinutes: 120,
  hirerName: "API Hirer",
  location: { label: "Online" },
};

function repositoryFor(
  implementation: QuestBoardRepository["listQuests"]
): QuestBoardRepository {
  return { listQuests: implementation };
}

function page(items: ApiQuestBoardItem[], nextCursor: string | null = null): ApiQuestBoardPage {
  return { items, nextCursor };
}

describe("API-backed Quest Board screen", () => {
  beforeEach(() => mockPush.mockClear());

  test("renders loading while the first Board request is pending", async () => {
    const repository = repositoryFor(() => new Promise(() => undefined));
    const view = await render(<QuestBoardScreen boardRepository={repository} />);

    expect(view.getByLabelText("Loading Quests")).toBeTruthy();
  });

  test("renders the empty state from an empty API page", async () => {
    const repository = repositoryFor(async () => page([]));
    const view = await render(<QuestBoardScreen boardRepository={repository} />);

    await waitFor(() => expect(view.getByText("No quests available yet.")).toBeTruthy());
  });

  test("renders an API error with a retry action", async () => {
    const repository = repositoryFor(async () => {
      throw new Error("temporarily unavailable");
    });
    const view = await render(<QuestBoardScreen boardRepository={repository} />);

    await waitFor(() => expect(view.getByText("Try again")).toBeTruthy());
    expect(view.queryByText("Help move boxes to the dorm")).toBeNull();
  });

  test("navigates to Detail with only the API questId", async () => {
    const view = await render(
      <QuestBoardScreen boardRepository={repositoryFor(async () => page([item]))} />
    );

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    fireEvent.press(view.getByTestId(`quest-detail-${item.questId}`));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: item.questId },
    });
  });

  test("retries the failed request and renders the recovered page", async () => {
    const listQuests = jest.fn()
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce(page([item]));
    const view = await render(<QuestBoardScreen boardRepository={repositoryFor(listQuests)} />);

    await waitFor(() => expect(view.getByText("Try again")).toBeTruthy());
    fireEvent.press(view.getByText("Try again"));

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    expect(listQuests).toHaveBeenCalledTimes(2);
  });

  test("loads the next cursor page through FlatList onEndReached", async () => {
    const listQuests = jest.fn()
      .mockResolvedValueOnce(page([item], "next-page"))
      .mockResolvedValueOnce(page([{ ...item, questId: "next-quest", title: "Next API Quest" }]));
    const view = await render(<QuestBoardScreen boardRepository={repositoryFor(listQuests)} />);

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    fireEvent(view.getByLabelText("Quest Board results"), "onEndReached");

    await waitFor(() => expect(view.getByText("Next API Quest")).toBeTruthy());
    expect(listQuests).toHaveBeenLastCalledWith({ cursor: "next-page" });
  });

  test("resets items and cursor when the search filter changes", async () => {
    const listQuests = jest
      .fn()
      .mockResolvedValueOnce(page([item], "next-page"))
      .mockResolvedValueOnce(page([]));
    const view = await render(
      <QuestBoardScreen boardRepository={repositoryFor(listQuests)} />
    );

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    fireEvent.changeText(view.getByTestId("quest-board-search"), "design");

    await waitFor(() => expect(view.getByText("No quests found")).toBeTruthy());
    expect(listQuests).toHaveBeenLastCalledWith({ q: "design" });
  });

  test("never substitutes fixture cards when the API request fails", async () => {
    const repository = repositoryFor(async () => {
      throw new Error("offline");
    });
    const view = await render(<QuestBoardScreen boardRepository={repository} />);

    await waitFor(() => expect(view.getByTestId("quest-board-prototype-menu-trigger")).toBeTruthy());
    expect(view.queryByText("Help move boxes to the dorm")).toBeNull();
  });
});
