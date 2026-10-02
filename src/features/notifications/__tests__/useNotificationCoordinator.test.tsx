import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type {
  QuestV2CandidateApplication,
  QuestV2MyAssignment,
  QuestV2UnderfilledSummary,
} from "@/api/questV2Contracts";
import {
  QuestApplicationStatus,
  QuestStatus,
  QuestTeamStatus,
} from "@/features/questBoard/domain/types";
import type { HirerQuestUpdatedEvent } from "@/features/questBoard/live/questEvents";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { useNotificationCoordinator } from "../useNotificationCoordinator";

const mockPush = jest.fn();
let mockApplications: QuestV2CandidateApplication[] = [];
let mockWorkerAssignments: QuestV2MyAssignment[] = [];
let mockIsHirer = false;
let mockPathname = "/(tabs)/my-quests";
let mockHirerEventHandler:
  ((event: HirerQuestUpdatedEvent) => void) | undefined;

jest.mock("expo-router", () => ({
  useSegments: () => ["(tabs)"],
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/features/auth/authEnvironment", () => ({
  authEnvironment: { isDemoEnabled: () => false },
}));
jest.mock("@/features/auth/AuthMiddleware", () => ({
  isPublicAuthRoute: () => false,
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "worker-1" } } }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: () => ({
    isHirer: mockIsHirer,
    isWorker: !mockIsHirer,
    workspace: mockIsHirer ? "hirer" : "worker",
  }),
}));
jest.mock("@/features/chat/api/chatQueries", () => ({
  useChatNotificationConversationsQuery: () => ({
    data: { conversations: [], inquiries: [] },
  }),
}));
jest.mock("@/features/myQuests/api/myQuestsQueries", () => ({
  myQuestsKeys: {
    worker: (viewerId: string) => ["worker", viewerId],
    workerCandidateApplications: (viewerId: string) => ["apps", viewerId],
  },
  useMyWorkerCandidateApplicationsQuery: () => ({ data: mockApplications }),
}));
jest.mock("@/features/workerHome/api/workerHomeQueries", () => ({
  workerHomeKeys: {
    assignments: (status: string) => ["worker-assignments", status],
  },
  useWorkerAssignmentsQuery: () => ({ data: mockWorkerAssignments }),
}));
jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToHirerQuestEvents: (
    listener: (event: HirerQuestUpdatedEvent) => void
  ) => {
    mockHirerEventHandler = listener;
    return () => {
      mockHirerEventHandler = undefined;
    };
  },
}));
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    focusManager: { isFocused: () => true, subscribe: () => () => undefined },
  };
});

function application(
  state: QuestV2CandidateApplication["state"],
  kind: QuestV2CandidateApplication["kind"] = "SINGLE"
): QuestV2CandidateApplication {
  return {
    id: "application-1",
    questId: "quest-1",
    memberId: "worker-1",
    kind,
    state,
    appliedAt: "2026-09-01T09:00:00Z",
    quest: {
      title: "Campus cleanup",
      startTime: "2026-09-27T00:00:00Z",
      dueAt: null,
      mode: "CANDIDATE",
      participation: kind === "TEAM" ? "GROUP" : "SINGLE",
      state: QuestStatus.QUEST_OPEN,
    },
  };
}

function workerAssignment(
  state: QuestV2UnderfilledSummary["state"],
  cancellationReason: QuestV2UnderfilledSummary["cancellationReason"] = null
): QuestV2MyAssignment {
  const needsConsent = state === "UNDERFILLED_CONSENT_PENDING";
  return {
    id: "assignment-worker",
    questId: "quest-worker",
    workerId: "worker-1",
    state:
      state === "UNDERFILLED_CANCELLED"
        ? "ASSIGNMENT_CANCELLED"
        : "ASSIGNMENT_ACTIVE",
    questState:
      state === "UNDERFILLED_COMPLETED" ? "QUEST_ASSIGNED" : "QUEST_OPEN",
    startedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    underfilled: {
      state,
      decision: { expiresAt: "2026-10-01T00:10:00.000Z" },
      consent: {
        expiresAt: needsConsent ? "2026-10-01T00:05:00.000Z" : null,
      },
      activeWorkerCount: 1,
      headcount: 2,
      cancellationReason,
    },
  };
}

function NoticeProbe() {
  const { notices, open } = useNotificationCoordinator();
  return (
    <>
      {notices.map((notice) => (
        <Pressable key={notice.id} onPress={() => open(notice)}>
          <Text>{notice.message}</Text>
        </Pressable>
      ))}
    </>
  );
}

async function expectDecisionDestination(
  state: QuestV2CandidateApplication["state"],
  expectedHref: { pathname: string; params: { id: string } },
  kind: QuestV2CandidateApplication["kind"] = "SINGLE"
): Promise<void> {
  mockApplications = [];
  mockWorkerAssignments = [];
  mockPush.mockClear();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <NoticeProbe />
    </QueryClientProvider>
  );
  await waitFor(() =>
    expect(
      screen.queryByText("You were selected for Campus cleanup.")
    ).toBeNull()
  );

  mockApplications = [application(state, kind)];
  await act(async () => {
    await screen.rerender(
      <QueryClientProvider client={queryClient}>
        <NoticeProbe />
      </QueryClientProvider>
    );
  });
  const notice =
    state === QuestApplicationStatus.APPLICATION_SELECTED ||
    state === QuestTeamStatus.TEAM_SELECTED
      ? "You were selected for Campus cleanup."
      : "Your application for Campus cleanup was not selected.";
  await fireEvent.press(await screen.findByText(notice));
  expect(mockPush).toHaveBeenCalledWith(expectedHref);
  await screen.unmount();
  queryClient.clear();
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  mockApplications = [];
  mockWorkerAssignments = [];
  mockIsHirer = false;
  mockPathname = "/(tabs)/my-quests";
  mockHirerEventHandler = undefined;
});

