import type { ComponentRef, Ref } from "react";
import {
  Check,
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
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import { formatDateTime } from "../createQuestDates";
import { TIME_PATTERN, type QuestDraft } from "../createQuestModel";
import type { ChoiceOption } from "../createQuestTypes";
import { ChoiceGroup } from "./ChoiceGroup";
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
  messages: typeof createQuestMessages.en;
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
  setImageError: (error: string | undefined) => void;
  headcountRef: Ref<ComponentRef<typeof RNTextInput>>;
  rewardRef: Ref<ComponentRef<typeof RNTextInput>>;
  startDateRef: Ref<ComponentRef<typeof RNPressable>>;
  deadlineRef: Ref<ComponentRef<typeof RNPressable>>;
  locationRef: Ref<ComponentRef<typeof RNTextInput>>;
  openSchedulePicker: (field: "start" | "end") => void;
  pickImages: () => Promise<void>;
  removeImage: (index: number) => void;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
  updateParticipation: (value: QuestDraft["participation"]) => void;
}) {
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
          hasValue={Boolean(
            draft.startDate && TIME_PATTERN.test(draft.startTime)
          )}
          error={errors.startDate ?? errors.startTime}
          helper={messages.dateTimeHelper}
          fieldRef={startDateRef}
          testID="create-quest-start-datetime"
          onPress={() => openSchedulePicker("start")}
        />
        <DateTimeField
          emptyLabel={messages.notSelected}
          label={messages.deadlineDateTime}
          value={formatDateTime(
            draft.deadline,
            draft.endTime,
            locale,
            messages.notSelected
          )}
          hasValue={Boolean(draft.deadline && TIME_PATTERN.test(draft.endTime))}
          error={errors.deadline ?? errors.endTime}
          helper={messages.dateTimeHelper}
          fieldRef={deadlineRef}
          testID="create-quest-deadline-datetime"
          onPress={() => openSchedulePicker("end")}
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
    </>
  );
}
