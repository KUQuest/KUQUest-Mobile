import { act, renderHook, waitFor } from "@testing-library/react-native";

import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { QuestParticipation, QuestStatus } from "../../domain/types";
import { useHirerQuestManageFeature } from "../useHirerQuestManageFeature";

const mockShowConfirm = jest.fn();
const mockSelectApplication = jest.fn();
const mockSelectTeam = jest.fn();
const mockSnapshotQuery = {
  data: {
    quest: {
      id: "quest-1",
      title: "Quest",
      headcount: 1,
      condition: { items: [] },
    },
    state: QuestStatus.QUEST_OPEN,
    actor: "HIRER",
    mode: "CANDIDATE",
    participation: QuestParticipation.SINGLE,
    capabilities: {
      canSelectCandidate: true,
      canSelectTeam: false,
      canRequestEdit: false,
    },
    applications: [],
    proofs: [],
    editRequest: null,
    workConversation: null,
    underfilled: null,
  },
  error: null,
  isPending: false,
  isError: false,
  refetch: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: unknown) => mockShowConfirm(options),
  showErrorAlert: jest.fn(),
  showSweetAlert: jest.fn(),
  SweetAlertVariant: { Success: "success" },
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({}) }));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "hirer-1" } } }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  setQuestEditRequestId: jest.fn(),
  useCancelQuestMutation: () => ({ mutateAsync: jest.fn() }),
  useCreateEditRequestMutation: () => ({ mutateAsync: jest.fn() }),
  useDecideUnderfilledMutation: () => ({ mutateAsync: jest.fn() }),
  useLiveQuestSnapshotQuery: () => mockSnapshotQuery,
  useSelectApplicationMutation: () => ({ mutateAsync: mockSelectApplication }),
  useSelectCandidateTeamMutation: () => ({ mutateAsync: mockSelectTeam }),
}));

describe("Manage candidate selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectApplication.mockResolvedValue({ id: "assignment-1" });
  });

  it("confirms selection, prevents duplicate confirmation, and closes candidate UI after success", async () => {
    const { result } = await renderHook(() =>
      useHirerQuestManageFeature("quest-1")
    );
    act(() => result.current.setCandidateOpen(true));
    act(() => result.current.selectApplication("application-1"));

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
    await waitFor(() => expect(result.current.candidateOpen).toBe(false));

    expect(mockSelectApplication).toHaveBeenCalledTimes(1);
    expect(mockSelectApplication).toHaveBeenCalledWith({
      questId: "quest-1",
      applicationId: "application-1",
      viewerId: "hirer-1",
      idempotencyKey: expect.any(String),
    });
  });
});
