import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import { getQuestDetailProjection } from "../questDetailProjection";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  questFixtureAdapter,
} from "../../fixtures/adapters/questFixtureAdapter";
import { questWorkflow } from "../../workflow/questWorkflow";
import QuestDetailScreen from "../QuestDetailScreen";

const mockGetQuestDetail = jest.fn();
const mockGetLiveSnapshot = jest.fn();
let mockExposeLiveSnapshot = false;

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
    get getLiveSnapshot() {
      return mockExposeLiveSnapshot ? mockGetLiveSnapshot : undefined;
    },
  },
}));

jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

describe("QuestDetailScreen smoke", () => {
  beforeEach(() => {
    mockGetQuestDetail.mockReset();
    mockGetLiveSnapshot.mockReset();
    mockExposeLiveSnapshot = false;
    questFixtureAdapter.reset();
  });
  afterEach(() => {
    questFixtureAdapter.reset();
  });

  it("renders the live quest path after the fold", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const state = questFixtureAdapter.getQuestDetail(
      fixture.id,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    );
    if (!state) throw new Error("Expected a Quest detail fixture");
    expect(
      getQuestDetailProjection(
        state,
        DEFAULT_PROTOTYPE_VIEWER_ID,
        questFixtureAdapter.now
      )
    ).toMatchObject({
      quest: { id: fixture.id, title: fixture.title },
      participantCount: expect.any(Number),
    });
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
  it("falls back to public detail when live snapshots need a viewer", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    mockExposeLiveSnapshot = true;
    mockGetQuestDetail.mockResolvedValue(fixture);

    const view = await render(<QuestDetailScreen questId={fixture.id} />);

    await waitFor(() => {
      expect(mockGetQuestDetail).toHaveBeenCalledWith(
        fixture.id,
        expect.objectContaining({ signal: expect.anything() })
      );
    });
    expect(mockGetLiveSnapshot).not.toHaveBeenCalled();
    expect(await view.findByText(fixture.title)).toBeTruthy();
  });

  it("keeps preview participation in the fixture workflow", async () => {
    const fixture = questFixtureAdapter.getQuestDetail(
      "print-documents",
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    );
    if (!fixture) throw new Error("Expected a Quest fixture");
    const dispatch = jest.spyOn(questWorkflow, "dispatch");

    try {
      const view = await render(
        <QuestDetailScreen
          questId={fixture.quest.id}
          previewState="populated"
          studentId={DEFAULT_PROTOTYPE_VIEWER_ID}
        />
      );
      fireEvent.press(await view.findByTestId("quest-apply-button"));
      fireEvent.press(await view.findByTestId("confirm-quest-application"));

      await waitFor(() => {
        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({ questId: fixture.quest.id })
        );
      });
      expect(
        questWorkflow.getQuestDetailState(
          fixture.quest.id,
          DEFAULT_PROTOTYPE_VIEWER_ID
        )
      ).toMatchObject({
        assignments: expect.arrayContaining([
          expect.objectContaining({
            workerId: DEFAULT_PROTOTYPE_VIEWER_ID,
            status: "ASSIGNMENT_ACTIVE",
          }),
        ]),
      });
      expect(mockGetQuestDetail).not.toHaveBeenCalled();
    } finally {
      dispatch.mockRestore();
    }
  });
});
