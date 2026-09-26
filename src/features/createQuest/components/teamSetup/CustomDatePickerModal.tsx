import { useMemo, useState } from "react";
import { Modal } from "react-native";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import {
  formatCalendarMonthYear,
  formatCalendarWeekday,
  formatDate,
} from "@/domain/datetime";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import styles from "../createQuestStyles";
import { toDateValue } from "../../domain/createQuestModel";

// Calendar dates stay plain YYYY-MM-DD strings (device-local), so string
// comparison orders them and no native picker can hand back an epoch date.
function getMonthWeeks(year: number, month: number): (string | null)[][] {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from(
    { length: leadingBlanks },
    () => null
  );
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateValue(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

function toMonthView(date: string): { year: number; month: number } {
  const [year, month] = date.split("-").map(Number);
  return { year, month: month - 1 };
}

export function CustomDatePickerModal({
  title,
  value,
  minimumDate,
  locale,
  messages,
  onConfirm,
  onClose,
}: {
  title: string;
  /** Current draft date (YYYY-MM-DD) or empty. */
  value: string;
  /** Earliest selectable date (YYYY-MM-DD). */
  minimumDate: string;
  locale: SupportedLocale;
  messages: Pick<
    CreateQuestMessages,
    "cancel" | "confirmDate" | "nextMonth" | "previousMonth" | "today"
  >;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const [today] = useState(() => toDateValue(new Date()));
  const [selected, setSelected] = useState(() =>
    value && value >= minimumDate ? value : ""
  );
  const [view, setView] = useState(() => toMonthView(selected || minimumDate));
  const minimumView = toMonthView(minimumDate);
  const canGoBack =
    view.year > minimumView.year ||
    (view.year === minimumView.year && view.month > minimumView.month);

  const { monthTitle, weekdays } = useMemo(() => {
    const monthTitle = formatCalendarMonthYear(
      new Date(view.year, view.month, 1),
      locale,
      "long"
    );
    // 7 Jan 2024 is a Sunday; the grid starts on Sunday like getDay().
    const weekdays = Array.from({ length: 7 }, (_, index) =>
      formatCalendarWeekday(new Date(2024, 0, 7 + index), locale)
    );
    return { monthTitle, weekdays };
  }, [locale, view]);
  const weeks = useMemo(() => getMonthWeeks(view.year, view.month), [view]);
  const selectedLabel = selected ? formatDate(selected, locale, "") : "";

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <View className={styles.timePickerBackdrop}>
        <View accessibilityViewIsModal className={styles.timePickerSheet}>
          <View className={styles.timePickerHeader}>
            <View className="flex-1">
              <Text className={styles.timePickerTitle}>{title}</Text>
              {selectedLabel ? (
                <Text className={styles.timePickerSubtitle}>
                  {selectedLabel}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.cancel}
              onPress={onClose}
              className={styles.timePickerCloseButton}
              testID="custom-date-picker-close"
              hitSlop={8}
            >
              <X color={colors.textSecondary} size={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View className={styles.datePickerMonthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.previousMonth}
              accessibilityState={{ disabled: !canGoBack }}
              disabled={!canGoBack}
              onPress={() => shiftMonth(-1)}
              className={cn(
                styles.datePickerNavButton,
                !canGoBack && styles.datePickerNavButtonDisabled
              )}
              testID="custom-date-picker-previous-month"
            >
              <ChevronLeft
                color={colors.textStrong}
                size={20}
                strokeWidth={2.4}
              />
            </Pressable>
            <Text
              accessibilityRole="header"
              className={styles.datePickerMonthTitle}
            >
              {monthTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.nextMonth}
              onPress={() => shiftMonth(1)}
              className={styles.datePickerNavButton}
              testID="custom-date-picker-next-month"
            >
              <ChevronRight
                color={colors.textStrong}
                size={20}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>

          <View className={styles.datePickerWeekRow} accessible={false}>
            {weekdays.map((weekday, index) => (
              <Text
                key={index}
                importantForAccessibility="no"
                className={styles.datePickerWeekday}
              >
                {weekday}
              </Text>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className={styles.datePickerWeekRow}>
              {week.map((date, dayIndex) => {
                if (!date) {
                  return (
                    <View key={dayIndex} className={styles.datePickerCell} />
                  );
                }
                const isDisabled = date < minimumDate;
                const isSelected = date === selected;
                const isToday = date === today;
                const dateLabel = formatDate(date, locale, date);
                return (
                  <View key={date} className={styles.datePickerCell}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        isToday ? `${dateLabel}, ${messages.today}` : dateLabel
                      }
                      accessibilityState={{
                        disabled: isDisabled,
                        selected: isSelected,
                      }}
                      disabled={isDisabled}
                      onPress={() => setSelected(date)}
                      className={cn(
                        styles.datePickerDay,
                        isToday && styles.datePickerDayToday,
                        isSelected && styles.datePickerDaySelected,
                        isDisabled && styles.datePickerDayDisabled
                      )}
                      testID={`custom-date-picker-day-${date}`}
                    >
                      <Text
                        className={cn(
                          styles.datePickerDayText,
                          isToday && styles.datePickerDayTextToday,
                          isSelected && styles.datePickerDayTextSelected
                        )}
                      >
                        {Number(date.slice(8))}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          <View className={styles.timePickerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.cancel}
              onPress={onClose}
              className={styles.timePickerCancelBtn}
              testID="custom-date-picker-cancel"
            >
              <Text className={styles.timePickerCancelText}>
                {messages.cancel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                selectedLabel
                  ? `${messages.confirmDate}: ${selectedLabel}`
                  : messages.confirmDate
              }
              accessibilityState={{ disabled: !selected }}
              disabled={!selected}
              onPress={() => onConfirm(selected)}
              className={cn(
                styles.timePickerConfirmBtn,
                !selected && styles.timePickerConfirmBtnDisabled
              )}
              testID="custom-date-picker-confirm"
            >
              <View className="flex-row items-center gap-ku-6">
                <Check color={colors.onHirer} size={18} strokeWidth={2.5} />
                <Text className={styles.timePickerConfirmText}>
                  {messages.confirmDate}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
