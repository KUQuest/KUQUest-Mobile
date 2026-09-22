import { Image, Pressable, ScrollView, View } from "@/tw";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExternalLink } from "@/components/external-link";
import { ThemedText } from "@/components/themed-text";
import { Collapsible } from "@/components/ui/collapsible";
import { WebBadge } from "@/components/web-badge";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { bottomTabInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + bottomTabInset + spacing.md,
  };
  const { colors } = useAppTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: spacing.xl * 2,
      paddingBottom: spacing.lg,
    },
  });

  return (
    <ScrollView
      className={styles.scrollView}
      style={{ backgroundColor: colors.background }}
      contentInset={insets}
      contentContainerClassName={styles.contentContainer}
      contentContainerStyle={contentPlatformStyle}
    >
      <View
        className={styles.container}
        style={{ backgroundColor: colors.background }}
      >
        <View className={styles.titleContainer}>
          <ThemedText type="subtitle">Explore</ThemedText>
          <ThemedText className={styles.centerText} themeColor="textSecondary">
            This starter app includes example{"\n"}code to help you get started.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <View
                className={styles.linkButton}
                style={{ backgroundColor: colors.surfaceMuted }}
              >
                <ThemedText type="link">Expo documentation</ThemedText>
                <SymbolView
                  tintColor={colors.text}
                  name={{
                    ios: "arrow.up.right.square",
                    android: "link",
                    web: "link",
                  }}
                  size={12}
                />
              </View>
            </Pressable>
          </ExternalLink>
        </View>

        <View className={styles.sectionsWrapper}>
          <Collapsible title="File-based routing">
            <ThemedText type="small">
              This app has two screens:{" "}
              <ThemedText type="code">src/app/index.tsx</ThemedText> and{" "}
              <ThemedText type="code">src/app/explore.tsx</ThemedText>
            </ThemedText>
            <ThemedText type="small">
              The layout file in{" "}
              <ThemedText type="code">src/app/_layout.tsx</ThemedText> sets up
              the tab navigator.
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="linkPrimary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <View
              className={styles.collapsibleContent}
              style={{ backgroundColor: colors.surfaceMuted }}
            >
              <ThemedText type="small">
                You can open this project on Android, iOS, and the web. To open
                the web version, press{" "}
                <ThemedText type="smallBold">w</ThemedText> in the terminal
                running this project.
              </ThemedText>
              <Image
                source={require("@/assets/images/tutorial-web.png")}
                className={styles.imageTutorial}
              />
            </View>
          </Collapsible>

          <Collapsible title="Images">
            <ThemedText type="small">
              For static images, you can use the{" "}
              <ThemedText type="code">@2x</ThemedText> and{" "}
              <ThemedText type="code">@3x</ThemedText> suffixes to provide files
              for different screen densities.
            </ThemedText>
            <Image
              source={require("@/assets/images/react-logo.png")}
              className={styles.imageReact}
            />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="linkPrimary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Light and dark mode components">
            <ThemedText type="small">
              This app follows system light and dark mode through the{" "}
              <ThemedText type="code">useAppTheme()</ThemedText> context hook.
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <ThemedText type="linkPrimary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Animations">
            <ThemedText type="small">
              This template includes an example of an animated component. The{" "}
              <ThemedText type="code">
                src/components/ui/collapsible.tsx
              </ThemedText>{" "}
              component uses the powerful{" "}
              <ThemedText type="code">react-native-reanimated</ThemedText>{" "}
              library to animate opening this hint.
            </ThemedText>
          </Collapsible>
        </View>
        {Platform.OS === "web" && <WebBadge />}
      </View>
    </ScrollView>
  );
}

const styles = {
  scrollView: "flex-1",
  contentContainer: "flex-row justify-center",
  container: "grow max-w-[800px]",
  titleContainer: "items-center gap-ku-md px-ku-lg py-ku-64",
  centerText: "text-center",
  linkButton:
    "items-center flex-row gap-ku-xs justify-center px-ku-lg py-ku-sm rounded-[32px]",
  sectionsWrapper: "gap-ku-xl px-ku-lg pt-ku-md",
  collapsibleContent: "items-center",
  imageTutorial: "mt-ku-sm w-full aspect-[296/171] rounded-[16px]",
  imageReact: "h-[100px] self-center w-[100px]",
} as const;
