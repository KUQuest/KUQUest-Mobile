import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import {
  formatCalendarMonthYear,
  formatCalendarWeekday,
  formatDate,
} from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";

const styles = {
  actions: "flex-row items-center gap-ku-10 mt-ku-sm",
  cancelButton:
    "flex-1 items-center justify-center border border-ku-border rounded-[12px] min-h-[48px] px-ku-12",
  cancelText: "text-ku-text-secondary font-ku-semibold text-ku-control",
  confirmButton:
    "flex-1 items-center justify-center bg-ku-hirer rounded-[12px] min-h-[48px] px-ku-md",
  confirmText: "text-ku-on-hirer font-ku-bold text-ku-control",
  confirmDisabled: "opacity-50",
  monthRow: "items-center flex-row justify-between mb-ku-sm",
  monthTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  navButton:
    "items-center bg-ku-surface-subtle rounded-ku-pill h-[48px] justify-center w-[48px]",
  navButtonDisabled: "opacity-40",
  weekRow: "flex-row",
  weekday:
    "flex-1 text-ku-text-muted font-ku-semibold text-ku-meta text-center py-ku-xs",
  cell: "flex-1 items-center py-ku-1",
  day: "items-center justify-center rounded-ku-pill h-[48px] w-[48px]",
  dayToday: "border border-ku-hirer",
  daySelected: "bg-ku-hirer",
  dayDisabled: "opacity-35",
  dayText: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  dayTextToday: "text-ku-hirer font-ku-bold",
  dayTextSelected: "text-ku-on-hirer font-ku-bold",
} as const;

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
  minimumDate = "1900-01-01",
  maximumDate = "9999-12-31",
  locale,
  messages,
  onConfirm,
  onClose,
}: {
  title: string;
  value: string;
  minimumDate?: string;
  maximumDate?: string;
  locale: SupportedLocale;
  messages: {
    cancel: string;
    confirmDate: string;
    nextMonth: string;
    previousMonth: string;
    today: string;
  };
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const [today] = useState(() => toDateValue(new Date()));
  const validValue = value >= minimumDate && value <= maximumDate ? value : "";
  const [selected, setSelected] = useState(validValue);
  const initialView =
    validValue ||
    (today < minimumDate
      ? minimumDate
      : today > maximumDate
        ? maximumDate
        : today);
  const [view, setView] = useState(() => toMonthView(initialView));
  const minimumView = toMonthView(minimumDate);
  const maximumView = toMonthView(maximumDate);
  const canGoBack =
    view.year > minimumView.year ||
    (view.year === minimumView.year && view.month > minimumView.month);
  const canGoForward =
    view.year < maximumView.year ||
    (view.year === maximumView.year && view.month < maximumView.month);
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
    <BottomSheet
      visible
      title={title}
      subtitle={selectedLabel}
      closeLabel={messages.cancel}
      onClose={onClose}
      testID="custom-date-picker"
    >
      <ScrollView className="shrink grow-0">
        <View className={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.previousMonth}
            accessibilityState={{ disabled: !canGoBack }}
            disabled={!canGoBack}
            onPress={() => shiftMonth(-1)}
            className={cn(
              styles.navButton,
              !canGoBack && styles.navButtonDisabled
            )}
            testID="custom-date-picker-previous-month"
          >
            <ChevronLeft
              color={colors.textStrong}
              size={20}
              strokeWidth={2.4}
            />
          </Pressable>
          <Text accessibilityRole="header" className={styles.monthTitle}>
            {monthTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.nextMonth}
            accessibilityState={{ disabled: !canGoForward }}
            disabled={!canGoForward}
            className={cn(
              styles.navButton,
              !canGoForward && styles.navButtonDisabled
            )}
            testID="custom-date-picker-next-month"
          >
            <ChevronRight
              color={colors.textStrong}
              size={20}
              strokeWidth={2.4}
            />
          </Pressable>
        </View>

        <View className={styles.weekRow} accessible={false}>
          {weekdays.map((weekday, index) => (
            <Text
              key={index}
              importantForAccessibility="no"
              className={styles.weekday}
            >
              {weekday}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className={styles.weekRow}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <View key={dayIndex} className={styles.cell} />;
              }
              const isDisabled = date < minimumDate || date > maximumDate;
              const isSelected = date === selected;
              const isToday = date === today;
              const dateLabel = formatDate(date, locale, date);
              return (
                <View key={date} className={styles.cell}>
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
                      styles.day,
                      isToday && styles.dayToday,
                      isSelected && styles.daySelected,
                      isDisabled && styles.dayDisabled
                    )}
                    testID={`custom-date-picker-day-${date}`}
                  >
                    <Text
                      className={cn(
                        styles.dayText,
                        isToday && styles.dayTextToday,
                        isSelected && styles.dayTextSelected
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
      </ScrollView>

      <View className={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={messages.cancel}
          onPress={onClose}
          className={styles.cancelButton}
          testID="custom-date-picker-cancel"
        >
          <Text className={styles.cancelText}>{messages.cancel}</Text>
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
            styles.confirmButton,
            !selected && styles.confirmDisabled
          )}
          testID="custom-date-picker-confirm"
        >
          <View className="flex-row items-center gap-ku-6">
            <Check color={colors.onHirer} size={18} strokeWidth={2.5} />
            <Text className={styles.confirmText}>{messages.confirmDate}</Text>
          </View>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
