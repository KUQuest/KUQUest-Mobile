import { act, renderHook, waitFor } from "@testing-library/react-native";
import { authClient } from "@/features/auth/authClient";
import { MockWebSocket } from "@/testing/mockWebSocket";
import { closeAllServerSockets } from "@/api/ServerSocket";

import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { QuestParticipation, QuestStatus } from "../../domain/types";
import { useHirerQuestManageFeature } from "../useHirerQuestManageFeature";

const mockShowConfirm = jest.fn();
const mockSelectApplication = jest.fn();
const mockSelectTeam = jest.fn();
const mockInvalidateQueries = jest.fn();
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
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "hirer-1" } } }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  questBoardKeys: {
    liveSnapshotScope: (questId: string, viewerId: string) => [
      "questBoard",
      "live-snapshot",
      questId,
      viewerId,
    ],
  },
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
    jest
      .spyOn(authClient, "getCookie")
      .mockReturnValue("better-auth.session_token=session");
    mockSelectApplication.mockResolvedValue({ id: "assignment-1" });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refetches matching snapshot when hirer opens decision window", async () => {
    const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
    const originalWebSocket = globalThis.WebSocket;
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    Object.defineProperty(globalThis, "WebSocket", {
      configurable: true,
      value: MockWebSocket,
    });
    MockWebSocket.instances = [];
    closeAllServerSockets();

    let unmount = () => {};
    try {
      const hook = await renderHook(() =>
        useHirerQuestManageFeature("00000000-0000-4000-8000-000000000001")
      );
      unmount = hook.unmount;
      await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
      const socket = MockWebSocket.instances[0];
      if (!socket) throw new Error("Expected hirer event socket");
      socket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));
      socket.receive(
        JSON.stringify({
          type: "HIRER_QUEST_UPDATED",
          version: 1,
          questId: "00000000-0000-4000-8000-000000000001",
          changeType: "UNDERFILLED_DECISION_PENDING",
          expiresAt: "2026-10-02T04:10:00.000Z",
        })
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: [
          "questBoard",
          "live-snapshot",
          "00000000-0000-4000-8000-000000000001",
          "hirer-1",
        ],
      });
    } finally {
      unmount();
      if (originalApiUrl === undefined) {
        delete process.env.EXPO_PUBLIC_API_URL;
      } else {
        process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
      }
      Object.defineProperty(globalThis, "WebSocket", {
        configurable: true,
        value: originalWebSocket,
      });
    }
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
