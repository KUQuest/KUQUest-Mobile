import { Tabs, useRouter, useSegments } from "expo-router";
import { useWindowDimensions } from "react-native";

import { BottomNav } from "@/components/navigation/BottomNav";
import { useLocale } from "@/features/preferences/localeStore";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import {
  QuestAssignmentStatus,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import {
  useWorkerAssignmentsQuery,
  useWorkerParticipationDetailQuery,
} from "@/features/workerHome/api/workerHomeQueries";
import { WorkerQuickAccessBar } from "@/features/workerHome/components/WorkerQuickAccessBar";

export default function TabsLayout() {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);
  const segments = useSegments();
  const { locale } = useLocale();
  const { isWorker } = useRoleWorkspace();
  const router = useRouter();
  const assignments = useWorkerAssignmentsQuery("all", isWorker).data ?? [];
  const ongoing = assignments.filter(
    (assignment) =>
      assignment.state === QuestAssignmentStatus.ASSIGNMENT_ACTIVE &&
      (assignment.questState === QuestStatus.QUEST_ASSIGNED ||
        assignment.questState === QuestStatus.QUEST_IN_PROGRESS)
  );
  const activeAssignment = isWorker ? (ongoing[0] ?? null) : null;
  const activeQuest = useWorkerParticipationDetailQuery(
    activeAssignment?.questId ?? null
  ).data;
  const currentQuestState = activeQuest?.state ?? activeAssignment?.questState;
  const showWorkerDock = Boolean(
    activeAssignment &&
    (currentQuestState === QuestStatus.QUEST_ASSIGNED ||
      currentQuestState === QuestStatus.QUEST_IN_PROGRESS)
  );
  const messages = navigationMessages[locale];
  const isTablet = metrics.isTablet;
  const isCreateQuest = segments[segments.length - 1] === "create";
  const isChatConversation = segments[segments.length - 2] === "chat";
  // Worker Work Management is a primary destination and keeps the nav;
  // the Hirer's My Quests is a sub-page with its own back button.
  const isHirerMyQuests =
    segments[segments.length - 1] === "my-quests" && !isWorker;

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) =>
        isCreateQuest || isChatConversation || isHirerMyQuests ? null : (
          <>
            <BottomNav {...props} />
            {showWorkerDock &&
            props.state.routes[props.state.index]?.name !== "index" ? (
              <WorkerQuickAccessBar
                assignment={activeAssignment}
                bottomInset={getBottomNavigationInset(
                  metrics,
                  props.insets.bottom
                )}
                questState={currentQuestState}
                questTitle={activeQuest?.title}
                onPress={() => {
                  if (ongoing.length === 1 && activeAssignment) {
                    router.push({
                      pathname: "/quest/[id]/work",
                      params: { id: activeAssignment.questId },
                    });
                  } else {
                    router.push("/my-quests");
                  }
                }}
              />
            ) : null}
          </>
        )
      }
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle:
          showWorkerDock &&
          route.name !== "index" &&
          route.name !== "create" &&
          !isChatConversation &&
          !isTablet
            ? { paddingBottom: spacing.px76 }
            : undefined,
        tabBarPosition: isTablet ? "left" : "bottom",
        tabBarStyle: {
          width: isTablet ? metrics.tabletNavWidth : undefined,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          position: isTablet ? "relative" : "absolute",
          shadowOpacity: 0,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: messages.board }} />
      <Tabs.Screen name="money" options={{ title: messages.money }} />
      <Tabs.Screen name="create" options={{ title: messages.create }} />
      <Tabs.Screen
        name="my-quests"
        options={{ title: messages.workManagement }}
      />
      <Tabs.Screen name="chat" options={{ title: messages.chat }} />
      <Tabs.Screen name="profile" options={{ title: messages.profile }} />
    </Tabs>
  );
}
