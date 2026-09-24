import type { ComponentRef, Ref } from "react";
import { Calendar, CalendarClock, Clock } from "lucide-react-native";
import type { Pressable as RNPressable } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
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
  helper,
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
  helper: string;
  emptyLabel: string;
  fieldRef: Ref<ComponentRef<typeof RNPressable>>;
  hasValue: boolean;
  testID?: string;
  onPress: () => void;
  onDatePress?: () => void;
  onTimePress?: () => void;
  messages?: (typeof createQuestMessages)["en"];
}) {
  const hasDate = Boolean(dateFormatted && dateFormatted !== emptyLabel);
  const hasTime = Boolean(timeValue && TIME_PATTERN.test(timeValue));

  return (
    <View className={styles.scheduleCard}>
      <View className={styles.scheduleCardHeader}>
        <View className={styles.scheduleCardTitle}>
          <CalendarClock color={colors.hirer} size={18} strokeWidth={2.2} />
          <Text className={styles.scheduleCardTitle}>{label}</Text>
        </View>
        {hasDate && hasTime ? (
          <View className="rounded-ku-pill bg-ku-surface-success px-ku-sm py-ku-2">
            <Text className="font-ku-bold text-ku-label text-ku-success">
              {timeValue}
            </Text>
          </View>
        ) : null}
      </View>

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
              error ? styles.scheduleSplitBtnError : null
            )}
            testID={testID ? `${testID}-date-btn` : undefined}
          >
            <View className={styles.scheduleSplitBtnCopy}>
              <Text className={styles.scheduleSplitBtnLabel}>{dateLabel}</Text>
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
            <Calendar
              color={hasDate ? colors.hirer : colors.textMuted}
              size={18}
              strokeWidth={2}
            />
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
              error ? styles.scheduleSplitBtnError : null
            )}
            testID={testID ? `${testID}-time-btn` : undefined}
          >
            <View className={styles.scheduleSplitBtnCopy}>
              <Text className={styles.scheduleSplitBtnLabel}>{timeLabel}</Text>
              <Text
                numberOfLines={1}
                className={cn(
                  styles.scheduleSplitBtnValue,
                  !hasTime && styles.placeholderText
                )}
              >
                {hasTime ? timeValue : (messages?.selectTime ?? "Select time")}
              </Text>
            </View>
            <Clock
              color={hasTime ? colors.hirer : colors.textMuted}
              size={18}
              strokeWidth={2}
            />
          </Pressable>
        </View>
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
