import { Text, View } from "@/tw";
import type { ThemeColors } from "@/theme/colors";

export function SelectRosterHeader({
  questTitle,
  subtitle,
  requestedHeadcountLabel,
  requestedHeadcount,
  actualHeadcountLabel,
  actualHeadcount,
  proposalCountLabel,
  colors,
}: {
  questTitle: string;
  subtitle: string;
  requestedHeadcountLabel: string;
  requestedHeadcount: number;
  actualHeadcountLabel: string;
  actualHeadcount: number;
  proposalCountLabel: string;
  colors: ThemeColors;
}) {
  return (
    <View className="mb-ku-md">
      <Text
        accessibilityRole="header"
        className="font-ku-bold text-ku-title"
        style={{ color: colors.textStrong }}
      >
        {questTitle}
      </Text>
      <Text className="mt-ku-sm" style={{ color: colors.textSecondary }}>
        {subtitle}
      </Text>
      <View
        className="mt-ku-md flex-row justify-between rounded-2xl p-ku-md"
        style={{ backgroundColor: colors.surfaceMuted }}
      >
        <View>
          <Text
            className="text-ku-label"
            style={{ color: colors.textSecondary }}
          >
            {requestedHeadcountLabel}
          </Text>
          <Text
            className="mt-ku-xs font-ku-bold"
            style={{ color: colors.textStrong }}
          >
            {requestedHeadcount}
          </Text>
        </View>
        <View>
          <Text
            className="text-ku-label"
            style={{ color: colors.textSecondary }}
          >
            {actualHeadcountLabel}
          </Text>
          <Text
            className="mt-ku-xs font-ku-bold"
            style={{ color: colors.textStrong }}
          >
            {actualHeadcount}
          </Text>
        </View>
        <View>
          <Text
            className="text-ku-label"
            style={{ color: colors.textSecondary }}
          >
            {proposalCountLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
