import type { ReactNode } from "react";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { View } from "@/tw";

import { ThemedText } from "./themed-text";

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({
  title = "Try editing",
  hint = "app/index.tsx",
}: HintRowProps) {
  const { colors } = useAppTheme();

  return (
    <View className={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <View
        className={styles.codeSnippet}
        style={{ backgroundColor: colors.surfaceAccent }}
      >
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </View>
    </View>
  );
}

const styles = {
  stepRow: "flex-row justify-between",
  codeSnippet: "px-ku-sm py-ku-2 rounded-[8px]",
} as const;
