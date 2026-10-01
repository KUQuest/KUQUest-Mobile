import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type { QuestV2CandidateApplication } from "@/api/questV2Contracts";
import {
  QuestApplicationStatus,
  QuestStatus,
  QuestTeamStatus,
} from "@/features/questBoard/domain/types";
import { useNotificationCoordinator } from "../useNotificationCoordinator";

const mockPush = jest.fn();
let mockApplications: QuestV2CandidateApplication[] = [];

jest.mock("expo-router", () => ({
  useSegments: () => ["(tabs)"],
  usePathname: () => "/(tabs)/my-quests",
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
    isHirer: false,
    isWorker: true,
    workspace: "worker",
  }),
}));
jest.mock("@/features/chat/api/chatQueries", () => ({
  useChatNotificationConversationsQuery: () => ({
    data: { conversations: [], inquiries: [] },
  }),
}));
jest.mock("@/features/myQuests/api/myQuestsQueries", () => ({
  myQuestsKeys: {
    workerCandidateApplications: (viewerId: string) => ["apps", viewerId],
  },
  useMyWorkerCandidateApplicationsQuery: () => ({ data: mockApplications }),
}));
jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToHirerQuestEvents: () => () => undefined,
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
});
