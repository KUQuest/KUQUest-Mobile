import { type ComponentRef, type Ref } from "react";
import { Coins, UserRoundCheck, UsersRound } from "lucide-react-native";
import type {
  Pressable as RNPressable,
  TextInput as RNTextInput,
} from "react-native";

import { Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { Input } from "@/components/ui/Input";
import { createQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { QuestParticipation } from "@/features/questBoard/domain/types";
import styles from "../createQuestStyles";
import type { QuestDraft } from "../../domain/createQuestModel";
import type { ChoiceOption } from "../../createQuestTypes";
import { ChoiceGroup } from "./ChoiceGroup";
import { FieldLabel } from "./FieldLabel";
import { ModeSummary } from "./ModeSummary";
import { SectionHeading } from "../SectionHeading";
import { QuestLogisticsFields } from "./QuestLogisticsFields";

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
  headcountRef,
  rewardRef,
  startDateRef,
  deadlineRef,
  locationRef,
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
  headcountRef: Ref<ComponentRef<typeof RNTextInput>>;
  rewardRef: Ref<ComponentRef<typeof RNTextInput>>;
  startDateRef: Ref<ComponentRef<typeof RNPressable>>;
  deadlineRef: Ref<ComponentRef<typeof RNPressable>>;
  locationRef: Ref<ComponentRef<typeof RNTextInput>>;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
  updateParticipation: (value: QuestDraft["participation"]) => void;
}) {
  const { colors } = useAppTheme();

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
      </View>

      <View className={styles.sectionCard}>
        <SectionHeading
          compact
          icon={Coins}
          title={`3. ${messages.capacityAndReward}`}
          description={messages.participantsRewardDescription}
        />
        {draft.participation === QuestParticipation.SINGLE ? (
          <View className={styles.fieldGroup}>
            <FieldLabel optionalLabel="">{messages.headcount}</FieldLabel>
            <View
              accessible
              accessibilityLabel={`${messages.headcount}: 1`}
              accessibilityState={{ disabled: true }}
              className={styles.readOnlyField}
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
              placeholderTextColor={colors.textMuted}
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

      <QuestLogisticsFields
        messages={messages}
        draft={draft}
        errors={errors}
        locale={locale}
        logisticsExpanded={logisticsExpanded}
        logisticsSummary={logisticsSummary}
        onToggleLogistics={onToggleLogistics}
        startDateRef={startDateRef}
        deadlineRef={deadlineRef}
        locationRef={locationRef}
        updateDraft={updateDraft}
      />
    </>
  );
}
