import { useState, type ComponentRef, type Ref } from "react";
import {
  Check,
  CircleAlert,
  Clock3,
  ImagePlus,
  MapPin,
  X,
} from "lucide-react-native";
import type {
  Pressable as RNPressable,
  TextInput as RNTextInput,
} from "react-native";

import { Image, Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { createQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { colors } from "@/theme/colors";
import { formatDate, formatDateTime } from "@/domain/datetime";
import {
  addHoursToTime,
  formatQuestSchedule,
  getDateTimeValue,
  getRelativeDateValue,
  TIME_PATTERN,
  type QuestDraft,
} from "../../domain/createQuestModel";
import type { ScheduleField } from "../../createQuestTypes";
import { useCreateQuestImages } from "./useCreateQuestImages";
import { CustomDatePickerModal } from "./CustomDatePickerModal";
import CustomTimePickerModal from "./CustomTimePickerModal";
import { DateTimeField } from "./DateTimeField";
import { FieldLabel } from "./FieldLabel";
import { LogisticsSection } from "./LogisticsSection";
import styles from "../createQuestStyles";

export function QuestLogisticsFields({
  messages,
  draft,
  errors,
  locale,
  logisticsExpanded,
  logisticsSummary,
  onToggleLogistics,
  startDateRef,
  deadlineRef,
  locationRef,
  updateDraft,
}: {
  messages: (typeof createQuestMessages)["en"];
  draft: QuestDraft;
  errors: Record<string, string>;
  locale: SupportedLocale;
  logisticsExpanded: boolean;
  logisticsSummary: string;
  onToggleLogistics: () => void;
  startDateRef: Ref<ComponentRef<typeof RNPressable>>;
  deadlineRef: Ref<ComponentRef<typeof RNPressable>>;
  locationRef: Ref<ComponentRef<typeof RNTextInput>>;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
}) {
  const { imageError, setImageError, pickImages, removeImage } =
    useCreateQuestImages({ draft, messages, updateDraft });
  const [datePickerField, setDatePickerField] = useState<ScheduleField | null>(
    null
  );
  const [timePickerField, setTimePickerField] = useState<ScheduleField | null>(
    null
  );
  // Refreshed whenever a schedule value is confirmed, so render stays pure.
  const [now, setNow] = useState(() => Date.now());
  const today = getRelativeDateValue(0);
  const confirmScheduleDate = (field: ScheduleField, date: string) => {
    updateDraft(field === "start" ? "startDate" : "deadline", date);
    setNow(Date.now());
    setDatePickerField(null);
    // Continue straight to the time when this endpoint has none yet.
    if (!(field === "start" ? draft.startTime : draft.endTime))
      setTimePickerField(field);
  };
  const startMs = getDateTimeValue(draft.startDate, draft.startTime);
  const startInPast = startMs !== null && startMs <= now;
  const handleFixDeadlineQuick = () => {
    if (!draft.startDate) {
      updateDraft("startDate", getRelativeDateValue(0));
    }
    const baseDate = draft.startDate || getRelativeDateValue(0);
    updateDraft("deadline", baseDate);

    const baseTime =
      draft.startTime && TIME_PATTERN.test(draft.startTime)
        ? draft.startTime
        : "09:00";
    if (!draft.startTime) {
      updateDraft("startTime", baseTime);
    }
    updateDraft("endTime", addHoursToTime(baseTime, 2));
  };
  const scheduleDisplay = formatQuestSchedule(
    draft,
    locale,
    messages.notSelected
  );

  return (
    <>
      <LogisticsSection
        messages={messages}
        expanded={logisticsExpanded}
        summary={logisticsSummary}
        onPress={onToggleLogistics}
      >
        <DateTimeField
          emptyLabel={messages.notSelected}
          label={messages.startDateTime}
          value={formatDateTime(
            draft.startDate,
            draft.startTime,
            locale,
            messages.notSelected
          )}
          dateFormatted={formatDate(
            draft.startDate,
            locale,
            messages.notSelected
          )}
          dateLabel={messages.startDate}
          timeValue={draft.startTime}
          timeLabel={messages.startTime}
          hasValue={Boolean(
            draft.startDate && TIME_PATTERN.test(draft.startTime)
          )}
          error={
            errors.startDate ??
            errors.startTime ??
            (startInPast ? messages.startTimePastError : undefined)
          }
          helper={messages.dateTimeHelper}
          fieldRef={startDateRef}
          testID="create-quest-start-datetime"
          onPress={() => setDatePickerField("start")}
          onDatePress={() => setDatePickerField("start")}
          onTimePress={() => setTimePickerField("start")}
          messages={messages}
        />
        {draft.startDate && draft.deadline && draft.startTime && draft.endTime
          ? (() => {
              const startMs = getDateTimeValue(
                draft.startDate,
                draft.startTime
              );
              const endMs = getDateTimeValue(draft.deadline, draft.endTime);
              const isOrderError =
                startMs !== null && endMs !== null && endMs <= startMs;
              if (isOrderError) {
                return (
                  <View
                    className={cn(
                      styles.durationBadge,
                      styles.durationBadgeError
                    )}
                  >
                    <View className="flex-1 flex-row items-center gap-ku-6">
                      <CircleAlert
                        color={colors.danger}
                        size={16}
                        strokeWidth={2.2}
                      />
                      <Text className={styles.durationBadgeErrorText}>
                        {messages.timeOrderError}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={messages.fixDeadlineQuick}
                      onPress={handleFixDeadlineQuick}
                      className={styles.fixDeadlineButton}
                      testID="create-quest-fix-deadline-btn"
                    >
                      <Text className={styles.fixDeadlineButtonText}>
                        {messages.fixDeadlineQuick}
                      </Text>
                    </Pressable>
                  </View>
                );
              }
              if (startMs !== null && endMs !== null) {
                const durationStr = scheduleDisplay.duration;
                if (durationStr) {
                  return (
                    <View className={styles.durationBadge}>
                      <View className="flex-row items-center gap-ku-6">
                        <Clock3
                          color={colors.hirer}
                          size={16}
                          strokeWidth={2.2}
                        />
                        <Text className={styles.durationBadgeText}>
                          {messages.questDuration}: {durationStr}
                          {scheduleDisplay.crossesMidnight
                            ? ` · ${messages.nextDay}`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  );
                }
              }
              return null;
            })()
          : null}
        <DateTimeField
          emptyLabel={messages.notSelected}
          label={messages.deadlineDateTime}
          value={formatDateTime(
            draft.deadline,
            draft.endTime,
            locale,
            messages.notSelected
          )}
          dateFormatted={formatDate(
            draft.deadline,
            locale,
            messages.notSelected
          )}
          dateLabel={messages.endDate}
          timeValue={draft.endTime}
          timeLabel={messages.endTime}
          hasValue={Boolean(draft.deadline && TIME_PATTERN.test(draft.endTime))}
          error={errors.deadline ?? errors.endTime}
          helper={messages.dateTimeHelper}
          fieldRef={deadlineRef}
          testID="create-quest-deadline-datetime"
          onPress={() => setDatePickerField("end")}
          onDatePress={() => setDatePickerField("end")}
          onTimePress={() => setTimePickerField("end")}
          messages={messages}
        />
        <View className={styles.fieldGroup}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: draft.locationMode === "ONLINE",
            }}
            accessibilityLabel={messages.onlineQuest}
            onPress={() =>
              updateDraft(
                "locationMode",
                draft.locationMode === "ONLINE" ? "ON_CAMPUS" : "ONLINE"
              )
            }
            className={styles.onlineToggle}
          >
            <View
              className={cn(
                styles.checkbox,
                draft.locationMode === "ONLINE" && styles.checkboxChecked
              )}
            >
              {draft.locationMode === "ONLINE" ? (
                <Check color={colors.onHirer} size={15} strokeWidth={3} />
              ) : null}
            </View>
            <View className={styles.onlineToggleCopy}>
              <Text className={styles.onlineToggleTitle}>
                {messages.onlineQuest}
              </Text>
              <Text className={styles.onlineToggleHint}>
                {messages.onlineQuestHint}
              </Text>
            </View>
          </Pressable>
          {draft.locationMode === "ON_CAMPUS" ? (
            <>
              <FieldLabel required optionalLabel="">
                {messages.location}
              </FieldLabel>
              <View
                className={cn(
                  styles.inputWithIcon,
                  errors.location && styles.fieldError
                )}
              >
                <MapPin color={colors.textMuted} size={18} strokeWidth={2} />
                <TextInput
                  ref={locationRef}
                  className={styles.iconInput}
                  placeholder={messages.locationPlaceholder}
                  placeholderTextColor={colors.textFaint}
                  value={draft.location}
                  onChangeText={(value) => updateDraft("location", value)}
                  accessibilityLabel={messages.location}
                  testID="create-quest-location"
                />
              </View>
              {errors.location ? (
                <Text className={styles.errorText}>{errors.location}</Text>
              ) : null}
            </>
          ) : null}
        </View>
        <View className={styles.fieldGroup}>
          <FieldLabel optionalLabel={messages.optional}>
            {messages.images}
          </FieldLabel>
          {draft.imageUris.length > 0 ? (
            <View className={styles.imagePicker} accessible={false}>
              <View className={styles.imageGrid}>
                {draft.imageUris.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    className={styles.imagePreviewContainer}
                  >
                    <Image
                      accessibilityLabel={messages.questImage(index + 1)}
                      cachePolicy="memory-disk"
                      onError={() => setImageError(messages.imageError)}
                      source={{ uri }}
                      className={styles.previewImage}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={messages.removeImage(index + 1)}
                      hitSlop={8}
                      onPress={() => removeImage(index)}
                      className={styles.removeImageButton}
                    >
                      <X color={colors.onHirer} size={15} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.changeImages}
                onPress={() => void pickImages()}
                className={styles.changeImagesButton}
              >
                <Text className={styles.imageTitle}>
                  {messages.changeImages}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.addImages}
              onPress={() => void pickImages()}
              className={styles.imagePicker}
            >
              <ImagePlus color={colors.hirer} size={28} strokeWidth={1.8} />
              <Text className={styles.imageTitle}>{messages.addImages}</Text>
              <Text className={styles.helperText}>
                {messages.imagesOptional}
              </Text>
            </Pressable>
          )}
          {imageError ? (
            <Text accessibilityRole="alert" className={styles.errorText}>
              {imageError}
            </Text>
          ) : null}
        </View>
      </LogisticsSection>
      {datePickerField ? (
        <CustomDatePickerModal
          title={
            datePickerField === "start" ? messages.startDate : messages.endDate
          }
          value={datePickerField === "start" ? draft.startDate : draft.deadline}
          minimumDate={
            datePickerField === "end" && draft.startDate > today
              ? draft.startDate
              : today
          }
          locale={locale}
          messages={messages}
          onConfirm={(date) => confirmScheduleDate(datePickerField, date)}
          onClose={() => setDatePickerField(null)}
        />
      ) : null}
      <CustomTimePickerModal
        visible={Boolean(timePickerField)}
        field={timePickerField ?? "start"}
        title={
          timePickerField === "start"
            ? messages.selectStartTime
            : messages.selectEndTime
        }
        initialTime={
          timePickerField === "start" ? draft.startTime : draft.endTime
        }
        targetDate={
          timePickerField === "start"
            ? formatDate(draft.startDate, locale, "")
            : formatDate(draft.deadline, locale, "")
        }
        startTime={draft.startTime}
        messages={messages}
        onConfirm={(nextTime) => {
          if (!timePickerField) return;
          const timeKey = timePickerField === "start" ? "startTime" : "endTime";
          updateDraft(timeKey, nextTime);
          setNow(Date.now());
          setTimePickerField(null);
        }}
        onClose={() => setTimePickerField(null)}
      />
    </>
  );
}
