import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-native";
import { Check, X } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import styles from "../createQuestStyles";
import { getNearestQuarterHour } from "../createQuestModel";

export interface CustomTimePickerModalProps {
  visible: boolean;
  field: "start" | "end";
  title: string;
  initialTime?: string;
  targetDate?: string;
  startTime?: string;
  messages: {
    selectTime: string;
    selectStartTime: string;
    selectEndTime: string;
    hour: string;
    minute: string;
    confirmTime: string;
    cancel: string;
    quickPresets: string;
    now: string;
    in30m: string;
    in1h: string;
    in2h: string;
    endOfDay: string;
  };
  onConfirm: (time: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_5 = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function CustomTimePickerModal({
  visible,
  field,
  title,
  initialTime,
  targetDate,
  startTime,
  messages,
  onConfirm,
  onClose,
}: CustomTimePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"hour" | "minute">("hour");
  const [hour, setHour] = useState<number>(9);
  const [minute, setMinute] = useState<number>(0);
  /* eslint-disable react-hooks/set-state-in-effect -- resetting time picker on open */
  useEffect(() => {
    if (!visible) return;
    setActiveTab("hour");

    if (initialTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(initialTime)) {
      const [h, m] = initialTime.split(":").map(Number);
      setHour(h);
      setMinute(m);
      return;
    }

    if (
      field === "end" &&
      startTime &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
    ) {
      const [sh, sm] = startTime.split(":").map(Number);
      setHour((sh + 2) % 24);
      setMinute(sm);
      return;
    }

    const { hours, minutes } = getNearestQuarterHour();
    setHour(Number(hours));
    setMinute(Number(minutes));
  }, [visible, initialTime, field, startTime]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const formattedTime = useMemo(() => {
    const hStr = String(hour).padStart(2, "0");
    const mStr = String(minute).padStart(2, "0");
    return `${hStr}:${mStr}`;
  }, [hour, minute]);

  const quickPresets = useMemo(() => {
    const list: { label: string; time: string }[] = [];

    const { hours: nowH, minutes: nowM } = getNearestQuarterHour();
    const nowTime = `${nowH}:${nowM}`;
    list.push({ label: messages?.now ?? "Now", time: nowTime });

    if (
      field === "end" &&
      startTime &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
    ) {
      const [sh, sm] = startTime.split(":").map(Number);
      const smStr = String(sm).padStart(2, "0");
      const hPlus1 = String((sh + 1) % 24).padStart(2, "0");
      const hPlus2 = String((sh + 2) % 24).padStart(2, "0");
      const hPlus3 = String((sh + 3) % 24).padStart(2, "0");

      list.push({ label: messages?.in1h ?? "+1h", time: `${hPlus1}:${smStr}` });
      list.push({ label: messages?.in2h ?? "+2h", time: `${hPlus2}:${smStr}` });
      list.push({ label: "+3 ชม.", time: `${hPlus3}:${smStr}` });
      list.push({ label: messages?.endOfDay ?? "23:59", time: "23:59" });
    } else {
      const [curH, curM] = [Number(nowH), Number(nowM)];
      const hPlus1 = String((curH + 1) % 24).padStart(2, "0");
      const hPlus2 = String((curH + 2) % 24).padStart(2, "0");
      const curMStr = String(curM).padStart(2, "0");

      list.push({
        label: messages?.in1h ?? "+1h",
        time: `${hPlus1}:${curMStr}`,
      });
      list.push({
        label: messages?.in2h ?? "+2h",
        time: `${hPlus2}:${curMStr}`,
      });
      list.push({ label: "09:00", time: "09:00" });
      list.push({ label: "12:00", time: "12:00" });
      list.push({ label: "17:00", time: "17:00" });
      list.push({ label: "20:00", time: "20:00" });
      list.push({ label: messages?.endOfDay ?? "23:59", time: "23:59" });
    }

    return list;
  }, [field, startTime, messages]);

  const handleSelectHour = (h: number) => {
    setHour(h);
    setActiveTab("minute");
  };

  const handleSelectMinute = (m: number) => {
    setMinute(m);
  };

  const handleStepMinute = (delta: number) => {
    const totalMinutes = hour * 60 + minute + delta;
    const normalizedMinutes =
      ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    setHour(Math.floor(normalizedMinutes / 60));
    setMinute(normalizedMinutes % 60);
  };

  const handleApplyPreset = (presetTime: string) => {
    const [h, m] = presetTime.split(":").map(Number);
    setHour(h);
    setMinute(m);
  };

  const handleConfirm = () => {
    onConfirm(formattedTime);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={onClose}
      visible={visible}
    >
      <View className={styles.timePickerBackdrop}>
        <View accessibilityViewIsModal className={styles.timePickerSheet}>
          <View className={styles.timePickerHeader}>
            <View className="flex-1">
              <Text className={styles.timePickerTitle}>{title}</Text>
              {targetDate ? (
                <Text className={styles.timePickerSubtitle}>{targetDate}</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.cancel}
              onPress={onClose}
              className={styles.timePickerCloseButton}
              testID="custom-time-picker-close"
              hitSlop={8}
            >
              <X color={colors.textSecondary} size={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View className={styles.timeDisplayContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${messages.hour}: ${String(hour).padStart(2, "0")}`}
              onPress={() => setActiveTab("hour")}
              className={cn(
                styles.timeDisplayBox,
                activeTab === "hour" && styles.timeDisplayBoxActive
              )}
              testID="time-picker-tab-hour"
            >
              <Text
                className={cn(
                  styles.timeDisplayText,
                  activeTab === "hour" && styles.timeDisplayTextActive
                )}
              >
                {String(hour).padStart(2, "0")}
              </Text>
              <Text
                className={cn(
                  styles.timeDisplayLabel,
                  activeTab === "hour" && styles.timeDisplayLabelActive
                )}
              >
                {messages.hour}
              </Text>
            </Pressable>

            <Text className={styles.timeColon}>:</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${messages.minute}: ${String(minute).padStart(2, "0")}`}
              onPress={() => setActiveTab("minute")}
              className={cn(
                styles.timeDisplayBox,
                activeTab === "minute" && styles.timeDisplayBoxActive
              )}
              testID="time-picker-tab-minute"
            >
              <Text
                className={cn(
                  styles.timeDisplayText,
                  activeTab === "minute" && styles.timeDisplayTextActive
                )}
              >
                {String(minute).padStart(2, "0")}
              </Text>
              <Text
                className={cn(
                  styles.timeDisplayLabel,
                  activeTab === "minute" && styles.timeDisplayLabelActive
                )}
              >
                {messages.minute}
              </Text>
            </Pressable>
          </View>

          <View className="mb-[6px]">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className={styles.timePresetsScroll}
            >
              {quickPresets.map((preset) => {
                const isSelected = preset.time === formattedTime;
                return (
                  <Chip
                    accessibilityLabel={`${preset.label}: ${preset.time}`}
                    className="mr-[6px] px-[12px] py-[6px]"
                    key={preset.label}
                    label={`${preset.label} (${preset.time})`}
                    onPress={() => handleApplyPreset(preset.time)}
                    selected={isSelected}
                    testID={`time-preset-${preset.time}`}
                    textClassName={
                      isSelected
                        ? "font-ku-bold text-ku-on-primary"
                        : "font-ku-semibold text-ku-body-small text-ku-primary"
                    }
                    tone="accent"
                  />
                );
              })}
            </ScrollView>
          </View>

          {activeTab === "hour" ? (
            <View>
              <Text className={styles.timeSectionLabel}>
                {messages.hour} (00 - 23)
              </Text>
              <View className={styles.hourGrid}>
                {HOURS.map((h) => {
                  const isSelected = h === hour;
                  const label = String(h).padStart(2, "0");
                  return (
                    <Pressable
                      key={h}
                      accessibilityRole="button"
                      accessibilityLabel={`${messages.hour} ${label}`}
                      onPress={() => handleSelectHour(h)}
                      className={cn(
                        styles.hourCell,
                        isSelected && styles.hourCellSelected
                      )}
                      testID={`hour-cell-${label}`}
                    >
                      <Text
                        className={cn(
                          styles.hourCellText,
                          isSelected && styles.hourCellTextSelected
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              <Text className={styles.timeSectionLabel}>
                {messages.minute} (00 - 55)
              </Text>
              <View className={styles.minuteGrid}>
                {MINUTES_5.map((m) => {
                  const isSelected = m === minute;
                  const label = String(m).padStart(2, "0");
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityLabel={`${messages.minute} ${label}`}
                      onPress={() => handleSelectMinute(m)}
                      className={cn(
                        styles.minuteCell,
                        isSelected && styles.minuteCellSelected
                      )}
                      testID={`minute-cell-${label}`}
                    >
                      <Text
                        className={cn(
                          styles.minuteCellText,
                          isSelected && styles.minuteCellTextSelected
                        )}
                      >
                        :{label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className={styles.minuteStepperContainer}>
                <Text className={styles.minuteStepperLabel}>
                  {messages.minute}: {String(minute).padStart(2, "0")}
                </Text>
                <View className={styles.minuteStepperButtons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="-1 นาที"
                    onPress={() => handleStepMinute(-1)}
                    className={styles.stepperBtn}
                    testID="minute-step-minus"
                    hitSlop={6}
                  >
                    <Text className={styles.stepperBtnText}>-1</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="+1 นาที"
                    onPress={() => handleStepMinute(1)}
                    className={styles.stepperBtn}
                    testID="minute-step-plus"
                    hitSlop={6}
                  >
                    <Text className={styles.stepperBtnText}>+1</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="+5 นาที"
                    onPress={() => handleStepMinute(5)}
                    className={styles.stepperBtn}
                    testID="minute-step-plus5"
                    hitSlop={6}
                  >
                    <Text className={styles.stepperBtnText}>+5</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View className={styles.timePickerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.cancel}
              onPress={onClose}
              className={styles.timePickerCancelBtn}
              testID="custom-time-picker-cancel"
            >
              <Text className={styles.timePickerCancelText}>
                {messages.cancel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${messages.confirmTime}: ${formattedTime}`}
              onPress={handleConfirm}
              className={styles.timePickerConfirmBtn}
              testID="custom-time-picker-confirm"
            >
              <View className="flex-row items-center gap-[6px]">
                <Check color={colors.onPrimary} size={18} strokeWidth={2.5} />
                <Text className={styles.timePickerConfirmText}>
                  {messages.confirmTime} ({formattedTime})
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
