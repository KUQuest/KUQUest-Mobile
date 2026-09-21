import { View, type ViewProps } from "react-native";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { ThemeColors } from "@/theme/colors";

export type ThemedViewProps = ViewProps & {
  type?: keyof ThemeColors;
};

export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[{ backgroundColor: colors[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}
