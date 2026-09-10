import { render, waitFor } from "@testing-library/react-native";

import QuestDetailScreen from "../QuestDetailScreen";
import type { ApiQuestDetailItem } from "@/api/questBoard/questBoardMapper";
import type { QuestDetailRepository } from "../questBoardRepository";

const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: mockPush,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const detail: ApiQuestDetailItem = {
  questId: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
  title: "Server-authoritative detail",
  description: "The server response is rendered as received.",
  conditionItems: [{ position: 0, text: "Do the work" }],
  tag: {
    id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
    name: "Design",
  },
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  state: "QUEST_ASSIGNED",
  questReward: 980,
  headcount: 1,
  activeWorkerCount: 1,
  startTime: "2020-09-30T09:00:00.000+07:00",
  dueAt: "2020-09-30T11:00:00.000+07:00",
  proofRequired: true,
  hirerName: "Server Hirer",
  locations: [{ label: "Online" }],
  images: [],
};

function repositoryFor(
  getQuestDetail: QuestDetailRepository["getQuestDetail"]
): QuestDetailRepository {
  return { getQuestDetail };
}

describe("API-backed Quest Detail screen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockCanGoBack.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  test("renders server state and capacity without local expiry or full checks", async () => {
    const getQuestDetail = jest.fn().mockResolvedValue(detail);
    const view = await render(
      <QuestDetailScreen
        detailRepository={repositoryFor(getQuestDetail)}
        questId={detail.questId}
      />
    );

    await waitFor(() =>
      expect(view.getByText("Server-authoritative detail")).toBeTruthy()
    );
    expect(view.getByTestId("api-quest-detail-server-state")).toHaveTextContent(
      "Assigned"
    );
    expect(view.getByText("1/1")).toBeTruthy();
    expect(view.queryByTestId("quest-apply-button")).toBeNull();
    expect(view.queryByText("Quest full")).toBeNull();
    expect(view.queryByText("Help move boxes to the dorm")).toBeNull();
    expect(getQuestDetail).toHaveBeenCalledWith(detail.questId);
  });

  test("does not replace a server lifecycle state with a client availability label", async () => {
    const getQuestDetail = jest.fn().mockResolvedValue({
      ...detail,
      state: "QUEST_FAILED",
    });
    const view = await render(
      <QuestDetailScreen
        detailRepository={repositoryFor(getQuestDetail)}
        questId={detail.questId}
      />
    );

    await waitFor(() =>
      expect(view.getByTestId("api-quest-detail-server-state")).toHaveTextContent(
        "Failed"
      )
    );
    expect(view.queryByText("Quest full")).toBeNull();
    expect(view.queryByText("This Quest is no longer accepting applications.")).toBeNull();
  });
});
