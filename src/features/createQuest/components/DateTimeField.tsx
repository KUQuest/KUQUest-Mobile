import type { ComponentRef, Ref } from "react";
import { CalendarClock } from "lucide-react-native";
import type { Pressable as RNPressable } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import { FieldLabel } from "./FieldLabel";

export function DateTimeField({
  label,
  value,
  error,
  helper,
  emptyLabel,
  fieldRef,
  hasValue,
  testID,
  onPress,
}: {
  label: string;
  value: string;
  error?: string;
  helper: string;
  emptyLabel: string;
  fieldRef: Ref<ComponentRef<typeof RNPressable>>;
  hasValue: boolean;
  testID?: string;
  onPress: () => void;
}) {
  return (
    <View className={styles.fieldGroup}>
      <FieldLabel required optionalLabel="">
        {label}
      </FieldLabel>
      <Pressable
        ref={fieldRef}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || emptyLabel}`}
        accessibilityState={{ disabled: false }}
        onPress={onPress}
        className={cn(styles.dateField, error ? styles.fieldError : null)}
        testID={testID}
        android_ripple={{ color: colors.surfaceAccent }}
      >
        <Text
          className={cn(styles.dateText, !hasValue && styles.placeholderText)}
        >
          {value || emptyLabel}
        </Text>
        <CalendarClock color={colors.textSecondary} size={19} strokeWidth={2} />
      </Pressable>
      <Text
        accessibilityLiveRegion={error ? "assertive" : "none"}
        className={error ? styles.errorText : styles.helperText}
      >
        {error ?? helper}
      </Text>
    </View>
  );
}
