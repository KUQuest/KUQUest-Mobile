import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

import styles from "../roleplayStyles";

export type RoleplayActionButtonVariant = "primary" | "secondary" | "danger";

interface RoleplayActionButtonProps {
  label: string;
  description: string;
  onPress: () => void;
  testID: string;
  variant?: RoleplayActionButtonVariant;
  disabled?: boolean;
}

export function RoleplayActionButton({
  label,
  description,
  onPress,
  testID,
  variant = "primary",
  disabled = false,
}: RoleplayActionButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityLabel={`${label}. ${description}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        styles.actionButton,
        isPrimary && styles.actionButtonPrimary,
        !isPrimary && !isDanger && styles.actionButtonSecondary,
        isDanger && styles.actionButtonDanger,
        disabled && styles.actionButtonDisabled
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <View className={styles.actionCopy}>
        <Text
          className={cn(
            styles.actionText,
            isPrimary && styles.actionTextLight,
            !isPrimary && !isDanger && styles.actionTextPrimary,
            isDanger && styles.actionTextDanger
          )}
        >
          {label}
        </Text>
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
      </View>
    </Pressable>
  );
}

RoleplayActionButton.displayName = "RoleplayActionButton";
