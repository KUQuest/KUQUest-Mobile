import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

export type ChipTone = "accent" | "tag" | "tab" | "primary";

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  active?: boolean;
  leadingIcon?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const toneStyles: Record<
  ChipTone,
  {
    container: string;
    text: string;
    selectedContainer: string;
    selectedText: string;
  }
> = {
  accent: {
    container: "bg-ku-surface-accent border-ku-border-accent",
    text: "text-ku-primary",
    selectedContainer: "bg-ku-primary border-ku-primary",
    selectedText: "text-ku-white",
  },
  tag: {
    container: "bg-ku-surface-accent border-ku-border-accent",
    text: "text-ku-primary-dark",
    selectedContainer: "bg-ku-primary border-ku-primary",
    selectedText: "text-ku-white",
  },
  tab: {
    container: "bg-ku-surface-muted border-ku-border-subtle",
    text: "text-ku-text-secondary",
    selectedContainer: "bg-ku-primary border-ku-primary",
    selectedText: "text-ku-white",
  },
  primary: {
    container: "bg-ku-primary border-ku-primary",
    text: "text-ku-white",
    selectedContainer: "bg-ku-primary border-ku-primary",
    selectedText: "text-ku-white",
  },
};

export function Chip({
  label,
  tone = "accent",
  selected = false,
  active = false,
  leadingIcon,
  onPress,
  accessibilityLabel,
  className,
  textClassName,
  style,
  textStyle,
  testID,
}: ChipProps) {
  const isSelected = selected || active;
  const styles = toneStyles[tone];
  const containerClassName = cn(
    "flex-row items-center justify-center rounded-ku-pill border",
    isSelected ? styles.selectedContainer : styles.container,
    className
  );
  const textClassNameResolved = cn(
    isSelected ? styles.selectedText : styles.text,
    textClassName
  );
  const content = (
    <>
      {leadingIcon}
      <Text className={textClassNameResolved} style={textStyle}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View className={containerClassName} style={style} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={containerClassName}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}
