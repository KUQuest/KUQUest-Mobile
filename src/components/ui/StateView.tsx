import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { AlertCircle } from "lucide-react-native";

import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { colors } from "@/theme/colors";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

interface StateContentProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type StateViewProps =
  | (StateContentProps & { variant: "empty" | "error" })
  | {
      variant: "loading";
      loadingLabel: string;
      children: React.ReactNode;
      style?: StyleProp<ViewStyle>;
      contentStyle?: StyleProp<ViewStyle>;
      testID?: string;
    };

const styles = {
  state: "items-center justify-center min-h-[330px] px-[24px]",
  stateIcon:
    "items-center bg-ku-surface-accent rounded-ku-pill h-[68px] justify-center mb-[16px] w-[68px]",
  stateTitle:
    "text-ku-text-strong font-ku-semibold text-ku-emphasis-large text-center",
  stateDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-[4px] text-center",
  stateAction:
    "bg-ku-primary rounded-ku-pill mt-[16px] min-h-[48px] justify-center px-[24px]",
  stateActionText: "text-ku-white font-ku-semibold text-ku-body-small",
  alertIcon: "bg-ku-surface-danger",
} as const;

export function StateView(props: StateViewProps) {
  if (props.variant === "loading") {
    return (
      <LoadingSkeleton
        contentStyle={props.contentStyle}
        loadingLabel={props.loadingLabel}
        style={props.style}
        testID={props.testID}
      >
        {props.children}
      </LoadingSkeleton>
    );
  }

  const isError = props.variant === "error";
  return (
    <View
      accessibilityRole={isError ? "alert" : undefined}
      accessibilityLiveRegion={isError ? "assertive" : "polite"}
      className={styles.state}
    >
      <View className={cn(styles.stateIcon, isError && styles.alertIcon)}>
        <AlertCircle
          color={isError ? colors.dangerDark : colors.textMuted}
          size={34}
          strokeWidth={1.8}
        />
      </View>
      <Text className={styles.stateTitle}>{props.title}</Text>
      <Text className={styles.stateDescription}>{props.description}</Text>
      {props.actionLabel && props.onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={props.onAction}
          className={styles.stateAction}
        >
          <Text className={styles.stateActionText}>{props.actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
