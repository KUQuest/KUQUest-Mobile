import type { ComponentRef, Ref } from "react";
import { Calendar, CalendarClock, Clock } from "lucide-react-native";
import type { Pressable as RNPressable } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import { TIME_PATTERN } from "../createQuestModel";
import type { createQuestMessages } from "@/locales/createQuestMessages";

export function DateTimeField({
  label,
  value,
  dateFormatted,
  timeValue,
  error,
  helper,
  emptyLabel,
  fieldRef,
  hasValue,
  testID,
  onPress,
  onDatePress,
  onTimePress,
  quickPresets,
  messages,
}: {
  label: string;
  value: string;
  dateFormatted?: string;
  timeValue?: string;
  error?: string;
  helper: string;
  emptyLabel: string;
  fieldRef: Ref<ComponentRef<typeof RNPressable>>;
  hasValue: boolean;
  testID?: string;
  onPress: () => void;
  onDatePress?: () => void;
  onTimePress?: () => void;
  quickPresets?: { label: string; onPress: () => void }[];
  messages?: (typeof createQuestMessages)["en"];
}) {
  const hasDate = Boolean(dateFormatted && dateFormatted !== emptyLabel);
  const hasTime = Boolean(timeValue && TIME_PATTERN.test(timeValue));

  return (
    <View className={styles.scheduleCard}>
      <View className={styles.scheduleCardHeader}>
        <View className={styles.scheduleCardTitle}>
          <CalendarClock color={colors.primary} size={18} strokeWidth={2.2} />
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
              <Text className={styles.scheduleSplitBtnLabel}>
                {messages?.startDate ?? "Date"}
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
            <Calendar
              color={hasDate ? colors.primary : colors.textMuted}
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
              <Text className={styles.scheduleSplitBtnLabel}>
                {messages?.startTime ?? "Time"}
              </Text>
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
              color={hasTime ? colors.primary : colors.textMuted}
              size={18}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </Pressable>

      {quickPresets && quickPresets.length > 0 ? (
        <View className={styles.scheduleQuickChips}>
          {quickPresets.map((preset) => (
            <Chip
              accessibilityLabel={preset.label}
              className="px-ku-10 py-ku-xs"
              key={preset.label}
              label={preset.label}
              onPress={preset.onPress}
              testID={`quick-preset-${preset.label}`}
              textClassName="text-ku-primary font-ku-semibold text-ku-meta"
              tone="accent"
            />
          ))}
        </View>
      ) : null}

      <Text
        accessibilityLiveRegion={error ? "assertive" : "none"}
        className={error ? styles.errorText : styles.helperText}
      >
        {error ?? helper}
      </Text>
    </View>
  );
}
