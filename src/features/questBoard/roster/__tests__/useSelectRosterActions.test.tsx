import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { QuestV2Application } from "@/api/questV2Contracts";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useSelectRosterActions } from "../useSelectRosterActions";

const mockShowConfirm = jest.fn();
const mockSelectApplication = jest.fn();
const mockSelectTeam = jest.fn();
const mockRejectApplication = jest.fn();
const mockRejectTeam = jest.fn();

jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: unknown) => mockShowConfirm(options),
  showErrorAlert: jest.fn(),
}));

jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useRejectApplicationMutation: () => ({ mutateAsync: mockRejectApplication }),
  useRejectCandidateTeamMutation: () => ({ mutateAsync: mockRejectTeam }),
  useSelectApplicationMutation: () => ({ mutateAsync: mockSelectApplication }),
  useSelectCandidateTeamMutation: () => ({ mutateAsync: mockSelectTeam }),
}));

describe("roster candidate selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectApplication.mockResolvedValue({ id: "assignment-1" });
  });

  it("confirms, selects once on duplicate confirmation, then transitions once", async () => {
    const onSelectSuccess = jest.fn();
    const application = { id: "application-1" } as QuestV2Application;
    const { result } = await renderHook(() =>
      useSelectRosterActions({
        questId: "quest-1",
        viewerId: "hirer-1",
        messages: questBoardMessages.en,
        groupMessages: groupQuestMessages.en,
        onSelectSuccess,
        refetchSnapshot: jest.fn().mockResolvedValue(undefined),
      })
    );

    act(() => result.current.selectApplication(application));
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: questBoardMessages.en.confirmSelectCandidateTitle,
        message: questBoardMessages.en.confirmSelectCandidateMessage,
        confirmLabel: groupQuestMessages.en.selectProposal,
      })
    );
    expect(mockSelectApplication).not.toHaveBeenCalled();

    const { onConfirm } = mockShowConfirm.mock.calls[0][0] as {
      onConfirm: () => void | Promise<void>;
    };
    await act(async () => {
      await Promise.all([onConfirm(), onConfirm()]);
    });
    await waitFor(() => expect(onSelectSuccess).toHaveBeenCalledTimes(1));

    expect(mockSelectApplication).toHaveBeenCalledTimes(1);
    expect(mockSelectApplication).toHaveBeenCalledWith({
      questId: "quest-1",
      applicationId: "application-1",
      viewerId: "hirer-1",
      idempotencyKey: expect.any(String),
    });
  });
});
