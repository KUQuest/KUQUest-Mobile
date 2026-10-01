import { act, renderHook } from "@testing-library/react-native";

import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useCandidateSelection } from "@/features/questBoard/useCandidateSelection";

const mockShowConfirm = jest.fn();

jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: unknown) => mockShowConfirm(options),
  showErrorAlert: jest.fn(),
}));

describe("shared Candidate selection guard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("honors shared command lock and holds it through selection execution", async () => {
    const flightRef = { current: true };
    const onSelect = jest.fn();
    const onSuccess = jest.fn();
    const selectionRequest = Promise.withResolvers<{ id: string }>();
    onSelect.mockReturnValue(selectionRequest.promise);
    const { result } = await renderHook(() =>
      useCandidateSelection({
        questId: "quest-1",
        messages: questBoardMessages.en,
        groupMessages: groupQuestMessages.en,
        flightRef,
        onSelect,
        onSuccess,
      })
    );

    act(() =>
      result.current.confirmSelection({
        kind: "application",
        proposalId: "application-1",
      })
    );
    expect(mockShowConfirm).not.toHaveBeenCalled();

    flightRef.current = false;
    act(() =>
      result.current.confirmSelection({
        kind: "application",
        proposalId: "application-1",
      })
    );
    const { onConfirm } = mockShowConfirm.mock.calls[0][0] as {
      onConfirm: () => void | Promise<void>;
    };
    let pendingSelection: void | Promise<void> = undefined;
    act(() => {
      pendingSelection = onConfirm();
    });
    expect(flightRef.current).toBe(true);

    act(() =>
      result.current.confirmSelection({ kind: "team", proposalId: "team-1" })
    );
    expect(mockShowConfirm).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);

    await act(async () => {
      selectionRequest.resolve({ id: "assignment-1" });
      await pendingSelection;
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(flightRef.current).toBe(false);
  });
});
