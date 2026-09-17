import type { ReactNode } from "react";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

import styles from "../roleplayStyles";

export type RoleplayActionButtonVariant =
  "primary" | "secondary" | "danger" | "neutral";

interface RoleplayActionButtonProps {
  label: string;
  description: string;
  onPress: () => void;
  testID: string;
  variant?: RoleplayActionButtonVariant;
  disabled?: boolean;
  compact?: boolean;
  icon?: ReactNode;
}

export function RoleplayActionButton({
  label,
  description,
  onPress,
  testID,
  variant = "primary",
  disabled = false,
  compact = false,
  icon,
}: RoleplayActionButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isNeutral = variant === "neutral";

  return (
    <Pressable
      accessibilityLabel={`${label}. ${description}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        styles.actionButton,
        isPrimary && styles.actionButtonPrimary,
        !isPrimary && !isDanger && !isNeutral && styles.actionButtonSecondary,
        isDanger && styles.actionButtonDanger,
        isNeutral && styles.actionButtonNeutral,
        compact && styles.actionButtonCompact,
        disabled && styles.actionButtonDisabled
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      {icon}
      <View
        className={cn(styles.actionCopy, compact && styles.actionCopyCompact)}
      >
        <Text
          className={cn(
            styles.actionText,
            isPrimary && styles.actionTextLight,
            !isPrimary && !isDanger && styles.actionTextPrimary,
            isDanger && styles.actionTextDanger,
            isNeutral && styles.actionTextNeutral
          )}
        >
          {label}
        </Text>
        {!compact ? (
          <Text
            className={cn(
              styles.actionDescription,
              isPrimary
                ? styles.actionDescriptionLight
                : styles.actionDescriptionMuted
            )}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

RoleplayActionButton.displayName = "RoleplayActionButton";
