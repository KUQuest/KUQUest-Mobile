import { Pressable, Text } from "@/tw";
import { cn } from "@/tw/cn";
import styles from "../createQuestStyles";

type ReviewActionButtonProps = {
  label: string;
  variant: "primary" | "secondary";
  accessibilityLabel: string;
  disabled: boolean;
  stacked: boolean;
  testID: string;
  onPress: () => void;
};

export function ReviewActionButton({
  label,
  variant,
  accessibilityLabel,
  disabled,
  stacked,
  testID,
  onPress,
}: ReviewActionButtonProps) {
  const isSecondary = variant === "secondary";
  const layoutStyle = stacked
    ? {
        flexBasis: "auto" as const,
        flexGrow: 0,
        flexShrink: 0,
        width: "100%" as const,
      }
    : {
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        width: "auto" as const,
      };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        styles.reviewActionButton,
        stacked && styles.reviewActionButtonStacked,
        isSecondary
          ? styles.reviewActionButtonSecondary
          : styles.reviewActionButtonPrimary
      )}
      disabled={disabled}
      onPress={onPress}
      style={[layoutStyle, { opacity: disabled ? 0.55 : 1 }]}
      testID={testID}
    >
      <Text
        className={cn(
          styles.reviewActionText,
          isSecondary
            ? styles.reviewActionTextSecondary
            : styles.reviewActionTextPrimary
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
