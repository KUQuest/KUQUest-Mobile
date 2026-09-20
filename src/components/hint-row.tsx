import type { ReactNode } from "react";

import { useTheme } from "@/hooks/use-theme";
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
  const theme = useTheme();

  return (
    <View className={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <View
        className={styles.codeSnippet}
        style={{ backgroundColor: theme.backgroundSelected }}
      >
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </View>
    </View>
  );
}

const styles = {
  stepRow: "flex-row justify-between",
  codeSnippet: "px-ku-sm py-[2px] rounded-[8px]",
} as const;
