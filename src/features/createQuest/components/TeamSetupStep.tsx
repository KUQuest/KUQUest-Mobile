import { useState, type ComponentRef, type Ref } from "react";
import {
  Check,
  CircleAlert,
  Clock3,
  ImagePlus,
  MapPin,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react-native";
import type {
  Pressable as RNPressable,
  TextInput as RNTextInput,
} from "react-native";

import { Image, Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { Input } from "@/features/onboarding/components/Input";
import { createQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import { formatDate, formatDateTime } from "@/domain/datetime";
import {
  addDaysToDate,
  addHoursToTime,
  formatQuestDuration,
  getDateTimeValue,
  getNearestQuarterHour,
  getRelativeDateValue,
  TIME_PATTERN,
  type QuestDraft,
} from "../createQuestModel";
import type { ChoiceOption, ScheduleField } from "../createQuestTypes";
import { ChoiceGroup } from "./ChoiceGroup";
import CustomTimePickerModal from "./CustomTimePickerModal";
import { DateTimeField } from "./DateTimeField";
import { FieldLabel } from "./FieldLabel";
import { LogisticsSection } from "./LogisticsSection";
import { ModeSummary } from "./ModeSummary";
import { SectionHeading } from "./SectionHeading";
export function TeamSetupStep({
  messages,
  draft,
  errors,
  locale,
  participationOptions,
  candidateOptions,
  combinationHint,
  useStackedChoices,
  logisticsExpanded,
  logisticsSummary,
  onToggleLogistics,
  imageError,
  setImageError,
  headcountRef,
  rewardRef,
  startDateRef,
  deadlineRef,
  locationRef,
  openSchedulePicker,
  pickImages,
  removeImage,
  updateDraft,
  updateParticipation,
}: {
  messages: (typeof createQuestMessages)["en"];
  draft: QuestDraft;
  errors: Record<string, string>;
  locale: SupportedLocale;
  participationOptions: ChoiceOption[];
  candidateOptions: ChoiceOption[];
  combinationHint: string;
  useStackedChoices: boolean;
  logisticsExpanded: boolean;
  logisticsSummary: string;
  onToggleLogistics: () => void;
  imageError?: string;
  setImageError: (error?: string) => void;
  headcountRef: Ref<ComponentRef<typeof RNTextInput>>;
  rewardRef: Ref<ComponentRef<typeof RNTextInput>>;
  startDateRef: Ref<ComponentRef<typeof RNPressable>>;
  deadlineRef: Ref<ComponentRef<typeof RNPressable>>;
  locationRef: Ref<ComponentRef<typeof RNTextInput>>;
  openSchedulePicker: (field: ScheduleField) => void;
  pickImages: () => void;
  removeImage: (index: number) => void;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
  updateParticipation: (value: QuestDraft["participation"]) => void;
}) {
  const [timePickerField, setTimePickerField] = useState<ScheduleField | null>(
    null
  );
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
  return (
    <>
      <View className={styles.sectionCard}>
        <SectionHeading
          compact
          icon={UsersRound}
          title={`1. ${messages.chooseWorkFormat}`}
          description={messages.chooseWorkFormatDescription}
        />
        <ChoiceGroup
          label={messages.participation}
          value={draft.participation}
          options={participationOptions}
          variant="format"
          stacked={useStackedChoices}
          onChange={(value) =>
            updateParticipation(value as QuestDraft["participation"])
          }
        />

        <View className={styles.subsectionBlock}>
          <SectionHeading
            compact
            icon={UserRoundCheck}
            title={`2. ${messages.chooseAcceptanceMethod}`}
            description={messages.chooseAcceptanceMethodDescription}
          />
          <ChoiceGroup
            label={messages.candidateMode}
            value={draft.candidateMode}
            options={candidateOptions}
            variant="acceptance"
            stacked={false}
            onChange={(value) =>
              updateDraft("candidateMode", value as QuestDraft["candidateMode"])
            }
          />
        </View>

        <ModeSummary
          messages={messages}
          participation={draft.participation}
          candidateMode={draft.candidateMode}
          combinationHint={combinationHint}
        />

        <View className={styles.additionalSettings}>
          <Text
            accessibilityRole="header"
            className={styles.additionalSettingsTitle}
          >
            {messages.capacityAndReward}
          </Text>
          <Text className={styles.sectionDescription}>
            {messages.participantsRewardDescription}
          </Text>
          {draft.participation === "SINGLE" ? (
            <View className={styles.fieldGroup}>
              <FieldLabel optionalLabel="">{messages.headcount}</FieldLabel>
              <View
                accessible
                accessibilityLabel={`${messages.headcount}: 1`}
                accessibilityState={{ disabled: true }}
                className={styles.readOnlyField}
                style={{
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Text className={styles.readOnlyValue}>1</Text>
              </View>
              <Text className={styles.singleHeadcountHint}>
                {messages.singleHeadcountHint}
              </Text>
            </View>
          ) : (
            <Input
              ref={headcountRef}
              label={`${messages.headcount} *`}
              placeholder={messages.headcountPlaceholder}
              value={draft.headcount}
              onChangeText={(value) =>
                updateDraft("headcount", value.replace(/[^0-9]/g, ""))
              }
              error={errors.headcount}
              keyboardType="number-pad"
            />
          )}
          <View className={styles.fieldGroup}>
            <FieldLabel required optionalLabel={messages.optional}>
              {messages.rewardPerPerson}
            </FieldLabel>
            <View
              className={cn(
                styles.currencyInput,
                errors.wage ? styles.fieldError : null
              )}
            >
              <Text className={styles.currencySymbol}>฿</Text>
              <TextInput
                ref={rewardRef}
                className={styles.currencyTextInput}
                placeholder={messages.rewardPlaceholder}
                placeholderTextColor={colors.textFaint}
                value={draft.wage}
                onChangeText={(value) =>
                  updateDraft("wage", value.replace(/[^0-9.]/g, ""))
                }
                keyboardType="decimal-pad"
                accessibilityLabel={`${messages.rewardPerPerson} (THB)`}
              />
              <Text className={styles.currencyUnit}>THB</Text>
            </View>
            <Text
              accessibilityLiveRegion={errors.wage ? "assertive" : "none"}
              className={errors.wage ? styles.errorText : styles.helperText}
            >
              {errors.wage ?? messages.rewardHelper}
            </Text>
          </View>
        </View>
      </View>

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
          timeValue={draft.startTime}
          hasValue={Boolean(
            draft.startDate && TIME_PATTERN.test(draft.startTime)
          )}
          error={errors.startDate ?? errors.startTime}
          helper={messages.dateTimeHelper}
          fieldRef={startDateRef}
          testID="create-quest-start-datetime"
          onPress={() => openSchedulePicker("start")}
          onDatePress={() => openSchedulePicker("start")}
          onTimePress={() => setTimePickerField("start")}
          messages={messages}
          quickPresets={[
            {
              label: messages.today,
              onPress: () => updateDraft("startDate", getRelativeDateValue(0)),
            },
            {
              label: messages.tomorrow,
              onPress: () => updateDraft("startDate", getRelativeDateValue(1)),
            },
            {
              label: messages.now,
              onPress: () => {
                updateDraft("startDate", getRelativeDateValue(0));
                const { hours, minutes } = getNearestQuarterHour();
                updateDraft("startTime", `${hours}:${minutes}`);
              },
            },
            {
              label: messages.in1h,
              onPress: () => {
                updateDraft("startDate", getRelativeDateValue(0));
                const { hours, minutes } = getNearestQuarterHour();
                updateDraft(
                  "startTime",
                  addHoursToTime(`${hours}:${minutes}`, 1)
                );
              },
            },
          ]}
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
                    <View className="flex-1 flex-row items-center gap-[6px]">
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
                const durationStr = formatQuestDuration(startMs, endMs, locale);
                if (durationStr) {
                  return (
                    <View className={styles.durationBadge}>
                      <View className="flex-row items-center gap-[6px]">
                        <Clock3
                          color={colors.primary}
                          size={16}
                          strokeWidth={2.2}
                        />
                        <Text className={styles.durationBadgeText}>
                          {messages.questDuration}: {durationStr}
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
          timeValue={draft.endTime}
          hasValue={Boolean(draft.deadline && TIME_PATTERN.test(draft.endTime))}
          error={errors.deadline ?? errors.endTime}
          helper={messages.dateTimeHelper}
          fieldRef={deadlineRef}
          testID="create-quest-deadline-datetime"
          onPress={() => openSchedulePicker("end")}
          onDatePress={() => openSchedulePicker("end")}
          onTimePress={() => setTimePickerField("end")}
          messages={messages}
          quickPresets={[
            {
              label: messages.sameDay,
              onPress: () =>
                updateDraft(
                  "deadline",
                  draft.startDate || getRelativeDateValue(0)
                ),
            },
            {
              label: messages.plus1Day,
              onPress: () =>
                updateDraft(
                  "deadline",
                  draft.startDate
                    ? addDaysToDate(draft.startDate, 1)
                    : getRelativeDateValue(1)
                ),
            },
            {
              label: messages.in2h,
              onPress: () => {
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
              },
            },
            {
              label: messages.endOfDay,
              onPress: () => {
                const baseDate = draft.startDate || getRelativeDateValue(0);
                updateDraft("deadline", baseDate);
                updateDraft("endTime", "23:59");
              },
            },
          ]}
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
                <Check color={colors.white} size={15} strokeWidth={3} />
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
                      <X color={colors.white} size={15} strokeWidth={2.5} />
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
              <ImagePlus color={colors.primary} size={28} strokeWidth={1.8} />
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
          setTimePickerField(null);
        }}
        onClose={() => setTimePickerField(null)}
      />
    </>
  );
}