describe("useNotificationCoordinator application destinations", () => {
  it("opens Work Hub after selection and Quest Detail after rejection", async () => {
    await expectDecisionDestination(
      QuestApplicationStatus.APPLICATION_SELECTED,
      {
        pathname: "/quest/[id]/work",
        params: { id: "quest-1" },
      }
    );
    await expectDecisionDestination(
      QuestTeamStatus.TEAM_SELECTED,
      {
        pathname: "/quest/[id]/work",
        params: { id: "quest-1" },
      },
      "TEAM"
    );
    await expectDecisionDestination(
      QuestApplicationStatus.APPLICATION_REJECTED,
      {
        pathname: "/quest/[id]",
        params: { id: "quest-1" },
      }
    );
  });
  it("notifies from assignments summary and routes consent to partial start", async () => {
    mockApplications = [];
    mockWorkerAssignments = [];
    mockPathname = "/(tabs)/my-quests";
    mockPush.mockClear();
    const getLiveSnapshot = jest.spyOn(liveQuestService, "getLiveSnapshot");
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <NoticeProbe />
      </QueryClientProvider>
    );
    mockWorkerAssignments = [workerAssignment("UNDERFILLED_CONSENT_PENDING")];
    await act(async () => {
      await screen.rerender(
        <QueryClientProvider client={queryClient}>
          <NoticeProbe />
        </QueryClientProvider>
      );
    });
    const notice = "A quest you joined needs your response.";
    await fireEvent.press(await screen.findByText(notice));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/partial-start",
      params: { id: "quest-worker" },
    });
    expect(getLiveSnapshot).not.toHaveBeenCalled();
    await screen.unmount();
    queryClient.clear();
  });

  it("stays silent on first load and avoids duplicates after an omitted poll", async () => {
    mockApplications = [];
    mockWorkerAssignments = [
      { ...workerAssignment("UNDERFILLED_CONSENT_PENDING"), underfilled: null },
    ];
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <NoticeProbe />
      </QueryClientProvider>
    );
    expect(
      screen.queryByText("A quest you joined needs your response.")
    ).toBeNull();

    mockWorkerAssignments = [workerAssignment("UNDERFILLED_CONSENT_PENDING")];
    await act(async () => {
      await screen.rerender(
        <QueryClientProvider client={queryClient}>
          <NoticeProbe />
        </QueryClientProvider>
      );
    });
    const notice = "A quest you joined needs your response.";
    await screen.findByText(notice);
    mockWorkerAssignments = [];
    await act(async () => {
      await screen.rerender(
        <QueryClientProvider client={queryClient}>
          <NoticeProbe />
        </QueryClientProvider>
      );
    });
    mockWorkerAssignments = [workerAssignment("UNDERFILLED_CONSENT_PENDING")];
    await act(async () => {
      await screen.rerender(
        <QueryClientProvider client={queryClient}>
          <NoticeProbe />
        </QueryClientProvider>
      );
    });
    expect(screen.getAllByText(notice)).toHaveLength(1);
    await screen.unmount();
    queryClient.clear();
  });

  it("uses cancellation reason and does not suppress notices on another Quest route", async () => {
    mockApplications = [];
    mockWorkerAssignments = [workerAssignment("UNDERFILLED_DECISION_PENDING")];
    mockPathname = "/quest/another-quest";
    const getLiveSnapshot = jest.spyOn(liveQuestService, "getLiveSnapshot");
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <NoticeProbe />
      </QueryClientProvider>
    );
    mockWorkerAssignments = [
      workerAssignment("UNDERFILLED_CANCELLED", "WORKER_DECLINED"),
    ];
    await act(async () => {
      await screen.rerender(
        <QueryClientProvider client={queryClient}>
          <NoticeProbe />
        </QueryClientProvider>
      );
    });
    expect(
      await screen.findByText(
        "A worker declined revised terms; a quest you joined was cancelled."
      )
    ).toBeTruthy();
    expect(getLiveSnapshot).not.toHaveBeenCalled();
    await screen.unmount();
    queryClient.clear();
  });

  it("includes Hirer decision expiry and opens Quest Detail from another Quest page", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    mockIsHirer = true;
    mockPathname = "/quest/another-quest";
    mockApplications = [];
    mockWorkerAssignments = [];
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <NoticeProbe />
      </QueryClientProvider>
    );
    await act(async () => {
      mockHirerEventHandler?.({
        type: "HIRER_QUEST_UPDATED",
        version: 1,
        questId: "quest-decision",
        changeType: "UNDERFILLED_DECISION_PENDING",
        expiresAt: "2026-10-01T00:00:30.000Z",
      });
    });
    await fireEvent.press(
      await screen.findByText(
        "Not enough workers joined. Choose whether to proceed or cancel within 00:30."
      )
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-decision" },
    });
    await screen.unmount();
    queryClient.clear();
    jest.useRealTimers();
  });
});
