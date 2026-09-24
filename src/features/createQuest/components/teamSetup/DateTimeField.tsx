import type { ComponentRef, Ref } from "react";
import { Calendar, Clock } from "lucide-react-native";
import type { Pressable as RNPressable } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "../createQuestStyles";
import { TIME_PATTERN } from "../../domain/createQuestModel";
import type { createQuestMessages } from "@/locales/createQuestMessages";

export function DateTimeField({
  label,
  value,
  dateFormatted,
  dateLabel,
  timeValue,
  timeLabel,
  error,
  emptyLabel,
  fieldRef,
  hasValue,
  testID,
  onPress,
  onDatePress,
  onTimePress,
  messages,
}: {
  label: string;
  value: string;
  dateFormatted?: string;
  dateLabel: string;
  timeValue?: string;
  timeLabel: string;
  error?: string;
  emptyLabel: string;
  fieldRef: Ref<ComponentRef<typeof RNPressable>>;
  hasValue: boolean;
  testID?: string;
  onPress: () => void;
  onDatePress?: () => void;
  onTimePress?: () => void;
  messages?: (typeof createQuestMessages)["en"];
}) {
  const { colors } = useAppTheme();
  const hasDate = Boolean(dateFormatted && dateFormatted !== emptyLabel);
  const hasTime = Boolean(timeValue && TIME_PATTERN.test(timeValue));

  return (
    <View className={styles.timelineRow}>
      <View className={styles.timelineRail}>
        <View
          className={cn(styles.timelineDot, hasValue && styles.timelineDotDone)}
        />
      </View>
      <View className={styles.timelineBody}>
        <Text className={styles.timelineLabel}>{label}</Text>
        <Pressable
          ref={fieldRef}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value || emptyLabel}`}
          accessibilityState={{ disabled: false }}
          onPress={onPress}
          testID={testID}
        >
          <View className={styles.scheduleSplitRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${messages?.selectDate ?? "Select date"}: ${dateFormatted || emptyLabel}`}
              onPress={(event) => {
                event.stopPropagation();
                (onDatePress ?? onPress)();
              }}
              className={cn(
                styles.scheduleSplitBtn,
                styles.scheduleDateBtn,
                error ? styles.scheduleSplitBtnError : null
              )}
              testID={testID ? `${testID}-date-btn` : undefined}
            >
              <Calendar
                color={hasDate ? colors.hirer : colors.textMuted}
                size={18}
                strokeWidth={2}
              />
              <View className={styles.scheduleSplitBtnCopy}>
                <Text className={styles.scheduleSplitBtnLabel}>
                  {dateLabel}
                </Text>
                <Text
                  numberOfLines={1}
                  className={cn(
                    styles.scheduleSplitBtnValue,
                    !hasDate && styles.placeholderText
                  )}
                >
                  {dateFormatted || emptyLabel}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${messages?.selectTime ?? "Select time"}: ${timeValue || emptyLabel}`}
              onPress={(event) => {
                event.stopPropagation();
                (onTimePress ?? onPress)();
              }}
              className={cn(
                styles.scheduleSplitBtn,
                styles.scheduleTimeBtn,
                error ? styles.scheduleSplitBtnError : null
              )}
              testID={testID ? `${testID}-time-btn` : undefined}
            >
              <Clock
                color={hasTime ? colors.hirer : colors.textMuted}
                size={18}
                strokeWidth={2}
              />
              <View className={styles.scheduleSplitBtnCopy}>
                <Text className={styles.scheduleSplitBtnLabel}>
                  {timeLabel}
                </Text>
                <Text
                  numberOfLines={1}
                  className={cn(
                    styles.scheduleSplitBtnValue,
                    !hasTime && styles.placeholderText
                  )}
                >
                  {hasTime
                    ? timeValue
                    : (messages?.selectTime ?? "Select time")}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
        {error ? (
          <Text
            accessibilityLiveRegion="assertive"
            className={styles.errorText}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
