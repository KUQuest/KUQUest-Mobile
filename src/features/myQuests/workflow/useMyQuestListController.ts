import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { useCancelQuestMutation } from "@/features/questBoard/api/questBoardQueries";
import { useFileDispute } from "@/features/questBoard/dispute/useFileDispute";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { useMyHirerQuestsQuery } from "../api/myQuestsQueries";
import {
  projectMyQuestWorkspace,
  type MyQuestTab,
} from "../myQuestWorkspaceProjection";
import type { QuestCardAction, QuestSummary } from "../myQuestTypes";

const ACTION_PATHNAMES = {
  edit: "/quest/[id]/edit",
  manage: "/quest/[id]/manage",
  review: "/quest/[id]/review",
} as const satisfies Record<Exclude<QuestCardAction, "dispute">, string>;

export interface MyQuestListScreenProps {
  initialTab?: string;
}

export function useMyQuestListController({
  initialTab,
}: MyQuestListScreenProps = {}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = myQuestMessages[locale];
  const { colors: palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [requestedTab, setRequestedTab] = useState<string | undefined>(
    initialTab
  );
  const hirerQuery = useMyHirerQuestsQuery();
  const hirerQuests = hirerQuery.data ?? null;
  const projection = useMemo(
    () => projectMyQuestWorkspace({ requestedTab, locale, hirerQuests }),
    [hirerQuests, locale, requestedTab]
  );

  const {
    mutateAsync: cancelQuestAsync,
    isPending: cancelPending,
    variables: cancelVariables,
  } = useCancelQuestMutation();

  const { confirmFileDispute } = useFileDispute();
  const runQuestAction = useCallback(
    (quest: QuestSummary, action: QuestCardAction) => {
      if (action === "dispute") {
        confirmFileDispute(quest.id);
        return;
      }
      router.push({
        pathname: ACTION_PATHNAMES[action],
        params: { id: quest.id },
      });
    },
    [confirmFileDispute, router]
  );
  const openQuest = useCallback(
    (quest: QuestSummary) => {
      // A draft has no published detail yet; opening it continues editing.
      if (quest.primaryAction === "edit") {
        runQuestAction(quest, "edit");
        return;
      }
      router.push({
        pathname: "/quest/[id]",
        params: { id: quest.id, mode: "post" },
      });
    },
    [router, runQuestAction]
  );
  // ADR 0003 Tier 1: Draft and Open cancellation carries no penalty, so a
  // standard confirmation is the required friction.
  const cancelQuest = useCallback(
    (quest: QuestSummary) => {
      if (!quest.cancelFromCard) return;
      Alert.alert(
        messages.cancelConfirmTitle,
        quest.cancelFromCard === "draft"
          ? messages.cancelDraftDescription
          : messages.cancelOpenDescription,
        [
          { text: messages.keepQuest, style: "cancel" },
          {
            text: messages.cancelQuest,
            style: "destructive",
            onPress: () => {
              cancelQuestAsync({
                questId: quest.id,
                idempotencyKey: createQuestIdempotencyKey(),
              })
                .then((outcome) =>
                  Alert.alert(
                    messages.cancelSuccessTitle,
                    outcome.refundedSatang > 0
                      ? messages.cancelRefunded(
                          formatSatang(outcome.refundedSatang, locale)
                        )
                      : undefined
                  )
                )
                .catch((caught: unknown) =>
                  Alert.alert(
                    messages.cancelErrorTitle,
                    caught instanceof Error ? caught.message : undefined
                  )
                );
            },
          },
        ]
      );
    },
    [cancelQuestAsync, locale, messages]
  );
  const onRefresh = useCallback(() => {
    void hirerQuery.refetch().catch(() => undefined);
  }, [hirerQuery]);

  return {
    frame: {
      headerProps: {
        messages,
        palette,
        tabs: projection.tabs,
        selectedTab: projection.selectedTab,
        tabLabels: projection.tabLabels,
        onBackPress: () => router.back(),
        onTabPress: (tab: MyQuestTab) => setRequestedTab(tab),
      },
    },
    content: {
      listProps: {
        messages,
        palette,
        projection,
        isLoading: hirerQuery.isPending,
        isError: hirerQuery.isError,
        refreshing: hirerQuery.isRefetching,
        bottomPadding: insets.bottom + spacing.xl,
        onRefresh,
        onOpenQuest: openQuest,
        onQuestAction: runQuestAction,
        onCancelQuest: cancelQuest,
        cancellingQuestId: cancelPending
          ? (cancelVariables?.questId ?? null)
          : null,
      },
    },
  };
}
