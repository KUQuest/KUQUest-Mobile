import { waitFor } from "@testing-library/react-native";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import { questFixtureAdapter } from "../questFixtureAdapter";
import QuestDetailScreen from "../QuestDetailScreen";

const mockGetQuestDetail = jest.fn();

jest.mock("../liveQuestService", () => ({
  liveQuestService: {
    getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
  },
}));

jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

describe("QuestDetailScreen smoke", () => {
  it("renders the live quest path after the fold", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    mockGetQuestDetail.mockResolvedValue(fixture);

    const view = await render(<QuestDetailScreen questId={fixture.id} />);

    await waitFor(() => {
      expect(mockGetQuestDetail).toHaveBeenCalledWith(
        fixture.id,
        expect.objectContaining({ signal: expect.anything() })
      );
    });
    expect(await view.findByText(fixture.title)).toBeTruthy();
  });
});
