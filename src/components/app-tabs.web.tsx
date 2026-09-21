import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from "expo-router/ui";
import { SymbolView } from "expo-symbols";

import { ExternalLink } from "./external-link";
import { ThemedText } from "./themed-text";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Pressable, View } from "@/tw";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable {...props} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <View
        className={styles.tabButtonView}
        style={{
          backgroundColor: isFocused
            ? colors.surfaceAccent
            : colors.surfaceMuted,
        }}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { colors } = useAppTheme();

  return (
    <View {...props} className={styles.tabListContainer}>
      <View
        className={styles.innerContainer}
        style={{ backgroundColor: colors.surfaceMuted }}
      >
        <ThemedText type="smallBold" className={styles.brandText}>
          Expo Starter
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable className={styles.externalPressable}>
            <ThemedText type="link">Docs</ThemedText>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: "arrow.up.right.square", web: "link" }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = {
  tabListContainer:
    "absolute items-center flex-row justify-center p-ku-md w-full",
  innerContainer:
    "grow items-center flex-row gap-ku-sm max-w-[800px] px-ku-xl py-ku-sm rounded-[32px]",
  brandText: "mr-auto",
  tabButtonView: "px-ku-md py-ku-xs rounded-[16px]",
  externalPressable: "items-center flex-row gap-ku-xs justify-center ml-ku-md",
} as const;
