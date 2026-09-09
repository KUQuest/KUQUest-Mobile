import { fireEvent, render, waitFor } from "@testing-library/react-native";
import mockReact, { type ReactNode } from "react";

import QuestBoardScreen from "../QuestBoardScreen";
import type {
  ApiQuestBoardItem,
  ApiQuestBoardPage,
} from "@/api/questBoard/questBoardMapper";
import type { QuestBoardRepository } from "../questBoardRepository";
import type { TagApi } from "@/api/tag/TagApi";

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
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
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
      .mockResolvedValue(page([]));
    const view = await render(
      <QuestBoardScreen boardRepository={repositoryFor(listQuests)} />
    );

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    await fireEvent(
      view.getByLabelText("Quest Board results"),
      "onEndReached"
    );
    await waitFor(() =>
      expect(listQuests).toHaveBeenLastCalledWith({ cursor: "next-page" })
    );
    await fireEvent.changeText(view.getByTestId("quest-board-search"), "design");

    await waitFor(() => expect(view.getByText("No quests found")).toBeTruthy());
    expect(listQuests).toHaveBeenLastCalledWith({ q: "design" });
  });

  test("maps the selected Tag object and v2 filters to the API query", async () => {
    const listQuests = jest.fn().mockResolvedValue(page([item]));
    const tagCatalogApi = {
      listTags: jest.fn().mockResolvedValue([item.tag]),
    } as unknown as TagApi;
    const view = await render(
      <QuestBoardScreen
        boardRepository={repositoryFor(listQuests)}
        tagCatalogApi={tagCatalogApi}
      />
    );

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    await fireEvent.press(view.getByTestId("open-quest-filters"));
    await waitFor(() => expect(tagCatalogApi.listTags).toHaveBeenCalledTimes(1));
    await fireEvent.changeText(view.getByTestId("quest-filter-tag-search"), "design");
    await waitFor(() =>
      expect(view.getByTestId(`quest-filter-tag-${item.tag.id}`)).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId(`quest-filter-tag-${item.tag.id}`));
    await fireEvent.press(view.getByTestId("quest-filter-mode-candidate"));
    await fireEvent.press(view.getByTestId("quest-filter-participation-group"));
    await fireEvent.press(view.getByTestId("apply-quest-filters"));

    await waitFor(() => expect(listQuests).toHaveBeenLastCalledWith({
      tagId: item.tag.id,
      mode: "CANDIDATE",
      participation: "GROUP",
    }));
  });

  test("suppresses duplicate pagination requests, deduplicates cards, and stops at null", async () => {
    let resolveNext: (value: ApiQuestBoardPage) => void = () => undefined;
    const nextPage = new Promise<ApiQuestBoardPage>((resolve) => {
      resolveNext = resolve;
    });
    const duplicate = { ...item, title: "Duplicate API Quest" };
    const next = { ...item, questId: "next-quest", title: "Next API Quest" };
    const listQuests = jest.fn()
      .mockResolvedValueOnce(page([item], "opaque/next=="))
      .mockReturnValueOnce(nextPage);
    const view = await render(
      <QuestBoardScreen boardRepository={repositoryFor(listQuests)} />
    );

    await waitFor(() => expect(view.getByText("API Quest")).toBeTruthy());
    const results = view.getByLabelText("Quest Board results");
    await fireEvent(results, "onEndReached");
    await fireEvent(results, "onEndReached");
    expect(listQuests).toHaveBeenCalledTimes(2);

    resolveNext(page([duplicate, next], null));
    await waitFor(() => expect(view.getByText("Next API Quest")).toBeTruthy());
    expect(view.getAllByTestId(`quest-detail-${item.questId}`)).toHaveLength(1);

    await fireEvent(results, "onEndReached");
    expect(listQuests).toHaveBeenCalledTimes(2);
  });

  test("renders API results in server order without local search or sort", async () => {
    const second = { ...item, questId: "second-quest", title: "Second server result" };
    const listQuests = jest.fn().mockResolvedValue(page([second, item]));
    const view = await render(
      <QuestBoardScreen boardRepository={repositoryFor(listQuests)} />
    );

    await waitFor(() => expect(view.getByText("Second server result")).toBeTruthy(), {
      timeout: 5000,
    });
    expect(view.queryByTestId("open-quest-sort")).toBeNull();
    await fireEvent.changeText(view.getByTestId("quest-board-search"), "not a server filter");

    await waitFor(() => expect(listQuests).toHaveBeenCalledTimes(2));
    expect(view.getByText("Second server result")).toBeTruthy();
    expect(view.getAllByTestId("quest-detail-second-quest")).toHaveLength(1);
  });

  test("never substitutes fixture cards when the API request fails", async () => {
    const repository = repositoryFor(async () => {
      throw new Error("offline");
    });
    const view = await render(<QuestBoardScreen boardRepository={repository} />);

    await waitFor(() => expect(view.getByText("Try again")).toBeTruthy(), {
      timeout: 5000,
    });
    expect(view.queryByText("Help move boxes to the dorm")).toBeNull();
  });
});
