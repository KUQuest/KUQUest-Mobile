import { version } from "expo/package.json";

import { ThemedText } from "./themed-text";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Image, View } from "@/tw";

export function WebBadge() {
  const { scheme, colors } = useAppTheme();

  return (
    <View
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <ThemedText
        type="code"
        themeColor="textSecondary"
        className={styles.versionText}
      >
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === "dark"
            ? require("@/assets/images/expo-badge-white.png")
            : require("@/assets/images/expo-badge.png")
        }
        className={styles.badgeImage}
      />
    </View>
  );
}

const styles = {
  container: "items-center gap-ku-sm p-ku-xl",
  versionText: "text-center",
  badgeImage: "aspect-[5.125] w-[123px]",
} as const;
