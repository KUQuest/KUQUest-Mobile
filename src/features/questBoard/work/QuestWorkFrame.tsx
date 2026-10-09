import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { RefreshCw } from "lucide-react-native";

import type { QuestV2Team } from "@/api/questV2Contracts";
import { Pressable, ScrollView, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";

export interface QuestWorkFrameProps {
  messages: QuestWorkMessages;
  backLabel: string;
  onBack: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  contentBottom: number;
  children: ReactNode;
}

/** Sections the Work Hub root builds once; each Team screen arranges them. */
export interface TeamWorkScreenProps {
  frame: Omit<QuestWorkFrameProps, "children">;
  snapshot: LiveQuestSnapshot;
  team: QuestV2Team;
  messages: QuestWorkMessages;
  statusCard: ReactNode;
  settlementCard: ReactNode;
  actionsCard: ReactNode;
  onSubmitAllocation?: (
    shares: { memberId: string; percentageBasisPoints: number }[]
  ) => Promise<void>;
  allocationSending?: boolean;
}

/** Chrome shared by every Work Hub screen: top bar, refresh, scroll area. */
export function QuestWorkFrame({
  messages,
  backLabel,
  onBack,
  refreshing,
  onRefresh,
  contentBottom,
  children,
}: QuestWorkFrameProps) {
  const { colors } = useAppTheme();

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        title={messages.title}
        backLabel={backLabel}
        onBackPress={onBack}
        variant="detail"
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.refresh}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-ku-pill active:bg-ku-surface-raised"
            onPress={onRefresh}
          >
            <RefreshCw color={colors.primaryDark} size={20} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: contentBottom }}
          testID="quest-work-screen"
        >
          <View className="gap-ku-md px-ku-md pt-ku-md">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
