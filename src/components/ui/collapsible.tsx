import { PropsWithChildren, useState } from "react";
import { SymbolView } from "expo-symbols";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, View } from "@/tw";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Pressable
        className={styles.heading}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
        onPress={() => setIsOpen((value) => !value)}
      >
        <View
          className={styles.button}
          style={{ backgroundColor: theme.backgroundElement }}
        >
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={14}
            weight="bold"
            tintColor={theme.text}
            style={{ transform: [{ rotate: isOpen ? "-90deg" : "90deg" }] }}
          />
        </View>

        <ThemedText type="small">{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View
            className={styles.content}
            style={{ backgroundColor: theme.backgroundElement }}
          >
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = {
  heading: "items-center flex-row gap-ku-sm",
  button: "items-center h-[24px] justify-center rounded-[12px] w-[24px]",
  content: "ml-ku-lg mt-ku-md rounded-[16px] p-ku-lg",
} as const;
