import { version } from "expo/package.json";
import { useColorScheme } from "react-native";

import { ThemedText } from "./themed-text";

import { useTheme } from "@/hooks/use-theme";
import { Image, View } from "@/tw";

export function WebBadge() {
  const scheme = useColorScheme();
  const theme = useTheme();

  return (
    <View
      className={styles.container}
      style={{ backgroundColor: theme.background }}
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
