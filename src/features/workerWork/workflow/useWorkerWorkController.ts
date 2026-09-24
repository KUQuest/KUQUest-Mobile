import { useCallback, useMemo, useState } from "react";
import { useWindowDimensions, type ScrollViewProps } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SupportedLocale } from "@/locales/locale";
import {
  workerWorkMessages,
  type WorkerWorkMessages,
  type WorkerWorkTab,
} from "@/locales/workerWorkMessages";
import type { ThemeColors } from "@/theme/colors";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useMyWorkerQuestSnapshotsQuery } from "@/features/myQuests/api/myQuestsQueries";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { projectWorkerWork } from "../workerWorkProjection";
import type { WorkerWorkItem, WorkerWorkProjection } from "../workerWorkTypes";

export interface WorkerWorkControllerProps {
  initialTab?: string;
}

export interface WorkerWorkFrameProps {
  bottomPadding: number;
  locale: SupportedLocale;
  messages: WorkerWorkMessages;
  onScroll: ScrollViewProps["onScroll"];
  palette: ThemeColors;
}

export interface WorkerWorkContentProps {
  counts: Record<WorkerWorkTab, number>;
  hasData: boolean;
  isError: boolean;
  isRefetching: boolean;
  onFindQuests: () => void;
  onOpenWork: (item: WorkerWorkItem) => void;
  onRefresh: () => void;
  onRetry: () => void;
  onTabChange: (tab: WorkerWorkTab) => void;
  projection: WorkerWorkProjection;
  tab: WorkerWorkTab;
  tabs: readonly WorkerWorkTab[];
}

export interface WorkerWorkViewProps {
  frame: WorkerWorkFrameProps;
  content: WorkerWorkContentProps;
}

const TABS: readonly WorkerWorkTab[] = ["active", "history"];

export function useWorkerWorkController({
  initialTab,
}: WorkerWorkControllerProps = {}): WorkerWorkViewProps {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { colors: palette } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerWorkMessages[locale];
  const [tab, setTab] = useState<WorkerWorkTab>(
    initialTab === "history" ? "history" : "active"
  );

  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id ?? null;
  const snapshotsQuery = useMyWorkerQuestSnapshotsQuery(viewerId);
  const projection = useMemo(
    () => projectWorkerWork(snapshotsQuery.data ?? []),
    [snapshotsQuery.data]
  );
  const counts: Record<WorkerWorkTab, number> = {
    active: projection.activeCount,
    history: projection.history.length,
  };

  const metrics = getAppChromeMetrics(width, fontScale);
  const bottomPadding =
    getBottomNavigationInset(metrics, insets.bottom) + spacing.xl;

  const openWork = useCallback(
    (item: WorkerWorkItem) => {
      // Underfilled-start consent and still-open Quests live on Quest Detail;
      // everything else, including proof submission, is in the Work Hub.
      if (
        item.questState === "QUEST_OPEN" ||
        item.action === "consentUnderfilled"
      ) {
        router.push({ pathname: "/quest/[id]", params: { id: item.questId } });
        return;
      }
      router.push({
        pathname: "/quest/[id]/work",
        params: { id: item.questId, ...(viewerId ? { viewerId } : {}) },
      });
    },
    [router, viewerId]
  );

  return {
    frame: {
      bottomPadding,
      locale,
      messages,
      onScroll: handleNavigationScroll,
      palette,
    },
    content: {
      counts,
      hasData: Boolean(snapshotsQuery.data),
      isError: snapshotsQuery.isError,
      isRefetching: snapshotsQuery.isRefetching,
      onFindQuests: () => router.replace("/(tabs)"),
      onOpenWork: openWork,
      onRefresh: () => void snapshotsQuery.refetch(),
      onRetry: () => void snapshotsQuery.refetch(),
      onTabChange: setTab,
      projection,
      tab,
      tabs: TABS,
    },
  };
}
