import { Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import type { QuestV2RewardAllocation } from "@/api/questV2Contracts";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import TeamRewardAllocationCard from "@/features/questBoard/work/components/TeamRewardAllocationCard";
import { useLocale } from "@/features/preferences/localeStore";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { spacing } from "@/theme/spacing";
import { Text, View } from "@/tw";

function createPreviewAllocation(
  messages: QuestWorkMessages
): QuestV2RewardAllocation {
  return {
    status: "PENDING",
    leaderId: "00000000-0000-4000-8000-000000000001",
    totalRewardSatang: 20_000,
    deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    settledAt: null,
    viewerIsLeader: true,
    members: [
      {
        memberId: "00000000-0000-4000-8000-000000000001",
        displayName: messages.allocationPreviewLeaderName,
        isLeader: true,
        percentageBasisPoints: null,
        rewardSatang: null,
      },
      ...Array.from({ length: 4 }, (_, index) => ({
        memberId:
          "00000000-0000-4000-8000-" + String(index + 2).padStart(12, "0"),
        displayName: messages.allocationPreviewTeammateName(index + 1),
        isLeader: false,
        percentageBasisPoints: null,
        rewardSatang: null,
      })),
    ],
  };
}

export default function TeamRewardAllocationPreviewScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const baseMessages = questWorkMessages[locale];
  const previewAllocation = createPreviewAllocation(baseMessages);
  const previewMessages = {
    ...baseMessages,
    allocationSubmit: baseMessages.allocationPreviewSubmit,
    allocationSubmitting: baseMessages.allocationPreviewSubmitting,
  };

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        title={baseMessages.allocationPreviewTitle}
        backLabel={baseMessages.allocationPreviewBack}
        onBackPress={() => router.back()}
        variant="detail"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View className="gap-ku-md px-ku-md pt-ku-md">
          <View
            accessibilityRole="summary"
            className="gap-ku-xs rounded-ku-card bg-ku-surface-raised p-ku-md"
          >
            <Text
              accessibilityRole="header"
              className="font-ku-bold text-ku-body-small text-ku-text-strong"
            >
              {baseMessages.allocationPreviewNoticeTitle}
            </Text>
            <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
              {baseMessages.allocationPreviewNoticeDescription}
            </Text>
          </View>

          <View className="gap-ku-xs px-ku-xs">
            <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
              {baseMessages.allocationPreviewQuestTitle}
            </Text>
            <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
              {baseMessages.allocationPreviewTeamRoster}
            </Text>
          </View>

          <TeamRewardAllocationCard
            allocation={previewAllocation}
            messages={previewMessages}
            submitting={false}
            onSubmit={async () => {
              Alert.alert(
                baseMessages.allocationPreviewAlertTitle,
                baseMessages.allocationPreviewAlertDescription
              );
            }}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
