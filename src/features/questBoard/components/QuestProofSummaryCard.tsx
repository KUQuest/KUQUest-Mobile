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
      <View className="bg-ku-surface-accent border-ku-border-accent rounded-[18px] border mt-[20px] p-[16px]">
        <Text className="text-ku-text-strong font-ku-bold text-ku-title-small">
          {title}
        </Text>
        <Text className="text-ku-text-secondary font-ku-regular text-ku-body-small mt-[6px]">
          {description}
        </Text>
        {countdown ? (
          <View className="items-center flex-row mt-[14px]">
            <Clock3 color={colors.primary} size={18} />
            <Text className="text-ku-primary font-ku-semibold text-ku-body-small ml-[7px]">
              {countdown}
            </Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View className="bg-ku-surface-danger border-ku-border-danger rounded-[14px] border flex-row items-start mt-[12px] p-[12px]">
          <ShieldAlert color={colors.danger} size={20} />
          <Text
            accessibilityRole="alert"
            className="text-ku-danger flex-1 font-ku-medium text-ku-body-small ml-[8px]"
          >
            {error}
          </Text>
        </View>
      ) : null}
    </>
  );
}
