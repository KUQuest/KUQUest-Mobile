import { Clock3, ShieldAlert } from "lucide-react-native";

import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";

export interface QuestProofSummaryCardProps {
  title: string;
  description: string;
  countdown?: string | null;
  error?: string;
}

export function QuestProofSummaryCard({
  title,
  description,
  countdown,
  error,
}: QuestProofSummaryCardProps) {
  return (
    <>
      <View className="mt-[20px] rounded-[18px] border border-ku-border-accent bg-ku-surface-accent p-[16px]">
        <Text className="font-ku-bold text-ku-title-small text-ku-text-strong">
          {title}
        </Text>
        <Text className="mt-[6px] font-ku-regular text-ku-body-small text-ku-text-secondary">
          {description}
        </Text>
        {countdown ? (
          <View className="mt-[14px] flex-row items-center">
            <Clock3 color={colors.primary} size={18} />
            <Text className="ml-[7px] font-ku-semibold text-ku-body-small text-ku-primary">
              {countdown}
            </Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View className="mt-[12px] flex-row items-start rounded-[14px] border border-ku-border-danger bg-ku-surface-danger p-[12px]">
          <ShieldAlert color={colors.danger} size={20} />
          <Text
            accessibilityRole="alert"
            className="ml-[8px] flex-1 font-ku-medium text-ku-body-small text-ku-danger"
          >
            {error}
          </Text>
        </View>
      ) : null}
    </>
  );
}
