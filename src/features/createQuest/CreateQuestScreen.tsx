import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Alert,
  findNodeHandle,
  Modal,
  Platform,
  Pressable as RNPressable,
  TextInput as RNTextInput,
  useWindowDimensions,
} from "react-native";
import { cn } from "@/tw/cn";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  ImagePlus,
  Mail,
  MapPin,
  Tag,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Button } from "@/components/ui/Button";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { Input } from "@/features/onboarding/components/Input";
import { Select } from "@/features/onboarding/components/Select";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/locales/LocaleProvider";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import { getCreateQuestLayoutMetrics } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import styles from "./createQuestStyles";
import {
  formatDraftReward,
  getHeadcountForParticipation,
  getRewardValidationError,
  getSchedulePickerValue,
  getScheduleTimeValue,
  initialDraft,
  isQuestDraftDirty,
  mockQuestDraft,
  toQuestDraftPayload,
  type QuestDraft,
} from "./createQuestModel";
import {
  deleteQuestDraft,
  getQuestDraftStorageKey,
  loadQuestDraft,
  persistQuestDraft,
} from "./createQuestPersistence";
import { questWorkflow } from "../questBoard/questWorkflow";
import {
  MAX_QUEST_IMAGES,
  formatSatang,
  type QuestPublishCheck,
} from "../questBoard/types";

type Step = 1 | 2 | 3;
type ScheduleField = "start" | "end";
type PickerMode = "date" | "time";
type SaveState = "idle" | "saving" | "saved" | "error";
type CompletionState = "DRAFT" | "OPEN";
type SaveErrorIntent = { state: CompletionState; completesFlow: boolean };
type Focusable =
  | React.ComponentRef<typeof RNTextInput>
  | React.ComponentRef<typeof RNPressable>;
type ChoiceVariant = "format" | "acceptance";
type ChoiceOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};
type ReviewActionButtonProps = {
  label: string;
  variant: "primary" | "secondary";
  accessibilityLabel: string;
  disabled: boolean;
  stacked: boolean;
  testID: string;
  onPress: () => void;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const QUEST_DETAIL_FIELDS = new Set([
  "title",
  "tag",
  "description",
  "conditions",
]);
const LOGISTICS_FIELDS = new Set([
  "startDate",
  "deadline",
  "startTime",
  "endTime",
  "location",
]);

function formatDate(
  value: string,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  dateValue: string,
  timeValue: string,
  locale: "en" | "th",
  emptyLabel: string
): string {
  if (!dateValue || !TIME_PATTERN.test(timeValue)) return emptyLabel;
  return `${formatDate(dateValue, locale, emptyLabel)} · ${timeValue}`;
}

function getDateTimeValue(dateValue: string, timeValue: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !TIME_PATTERN.test(timeValue))
    return null;
  const date = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getDatePickerValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date();
}

function getDateTimePickerValue(dateValue: string, timeValue: string): Date {
  const date = getDatePickerValue(dateValue);
  const match = TIME_PATTERN.exec(timeValue);
  if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

function FieldLabel({
  children,
  required = false,
  optionalLabel,
}: {
  children: string;
  required?: boolean;
  optionalLabel: string;
}) {
  return (
    <Text className={styles.fieldLabel}>
      {children}
      {required ? (
        <Text className={styles.required}> *</Text>
      ) : optionalLabel ? (
        <Text className={styles.optional}> · {optionalLabel}</Text>
      ) : null}
    </Text>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <View
      className={cn(styles.sectionHeading, compact && styles.subsectionHeading)}
    >
      <View className={styles.sectionIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2.2} />
      </View>
      <View className={styles.sectionHeadingText}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {title}
        </Text>
        <Text className={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function DateTimeField({
  label,
  value,
  error,
  helper,
  emptyLabel,
  fieldRef,
  hasValue,
  testID,
  onPress,
}: {
  label: string;
  value: string;
  error?: string;
  helper: string;
  emptyLabel: string;
  fieldRef: React.Ref<React.ComponentRef<typeof RNPressable>>;
  hasValue: boolean;
  testID?: string;
  onPress: () => void;
}) {
  return (
    <View className={styles.fieldGroup}>
      <FieldLabel required optionalLabel="">
        {label}
      </FieldLabel>
      <Pressable
        ref={fieldRef}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || emptyLabel}`}
        accessibilityState={{ disabled: false }}
        onPress={onPress}
        className={cn(styles.dateField, error ? styles.fieldError : null)}
        testID={testID}
        android_ripple={{ color: colors.surfaceAccent }}
      >
        <Text
          className={cn(styles.dateText, !hasValue && styles.placeholderText)}
        >
          {value || emptyLabel}
        </Text>
        <CalendarClock color={colors.textSecondary} size={19} strokeWidth={2} />
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

function CreateQuestHeader({
  messages,
  step,
  onBackPress,
  onHelpPress,
  onStepPress,
}: {
  messages: typeof createQuestMessages.en;
  step: Step;
  onBackPress: () => void;
  onHelpPress: () => void;
  onStepPress: (step: Step) => void;
}) {
  const stepLabels = [
    messages.missionInfo,
    messages.teamSetup,
    messages.review,
  ];

  return (
    <View className={styles.hero}>
      <View className={styles.heroTop}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={styles.heroButton}
          onPress={onBackPress}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
          testID="create-quest-header-back"
        >
          <ArrowLeft color={colors.white} size={28} strokeWidth={2.4} />
        </Pressable>
        <View className={styles.heroTitleGroup}>
          <Text accessibilityRole="header" className={styles.heroTitle}>
            {messages.title}
          </Text>
          <Text className={styles.heroSubtitle}>{messages.headerSubtitle}</Text>
        </View>
        <Pressable
          accessibilityLabel={messages.helpLabel}
          accessibilityRole="button"
          className={styles.heroButton}
          onPress={onHelpPress}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
          testID="create-quest-help"
        >
          <CircleHelp color={colors.white} size={30} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: step }}
        className={styles.progressTrack}
      >
        {[1, 2, 3].map((item, index) => (
          <React.Fragment key={item}>
            <Pressable
              accessibilityLabel={`${messages.step(item, 3)}: ${stepLabels[index]}`}
              accessibilityRole="button"
              accessibilityState={{
                disabled: item > step,
                selected: item === step,
              }}
              className={styles.progressNodePressable}
              disabled={item > step}
              onPress={() => onStepPress(item as Step)}
            >
              <View
                className={styles.progressNode}
                style={{
                  backgroundColor:
                    item <= step
                      ? colors.successBright
                      : "rgba(255,255,255,0.34)",
                }}
              >
                {item < step ? (
                  <Check color={colors.white} size={26} strokeWidth={2.8} />
                ) : (
                  <Text className={styles.progressNodeText}>{item}</Text>
                )}
              </View>
            </Pressable>
            {index < 2 ? (
              <View
                className={styles.progressConnector}
                style={{
                  backgroundColor:
                    item < step
                      ? colors.successBright
                      : "rgba(255,255,255,0.3)",
                }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      <View className={styles.stepLabels}>
        {stepLabels.map((label, index) => (
          <Text
            key={label}
            className={cn(
              styles.stepLabel,
              index + 1 === step && styles.stepLabelActive
            )}
            style={{
              color:
                index + 1 === step
                  ? colors.white
                  : index + 1 < step
                    ? "rgba(255,255,255,0.86)"
                    : "rgba(255,255,255,0.62)",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CreateQuestSkeleton({
  step,
  loadingLabel,
  horizontalPadding,
  contentMaxWidth,
  stackedActions,
}: {
  step: Step;
  loadingLabel: string;
  horizontalPadding: number;
  contentMaxWidth: number | "100%";
  stackedActions: boolean;
}) {
  const field = (key: string, height = 48) => (
    <View key={key} style={{ gap: 4 }}>
      <SkeletonBlock height={14} width="42%" borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );
  const body =
    step === 1 ? (
      <View className={styles.sectionCard} style={{ gap: spacing.md }}>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: spacing.sm,
          }}
        >
          <SkeletonBlock height={36} width={36} borderRadius={10} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <SkeletonBlock height={22} width="48%" borderRadius={5} />
            <SkeletonBlock height={15} width="72%" borderRadius={4} />
          </View>
        </View>
        {["title", "tag"].map((key) => field(key))}
        {field("description", 112)}
        {field("conditions", 112)}
        <SkeletonBlock height={48} borderRadius={12} />
      </View>
    ) : step === 2 ? (
      <>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="58%" borderRadius={5} />
              <SkeletonBlock height={15} width="82%" borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={104} borderRadius={14} style={{ flex: 1 }} />
            <SkeletonBlock height={104} borderRadius={14} style={{ flex: 1 }} />
          </View>
          <SkeletonBlock
            height={1}
            borderRadius={0}
            style={{ marginVertical: spacing.sm }}
          />
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="64%" borderRadius={5} />
              <SkeletonBlock height={15} width="76%" borderRadius={4} />
            </View>
          </View>
          <SkeletonBlock height={88} borderRadius={14} />
          <SkeletonBlock height={68} borderRadius={14} />
          {field("headcount")}
          {field("reward")}
        </View>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="42%" borderRadius={5} />
              <SkeletonBlock height={15} width="72%" borderRadius={4} />
            </View>
            <SkeletonBlock height={22} width={22} borderRadius={11} />
          </View>
          <SkeletonBlock height={48} borderRadius={12} />
          <SkeletonBlock height={48} borderRadius={12} />
          <SkeletonBlock height={64} borderRadius={12} />
          <SkeletonBlock variant="image" height={128} borderRadius={12} />
        </View>
      </>
    ) : (
      <>
        <View className={styles.setupCard} style={{ gap: spacing.md }}>
          <SkeletonBlock height={22} width="46%" borderRadius={5} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
          </View>
          <SkeletonBlock height={16} width="84%" borderRadius={4} />
        </View>
        <View className={styles.sectionCard} style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: spacing.sm,
            }}
          >
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock height={22} width="36%" borderRadius={5} />
              <SkeletonBlock height={15} width="74%" borderRadius={4} />
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View
                key={item}
                style={{ flexDirection: "row", gap: spacing.sm }}
              >
                <SkeletonBlock height={15} width="28%" borderRadius={4} />
                <SkeletonBlock height={15} width="56%" borderRadius={4} />
              </View>
            ))}
          </View>
          <SkeletonBlock height={142} borderRadius={14} />
        </View>
      </>
    );

  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="create-quest-loading-skeleton"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: spacing.xl,
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              alignSelf: "center",
              gap: spacing.sm,
              width: contentMaxWidth,
            }}
          >
            {body}
          </View>
        </ScrollView>
        <View
          className={cn(
            styles.loadingActionBar,
            stackedActions && styles.actionBarStacked
          )}
          style={{ flexDirection: stackedActions ? "column" : "row" }}
        >
          <SkeletonBlock
            height={56}
            borderRadius={14}
            style={{ flex: 1, width: stackedActions ? "100%" : undefined }}
            testID="create-quest-loading-action"
          />
          {step === 3 ? (
            <SkeletonBlock
              height={56}
              borderRadius={14}
              style={{ flex: 1, width: stackedActions ? "100%" : undefined }}
            />
          ) : null}
        </View>
      </View>
    </LoadingSkeleton>
  );
}

function SetupMetric({
  icon: Icon,
  label,
  value,
  testID,
  wide,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testID: string;
  wide: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className={cn(styles.setupMetric, wide && styles.setupMetricWide)}
      testID={testID}
    >
      <View className={styles.setupMetricIcon}>
        <Icon color={colors.primary} size={22} strokeWidth={2.1} />
      </View>
      <View
        className={cn(
          styles.setupMetricCopy,
          wide && styles.setupMetricCopyWide
        )}
      >
        <Text
          className={cn(
            styles.setupMetricLabel,
            wide && styles.setupMetricLabelWide
          )}
        >
          {label}
        </Text>
        <Text
          className={cn(
            styles.setupMetricValue,
            wide && styles.setupMetricValueWide
          )}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuestSetupOverview({
  messages,
  questTag,
  teamSize,
  acceptanceMethod,
  wide,
}: {
  messages: typeof createQuestMessages.en;
  questTag: string;
  teamSize: string;
  acceptanceMethod: string;
  wide: boolean;
}) {
  return (
    <View className={styles.setupCard}>
      <View className={styles.setupTitleRow}>
        <View className={styles.setupTitleIcon}>
          <Check color={colors.primary} size={18} strokeWidth={2.6} />
        </View>
        <Text className={styles.setupTitle}>{messages.questSetup}</Text>
      </View>
      <View className={styles.setupMetrics}>
        <SetupMetric
          icon={Tag}
          label={messages.questTag}
          value={questTag}
          testID="create-quest-summary-type"
          wide={wide}
        />
        <View
          className={cn(
            styles.setupMetricDivider,
            wide && styles.setupMetricDividerWide
          )}
        />
        <SetupMetric
          icon={UsersRound}
          label={messages.teamSize}
          value={teamSize}
          testID="create-quest-summary-size"
          wide={wide}
        />
        <View
          className={cn(
            styles.setupMetricDivider,
            wide && styles.setupMetricDividerWide
          )}
        />
        <SetupMetric
          icon={Mail}
          label={messages.acceptanceMethod}
          value={acceptanceMethod}
          testID="create-quest-summary-applicants"
          wide={wide}
        />
      </View>
      <View className={styles.setupDivider} />
      <Text className={styles.setupHint}>{messages.setupHint}</Text>
    </View>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  variant,
  stacked,
  onChange,
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  variant: ChoiceVariant;
  stacked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View
      className={cn(
        styles.choiceGroup,
        variant === "format"
          ? stacked
            ? styles.choiceGroupFormatStacked
            : styles.choiceGroupFormat
          : styles.choiceGroupAcceptance
      )}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={
        variant === "format" && stacked
          ? { flexDirection: "column" }
          : undefined
      }
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}. ${option.description}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              styles.choice,
              variant === "format"
                ? stacked
                  ? styles.choiceFormatStacked
                  : styles.choiceFormat
                : styles.choiceAcceptance,
              selected && styles.choiceSelected
            )}
            testID={`create-quest-choice-${option.value.toLowerCase()}`}
          >
            <View className={styles.choiceIcon}>
              <Icon
                color={colors.primary}
                size={variant === "format" ? 27 : 26}
                strokeWidth={2.1}
              />
            </View>
            <View className={styles.choiceCopy}>
              <Text
                className={cn(
                  styles.choiceText,
                  selected && styles.choiceTextSelected
                )}
              >
                {option.label}
              </Text>
              <Text className={styles.choiceDescription}>
                {option.description}
              </Text>
            </View>
            <View
              className={cn(styles.radio, selected && styles.radioSelected)}
            >
              {selected ? <View className={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewActionButton({
  label,
  variant,
  accessibilityLabel,
  disabled,
  stacked,
  testID,
  onPress,
}: ReviewActionButtonProps) {
  const isSecondary = variant === "secondary";
  const layoutStyle = stacked
    ? {
        flexBasis: "auto" as const,
        flexGrow: 0,
        flexShrink: 0,
        width: "100%" as const,
      }
    : {
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        width: "auto" as const,
      };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        styles.reviewActionButton,
        stacked && styles.reviewActionButtonStacked,
        isSecondary
          ? styles.reviewActionButtonSecondary
          : styles.reviewActionButtonPrimary
      )}
      disabled={disabled}
      onPress={onPress}
      style={[layoutStyle, { opacity: disabled ? 0.55 : 1 }]}
      testID={testID}
    >
      <Text
        className={cn(
          styles.reviewActionText,
          isSecondary
            ? styles.reviewActionTextSecondary
            : styles.reviewActionTextPrimary
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ModeSummary({
  messages,
  participation,
  candidateMode,
  combinationHint,
}: {
  messages: typeof createQuestMessages.en;
  participation: QuestDraft["participation"];
  candidateMode: QuestDraft["candidateMode"];
  combinationHint: string;
}) {
  const participationLabel =
    participation === "SINGLE" ? messages.singleFormat : messages.teamFormat;
  const candidateLabel =
    candidateMode === "FIRST_COME_FIRST_SERVED"
      ? messages.instantAccept
      : messages.selectCandidate;

  return (
    <View accessibilityLiveRegion="polite" className={styles.modeSummary}>
      <View className={styles.modeIcon}>
        {participation === "SINGLE" ? (
          <UserRoundCheck color={colors.primary} size={30} strokeWidth={2.1} />
        ) : (
          <UsersRound color={colors.primary} size={32} strokeWidth={2.1} />
        )}
      </View>
      <View className={styles.modeCopy}>
        <Text className={styles.modeTitle}>
          {messages.selectedMode}:{" "}
          <Text className={styles.modeValue}>
            {participationLabel} + {candidateLabel}
          </Text>
        </Text>
        <Text className={styles.modeDescription}>{combinationHint}</Text>
      </View>
    </View>
  );
}

function LogisticsSection({
  messages,
  expanded,
  summary,
  onPress,
  children,
}: {
  messages: typeof createQuestMessages.en;
  expanded: boolean;
  summary: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${messages.logistics}: ${expanded ? messages.logisticsDescription : summary}`}
        accessibilityState={{ expanded }}
        className={styles.collapsibleHeader}
        onPress={onPress}
        testID="create-quest-logistics-toggle"
      >
        <View className={styles.collapsibleHeaderIcon}>
          <CalendarClock color={colors.primary} size={20} strokeWidth={2.2} />
        </View>
        <View className={styles.collapsibleHeaderCopy}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>
            {messages.logistics}
          </Text>
          <Text className={styles.sectionDescription}>
            {messages.logisticsDescription}
          </Text>
          {!expanded ? (
            <Text className={styles.collapsibleSummary}>{summary}</Text>
          ) : null}
        </View>
        <ChevronDown
          color={colors.primary}
          size={22}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded ? (
        <View className={styles.collapsibleContent}>{children}</View>
      ) : null}
    </View>
  );
}

export interface CreateQuestScreenProps {
  editQuestId?: string;
}

export default function CreateQuestScreen({
  editQuestId,
}: CreateQuestScreenProps = {}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = createQuestMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const layout = getCreateQuestLayoutMetrics(width);
  const insets = useSafeAreaInsets();
  const draftChangedRef = useRef(false);
  const skipPersistRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestRef = useRef(0);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const titleRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const tagRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const descriptionRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const conditionsRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const startDateRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const deadlineRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const locationRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const headcountRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const rewardRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const [step, setStep] = useState<Step>(() => (editQuestId ? 2 : 1));
  const [draft, setDraft] = useState<QuestDraft>(() =>
    editQuestId
      ? { ...mockQuestDraft, imageUris: [...mockQuestDraft.imageUris] }
      : initialDraft
  );
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveErrorIntent, setSaveErrorIntent] =
    useState<SaveErrorIntent | null>(null);
  const [savingAction, setSavingAction] = useState<CompletionState | null>(
    null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(
    null
  );
  const [imageError, setImageError] = useState<string | undefined>();
  const [scheduleField, setScheduleField] = useState<ScheduleField | null>(
    null
  );
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);
  const [completedState, setCompletedState] = useState<CompletionState | null>(
    null
  );
  const [publishCheck, setPublishCheck] = useState<QuestPublishCheck | null>(
    null
  );
  const [logisticsExpanded, setLogisticsExpanded] = useState(false);
  const [pendingInvalidField, setPendingInvalidField] = useState<string | null>(
    null
  );
  const focusedInvalidFieldRef = useRef<string | null>(null);
  const publishedQuestRef = useRef<{
    questId: string;
    storageKey: string;
    editQuestId?: string;
  } | null>(null);

  const tagOptions = useMemo(
    () => [
      {
        label:
          locale === "th" ? "การออกแบบและงานสร้างสรรค์" : "Design & creative",
        shortLabel: locale === "th" ? "การออกแบบ" : "Design",
        value: "design",
      },
      {
        label: locale === "th" ? "เทคโนโลยี" : "Technology",
        shortLabel: locale === "th" ? "เทคโนโลยี" : "Technology",
        value: "technology",
      },
      {
        label: locale === "th" ? "การสอนพิเศษ" : "Tutoring",
        shortLabel: locale === "th" ? "ติว" : "Tutoring",
        value: "tutoring",
      },
      {
        label: locale === "th" ? "ชีวิตในมหาวิทยาลัย" : "Campus life",
        shortLabel: locale === "th" ? "ชีวิตมหาวิทยาลัย" : "Campus life",
        value: "campus-life",
      },
    ],
    [locale]
  );
  const candidateOptions = useMemo(
    () => [
      {
        value: "FIRST_COME_FIRST_SERVED" as const,
        label: messages.instantAccept,
        description: messages.instantAcceptDescription,
        icon: Clock3,
      },
      {
        value: "CANDIDATE" as const,
        label: messages.selectCandidate,
        description: messages.selectCandidateDescription,
        icon: UserRoundCheck,
      },
    ],
    [messages]
  );
  const participationOptions = useMemo(
    () => [
      {
        value: "SINGLE" as const,
        label: messages.singleFormat,
        description: messages.singleFormatDescription,
        icon: UserRound,
      },
      {
        value: "GROUP" as const,
        label: messages.teamFormat,
        description: messages.teamFormatDescription,
        icon: UsersRound,
      },
    ],
    [messages]
  );

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      completesFlow = false
    ): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveState("saving");
      setSavingAction(state);
      setSaveErrorIntent(null);
      try {
        if (!draftStorageKey) {
          setSaveState("error");
          setSaveErrorIntent({ state, completesFlow });
          setSavingAction(null);
          return false;
        }
        const normalizedDraft = {
          ...draftToSave,
          headcount: getHeadcountForParticipation(
            draftToSave.participation,
            draftToSave.headcount
          ),
        };
        if (editQuestId) {
          await persistQuestDraft(
            draftStorageKey,
            normalizedDraft,
            step,
            state,
            editQuestId
          );
        } else {
          await persistQuestDraft(
            draftStorageKey,
            normalizedDraft,
            step,
            state
          );
        }
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("saved");
        setSaveErrorIntent(null);
        setSavingAction(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("error");
        setSaveErrorIntent({ state, completesFlow });
        setSavingAction(null);
        return false;
      }
    },
    [draftStorageKey, editQuestId, step]
  );

  const publishQuest = useCallback(
    async (draftToPublish: QuestDraft): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveState("saving");
      setSavingAction("OPEN");
      setSaveErrorIntent(null);
      try {
        if (!draftStorageKey) {
          setSaveState("error");
          setSaveErrorIntent({ state: "OPEN", completesFlow: true });
          setSavingAction(null);
          return false;
        }

        let publishedQuestId = publishedQuestRef.current?.questId;
        if (
          !publishedQuestId ||
          publishedQuestRef.current?.storageKey !== draftStorageKey ||
          publishedQuestRef.current?.editQuestId !== editQuestId
        ) {
          const normalizedDraft = {
            ...draftToPublish,
            headcount: getHeadcountForParticipation(
              draftToPublish.participation,
              draftToPublish.headcount
            ),
          };
          const result = questWorkflow.dispatch({
            type: "CREATE_AND_PUBLISH",
            payload: toQuestDraftPayload(normalizedDraft),
            hirerId: "demo-hirer",
          });
          if (!result.ok) {
            setSaveState("error");
            setSaveErrorIntent({ state: "OPEN", completesFlow: true });
            setSavingAction(null);
            return false;
          }
          publishedQuestId = result.state.quest.id;
          publishedQuestRef.current = {
            questId: publishedQuestId,
            storageKey: draftStorageKey,
            editQuestId,
          };
        }

        if (editQuestId) await deleteQuestDraft(draftStorageKey, editQuestId);
        else await deleteQuestDraft(draftStorageKey);
        if (requestId !== saveRequestRef.current) return false;
        publishedQuestRef.current = null;
        setSaveState("saved");
        setSaveErrorIntent(null);
        setSavingAction(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("error");
        setSaveErrorIntent({ state: "OPEN", completesFlow: true });
        setSavingAction(null);
        return false;
      }
    },
    [draftStorageKey, editQuestId]
  );

  useEffect(() => {
    let active = true;
    publishedQuestRef.current = null;
    draftChangedRef.current = false;
    skipPersistRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    void (async () => {
      setDraftHydrated(false);
      setDraftLoadError(false);
      setDraftStorageKey(null);
      try {
        const storageKey = await getQuestDraftStorageKey();
        const snapshot = editQuestId
          ? await loadQuestDraft(storageKey, editQuestId)
          : await loadQuestDraft(storageKey);
        if (!active) return;

        setDraftStorageKey(storageKey);
        if (snapshot && !draftChangedRef.current) {
          setDraft({
            ...snapshot.draft,
            headcount: getHeadcountForParticipation(
              snapshot.draft.participation,
              snapshot.draft.headcount
            ),
          });
          setStep(snapshot.step);
          setCompletedState(snapshot.state === "OPEN" ? "OPEN" : null);
        }
        setDraftHydrated(true);
      } catch {
        if (!active) return;
        skipPersistRef.current = false;
        setDraftLoadError(true);
        setDraftHydrated(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [draftLoadAttempt, editQuestId]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey || completedState) return undefined;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return undefined;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveDraft(draft);
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [completedState, draft, draftHydrated, draftStorageKey, saveDraft, step]);

  const updateDraft = <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => {
    draftChangedRef.current = true;
    skipPersistRef.current = false;
    publishedQuestRef.current = null;
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
    setSaveErrorIntent(null);
    setPublishCheck(null);
    setValidationSummary(null);
    setPendingInvalidField(null);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateParticipation = (value: QuestDraft["participation"]) => {
    draftChangedRef.current = true;
    skipPersistRef.current = false;
    publishedQuestRef.current = null;
    setDraft((current) => ({
      ...current,
      participation: value,
      headcount: getHeadcountForParticipation(value, current.headcount),
    }));
    setSaveState("idle");
    setSaveErrorIntent(null);
    setSavingAction(null);
    setPublishCheck(null);
    setValidationSummary(null);
    setPendingInvalidField(null);
    setErrors((current) => {
      const next = { ...current };
      delete next.headcount;
      return next;
    });
  };

  const focusRefs = useMemo<Record<string, React.RefObject<Focusable | null>>>(
    () => ({
      title: titleRef,
      tag: tagRef,
      description: descriptionRef,
      conditions: conditionsRef,
      startDate: startDateRef,
      deadline: deadlineRef,
      startTime: startDateRef,
      endTime: deadlineRef,
      location: locationRef,
      headcount: headcountRef,
      wage: rewardRef,
    }),
    []
  );

  const focusInvalidField = useCallback(
    (field: string) => {
      const focus = () => {
        const target = focusRefs[field]?.current;
        if (!target) return;
        const reactTag = findNodeHandle(target);
        if (reactTag) void AccessibilityInfo.setAccessibilityFocus(reactTag);
        if ("focus" in target && typeof target.focus === "function")
          target.focus();
        const scrollTag = findNodeHandle(scrollRef.current);
        if (
          scrollTag &&
          "measureLayout" in target &&
          typeof target.measureLayout === "function"
        ) {
          target.measureLayout(
            scrollTag,
            (_x, y) =>
              scrollRef.current?.scrollTo({
                y: Math.max(0, y - 24),
                animated: true,
              }),
            () => scrollRef.current?.scrollTo({ y: 0, animated: true })
          );
        } else {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      };
      if (typeof globalThis.requestIdleCallback === "function") {
        globalThis.requestIdleCallback(focus, { timeout: 250 });
      } else {
        setTimeout(focus, 0);
      }
    },
    [focusRefs]
  );

  useEffect(() => {
    if (!pendingInvalidField) return;
    const targetStep = QUEST_DETAIL_FIELDS.has(pendingInvalidField) ? 1 : 2;
    if (step !== targetStep) return;
    if (LOGISTICS_FIELDS.has(pendingInvalidField) && !logisticsExpanded) return;
    if (focusedInvalidFieldRef.current === pendingInvalidField) return;
    focusedInvalidFieldRef.current = pendingInvalidField;
    focusInvalidField(pendingInvalidField);
  }, [focusInvalidField, logisticsExpanded, pendingInvalidField, step]);

  const validateStep = (currentStep: Step): boolean => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!draft.title.trim()) nextErrors.title = messages.titleError;
      if (!draft.tag) nextErrors.tag = messages.questTagError;
      if (!draft.description.trim())
        nextErrors.description = messages.descriptionError;
      if (!draft.conditions.trim())
        nextErrors.conditions = messages.completionCriteriaError;
    }
    if (currentStep === 2) {
      const today = toDateValue(new Date());
      if (!draft.startDate) nextErrors.startDate = messages.startDateError;
      else if (draft.startDate < today)
        nextErrors.startDate = messages.startDatePastError;
      if (!draft.deadline) nextErrors.deadline = messages.deadlineError;
      if (draft.startDate && draft.deadline && draft.deadline < draft.startDate)
        nextErrors.deadline = messages.deadlineOrderError;
      if (!draft.startTime || !TIME_PATTERN.test(draft.startTime))
        nextErrors.startTime = messages.startTimeError;
      if (!draft.endTime || !TIME_PATTERN.test(draft.endTime))
        nextErrors.endTime = messages.endTimeError;
      const startDateTime = getDateTimeValue(draft.startDate, draft.startTime);
      const endDateTime = getDateTimeValue(draft.deadline, draft.endTime);
      if (
        startDateTime !== null &&
        endDateTime !== null &&
        endDateTime <= startDateTime
      )
        nextErrors.endTime = messages.timeOrderError;
      if (draft.locationMode === "ON_CAMPUS" && !draft.location.trim())
        nextErrors.location = messages.locationError;
      if (
        draft.participation === "GROUP" &&
        (!draft.headcount.trim() || Number(draft.headcount) < 1)
      )
        nextErrors.headcount = messages.headcountError;
      const rewardError = getRewardValidationError(draft.wage, {
        empty: messages.rewardEmptyError,
        format: messages.rewardFormatError,
        bounds: messages.rewardBoundsError,
      });
      if (rewardError) nextErrors.wage = rewardError;
    }

    setErrors(nextErrors);
    const firstErrorKey = Object.keys(nextErrors)[0];
    if (firstErrorKey) {
      const fieldLabels: Record<string, string> = {
        title: messages.titleLabel,
        tag: messages.questTag,
        description: messages.description,
        conditions: messages.completionCriteria,
        startDate: messages.startDate,
        deadline: messages.deadline,
        startTime: messages.startTime,
        endTime: messages.endTime,
        location: messages.location,
        headcount: messages.headcount,
        wage: messages.rewardPerPerson,
      };
      const firstError = `${fieldLabels[firstErrorKey] ?? messages.title}: ${nextErrors[firstErrorKey]}`;
      setValidationSummary(firstError);
      AccessibilityInfo.announceForAccessibility(firstError);
      if (currentStep === 2 && LOGISTICS_FIELDS.has(firstErrorKey))
        setLogisticsExpanded(true);
      if (currentStep !== step) {
        setStep(currentStep);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
      focusedInvalidFieldRef.current = null;
      setPendingInvalidField(firstErrorKey);
    } else {
      setValidationSummary(null);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) {
      setStep((current) => (current + 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const goToStep = (target: Step) => {
    if (target >= step) return;
    setPendingInvalidField(null);
    setStep(target);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const finishQuest = async (state: CompletionState) => {
    if (!validateStep(2)) return;
    const check = questWorkflow.getDraftPublishCheck(draft);
    setPublishCheck(check);
    if (state === "OPEN" && !check.canPublish) {
      const firstBlocker = check.blockers[0];
      if (firstBlocker) setValidationSummary(messages.publishCheckBlocked);
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (state === "OPEN") {
      const published = await publishQuest(draft);
      if (published) setCompletedState("OPEN");
      return;
    }
    const saved = await saveDraft(draft, "DRAFT", true);
    if (saved) setCompletedState("DRAFT");
  };

  const retrySave = () => {
    const intent = saveErrorIntent;
    if (intent?.state === "OPEN") {
      void publishQuest(draft).then((published) => {
        if (published && intent.completesFlow) setCompletedState("OPEN");
      });
      return;
    }
    void saveDraft(draft, "DRAFT", intent?.completesFlow ?? false).then(
      (saved) => {
        if (saved && intent?.completesFlow) setCompletedState("DRAFT");
      }
    );
  };

  const leaveCreateFlow = () => router.replace("/(tabs)");

  const showHelp = () =>
    Alert.alert(messages.helpTitle, messages.helpDescription);

  const retryDraftLoad = () => {
    setDraftLoadError(false);
    setDraftHydrated(false);
    setDraftLoadAttempt((attempt) => attempt + 1);
  };

  const goBack = () => {
    setPendingInvalidField(null);
    if (step === 1) {
      if (isQuestDraftDirty(draft)) {
        Alert.alert(messages.discardTitle, messages.discardDescription, [
          { text: messages.keepEditing, style: "cancel" },
          {
            text: messages.discard,
            style: "destructive",
            onPress: leaveCreateFlow,
          },
        ]);
        return;
      }
      leaveCreateFlow();
    } else {
      setStep((current) => (current - 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const closeSchedulePicker = () => {
    setScheduleField(null);
    setPickerMode("date");
    setIosPickerValue(null);
  };

  const openSchedulePicker = (field: ScheduleField) => {
    const dateValue = field === "start" ? draft.startDate : draft.deadline;
    const timeValue = field === "start" ? draft.startTime : draft.endTime;
    setScheduleField(field);
    setPickerMode("date");
    setIosPickerValue(
      Platform.OS === "ios"
        ? getDateTimePickerValue(dateValue, timeValue)
        : null
    );
  };

  const saveScheduleValue = (field: ScheduleField, value: Date) => {
    const dateKey = field === "start" ? "startDate" : "deadline";
    const timeKey = field === "start" ? "startTime" : "endTime";
    updateDraft(dateKey, toDateValue(value));
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const saveScheduleTime = (field: ScheduleField, value: Date) => {
    const timeKey = field === "start" ? "startTime" : "endTime";
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === "dismissed") {
      closeSchedulePicker();
      return;
    }
    if (!selectedDate || !scheduleField) return;

    if (Platform.OS === "ios") {
      setIosPickerValue(selectedDate);
      return;
    }

    if (pickerMode === "date") {
      const dateKey = scheduleField === "start" ? "startDate" : "deadline";
      updateDraft(dateKey, toDateValue(selectedDate));
      setPickerMode("time");
      return;
    }

    saveScheduleTime(scheduleField, selectedDate);
    closeSchedulePicker();
  };

  const confirmIosScheduleValue = () => {
    if (scheduleField && iosPickerValue)
      saveScheduleValue(scheduleField, iosPickerValue);
    closeSchedulePicker();
  };

  const pickImages = async () => {
    setImageError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_QUEST_IMAGES,
        quality: 0.6,
      });
      if (!result.canceled)
        updateDraft(
          "imageUris",
          result.assets.slice(0, MAX_QUEST_IMAGES).map((asset) => asset.uri)
        );
    } catch {
      setImageError(messages.imageError);
    }
  };

  const removeImage = (index: number) => {
    setDraft((current) => ({
      ...current,
      imageUris: current.imageUris.filter(
        (_, imageIndex) => imageIndex !== index
      ),
    }));
    setImageError(undefined);
  };

  const resetDraft = async () => {
    saveRequestRef.current += 1;
    publishedQuestRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    skipPersistRef.current = true;
    draftChangedRef.current = false;
    try {
      if (draftStorageKey) {
        if (editQuestId) {
          await deleteQuestDraft(draftStorageKey, editQuestId);
        } else {
          await deleteQuestDraft(draftStorageKey);
        }
      }
    } catch {
      setSaveState("error");
    }
    setDraft(initialDraft);
    setErrors({});
    setValidationSummary(null);
    setImageError(undefined);
    setSaveState("idle");
    setSaveErrorIntent(null);
    setSavingAction(null);
    setPublishCheck(null);
    setLogisticsExpanded(false);
    setPendingInvalidField(null);
    setStep(1);
    setCompletedState(null);
  };

  const combinationHint = useMemo(() => {
    if (draft.participation === "SINGLE")
      return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
        ? messages.singleFirstComeHint
        : messages.singleCandidateHint;
    return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
      ? messages.groupFirstComeHint
      : messages.groupCandidateHint;
  }, [draft.candidateMode, draft.participation, messages]);
  const proofRequired = draft.proofRequired !== "none";

  const reviewPublishCheck = useMemo(
    () => publishCheck ?? questWorkflow.getDraftPublishCheck(draft),
    [draft, publishCheck]
  );
  const summary = useMemo(
    () => [
      { label: messages.summary.title, value: draft.title || "—" },
      { label: messages.summary.description, value: draft.description || "—" },
      {
        label: messages.summary.completionCriteria,
        value: draft.conditions || "—",
      },
      {
        label: messages.summary.proof,
        value: proofRequired ? messages.required : messages.notNeeded,
      },
      {
        label: messages.summary.schedule,
        value:
          draft.startDate && draft.deadline && draft.startTime && draft.endTime
            ? `${formatDate(draft.startDate, locale, messages.notSelected)} · ${draft.startTime}–${draft.endTime} → ${formatDate(draft.deadline, locale, messages.notSelected)}`
            : messages.notSelected,
      },
      {
        label: messages.summary.location,
        value:
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected,
      },
      {
        label: messages.summary.images,
        value: draft.imageUris.length
          ? messages.selectedImages(draft.imageUris.length)
          : messages.noImages,
      },
      {
        label: messages.summary.reward,
        value: draft.wage
          ? `${formatDraftReward(draft, locale)} / ${locale === "th" ? "คน" : "person"}`
          : messages.notSelected,
      },
    ],
    [draft, locale, messages, proofRequired]
  );

  const selectedQuestTag =
    tagOptions.find((option) => option.value === draft.tag)?.shortLabel ??
    messages.notSelected;
  const selectedTeamSize =
    draft.participation === "SINGLE"
      ? messages.teamSizeValue("1")
      : draft.headcount
        ? messages.teamSizeValue(draft.headcount)
        : messages.notSelected;
  const selectedAcceptanceMethod =
    draft.candidateMode === "CANDIDATE"
      ? messages.selectCandidate
      : messages.instantAccept;
  const logisticsSummary =
    draft.startDate && draft.deadline && draft.startTime && draft.endTime
      ? messages.logisticsSummaryComplete(
          `${formatDate(draft.startDate, locale, messages.notSelected)} · ${draft.startTime}–${draft.endTime}`,
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected
        )
      : messages.logisticsSummary;
  const useStackedChoices = width < 430 || fontScale >= 1.15;
  const useWideSummary = layout.isExpanded || width >= 430;
  const useStackedActions = width < 340 || fontScale >= 1.15;

  if (!draftHydrated && saveState !== "error") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <StatusBar style="light" />
        <CreateQuestHeader
          messages={messages}
          step={step}
          onBackPress={goBack}
          onHelpPress={showHelp}
          onStepPress={goToStep}
        />
        <View className={styles.surface}>
          {draftLoadError ? (
            <View className={styles.loadErrorState}>
              <View className={styles.loadErrorIcon}>
                <CircleAlert
                  color={colors.dangerDark}
                  size={26}
                  strokeWidth={2.2}
                />
              </View>
              <Text accessibilityRole="alert" className={styles.loadErrorText}>
                {messages.loadDraftError}
              </Text>
              <Button onPress={retryDraftLoad} className={styles.fullButton}>
                {messages.retryLoadDraft}
              </Button>
            </View>
          ) : (
            <CreateQuestSkeleton
              horizontalPadding={layout.horizontalPadding}
              contentMaxWidth={
                layout.isExpanded ? layout.contentMaxWidth : "100%"
              }
              loadingLabel={messages.loadingDraft}
              stackedActions={useStackedActions}
              step={step}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (completedState) {
    const published = completedState === "OPEN";
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <StatusBar style="light" />
        <CreateQuestHeader
          messages={messages}
          step={3}
          onBackPress={() => setCompletedState(null)}
          onHelpPress={showHelp}
          onStepPress={goToStep}
        />
        <View className={styles.surface}>
          <View className={styles.successState}>
            <View className={styles.successIcon}>
              <Check color={colors.primary} size={32} strokeWidth={2.5} />
            </View>
            <Text accessibilityRole="header" className={styles.successTitle}>
              {published
                ? messages.publishedQuestTitle
                : messages.savedDraftTitle}
            </Text>
            <Text className={styles.successDescription}>
              {published
                ? messages.publishedQuestDescription
                : messages.savedDraftDescription}
            </Text>
            <Button
              onPress={() => void resetDraft()}
              className={styles.fullButton}
            >
              {messages.createAnotherDraft}
            </Button>
            <Button
              variant="secondary"
              onPress={leaveCreateFlow}
              className={styles.fullButton}
            >
              {messages.viewQuestBoard}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isSaving = saveState === "saving";
  const nextLabel = step === 2 ? messages.reviewQuest : messages.next;
  const schedulePickerDate =
    scheduleField === "start" ? draft.startDate : draft.deadline;
  const schedulePickerTime =
    scheduleField === "start" ? draft.startTime : draft.endTime;
  const schedulePickerValue = getSchedulePickerValue(
    Platform.OS,
    getDateTimePickerValue(schedulePickerDate, schedulePickerTime),
    iosPickerValue
  );
  const schedulePickerMinimum =
    scheduleField === "start"
      ? new Date()
      : draft.startDate
        ? getDateTimePickerValue(draft.startDate, draft.startTime)
        : undefined;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <StatusBar style="light" />
      <CreateQuestHeader
        messages={messages}
        step={step}
        onBackPress={goBack}
        onHelpPress={showHelp}
        onStepPress={goToStep}
      />
      <View className={styles.surface}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: spacing.xl,
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: spacing.lg,
            }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                alignSelf: "center",
                width: layout.isExpanded ? layout.contentMaxWidth : "100%",
              }}
            >
              {validationSummary ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  className={styles.validationSummary}
                >
                  <View className={styles.validationIcon}>
                    <CircleAlert
                      color={colors.dangerDark}
                      size={19}
                      strokeWidth={2.3}
                    />
                  </View>
                  <Text className={styles.validationSummaryText}>
                    {validationSummary}
                  </Text>
                </View>
              ) : null}
              {saveState === "saving" || saveState === "saved" ? (
                <View
                  accessibilityLiveRegion="polite"
                  className={styles.autosaveStatus}
                >
                  {saveState === "saved" ? (
                    <View className={styles.autosaveSavedIcon}>
                      <Check
                        color={colors.success}
                        size={12}
                        strokeWidth={2.8}
                      />
                    </View>
                  ) : (
                    <View className={styles.autosaveSavingDot} />
                  )}
                  <Text
                    className={cn(
                      styles.autosaveText,
                      saveState === "saved" && styles.autosaveSavedText
                    )}
                  >
                    {saveState === "saved"
                      ? messages.autosaveSaved
                      : messages.autosaveSaving}
                  </Text>
                </View>
              ) : null}
              {saveState === "error" ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  className={styles.saveErrorCard}
                  testID="create-quest-save-error"
                >
                  <CircleAlert
                    color={colors.dangerDark}
                    size={22}
                    strokeWidth={2.2}
                  />
                  <View className={styles.saveErrorCopy}>
                    <Text className={styles.saveErrorText}>
                      {messages.saveError}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.retrySave}
                    onPress={retrySave}
                    className={styles.retryButton}
                    testID="create-quest-retry-save"
                  >
                    <Text className={styles.retryButtonText}>
                      {messages.retrySave}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {step === 1 ? (
                <View className={styles.sectionCard}>
                  <SectionHeading
                    icon={Tag}
                    title={messages.questDetails}
                    description={messages.questDetailsDescription}
                  />
                  <Input
                    ref={titleRef}
                    label={`${messages.titleLabel} *`}
                    placeholder={messages.titlePlaceholder}
                    value={draft.title}
                    onChangeText={(value) => updateDraft("title", value)}
                    error={errors.title}
                    maxLength={100}
                  />
                  <Select
                    ref={tagRef}
                    label={`${messages.questTag} *`}
                    options={tagOptions}
                    value={draft.tag}
                    onValueChange={(value) => updateDraft("tag", value)}
                    placeholder={messages.chooseQuestTag}
                    error={errors.tag}
                    searchable
                    searchPlaceholder={messages.searchQuestTags}
                    noResultsMessage={messages.noMatchingQuestTags}
                    clearSearchLabel={messages.clearSearch}
                    closeLabel={messages.close}
                  />
                  <TextArea
                    ref={descriptionRef}
                    label={`${messages.description} *`}
                    placeholder={messages.descriptionPlaceholder}
                    value={draft.description}
                    onChangeText={(value) => updateDraft("description", value)}
                    error={errors.description}
                    maxLength={300}
                  />
                  <TextArea
                    ref={conditionsRef}
                    label={`${messages.completionCriteria} *`}
                    placeholder={messages.completionCriteriaPlaceholder}
                    value={draft.conditions}
                    onChangeText={(value) => updateDraft("conditions", value)}
                    error={errors.conditions}
                    maxLength={300}
                  />
                  <View className={styles.fieldGroup}>
                    <Pressable
                      accessibilityLabel={messages.proofRequiredToggle}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: proofRequired }}
                      className={styles.proofToggle}
                      onPress={() =>
                        updateDraft(
                          "proofRequired",
                          proofRequired ? "none" : "required"
                        )
                      }
                      testID="create-quest-proof-toggle"
                    >
                      <View
                        className={cn(
                          styles.checkbox,
                          proofRequired && styles.checkboxChecked
                        )}
                      >
                        {proofRequired ? (
                          <Check
                            color={colors.white}
                            size={15}
                            strokeWidth={3}
                          />
                        ) : null}
                      </View>
                      <Text className={styles.proofToggleLabel}>
                        {messages.proofRequiredToggle}
                      </Text>
                    </Pressable>
                    <Text className={styles.proofDescription}>
                      {proofRequired
                        ? messages.proofRequiredDescription
                        : messages.proofNotNeededDescription}
                    </Text>
                  </View>
                </View>
              ) : null}

              {step === 2 ? (
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
                        updateParticipation(
                          value as QuestDraft["participation"]
                        )
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
                          updateDraft(
                            "candidateMode",
                            value as QuestDraft["candidateMode"]
                          )
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
                          <FieldLabel optionalLabel="">
                            {messages.headcount}
                          </FieldLabel>
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
                            updateDraft(
                              "headcount",
                              value.replace(/[^0-9]/g, "")
                            )
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
                          accessibilityLiveRegion={
                            errors.wage ? "assertive" : "none"
                          }
                          className={
                            errors.wage ? styles.errorText : styles.helperText
                          }
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
                    onPress={() => setLogisticsExpanded((current) => !current)}
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
                      hasValue={Boolean(
                        draft.deadline && TIME_PATTERN.test(draft.endTime)
                      )}
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
                            draft.locationMode === "ONLINE"
                              ? "ON_CAMPUS"
                              : "ONLINE"
                          )
                        }
                        className={styles.onlineToggle}
                      >
                        <View
                          className={cn(
                            styles.checkbox,
                            draft.locationMode === "ONLINE" &&
                              styles.checkboxChecked
                          )}
                        >
                          {draft.locationMode === "ONLINE" ? (
                            <Check
                              color={colors.white}
                              size={15}
                              strokeWidth={3}
                            />
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
                            <MapPin
                              color={colors.textMuted}
                              size={18}
                              strokeWidth={2}
                            />
                            <TextInput
                              ref={locationRef}
                              className={styles.iconInput}
                              placeholder={messages.locationPlaceholder}
                              placeholderTextColor={colors.textFaint}
                              value={draft.location}
                              onChangeText={(value) =>
                                updateDraft("location", value)
                              }
                              accessibilityLabel={messages.location}
                              testID="create-quest-location"
                            />
                          </View>
                          {errors.location ? (
                            <Text className={styles.errorText}>
                              {errors.location}
                            </Text>
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
                                  accessibilityLabel={messages.questImage(
                                    index + 1
                                  )}
                                  cachePolicy="memory-disk"
                                  onError={() =>
                                    setImageError(messages.imageError)
                                  }
                                  source={{ uri }}
                                  className={styles.previewImage}
                                />
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={messages.removeImage(
                                    index + 1
                                  )}
                                  hitSlop={8}
                                  onPress={() => removeImage(index)}
                                  className={styles.removeImageButton}
                                >
                                  <X
                                    color={colors.white}
                                    size={15}
                                    strokeWidth={2.5}
                                  />
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
                          <ImagePlus
                            color={colors.primary}
                            size={28}
                            strokeWidth={1.8}
                          />
                          <Text className={styles.imageTitle}>
                            {messages.addImages}
                          </Text>
                          <Text className={styles.helperText}>
                            {messages.imagesOptional}
                          </Text>
                        </Pressable>
                      )}
                      {imageError ? (
                        <Text
                          accessibilityRole="alert"
                          className={styles.errorText}
                        >
                          {imageError}
                        </Text>
                      ) : null}
                    </View>
                  </LogisticsSection>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <QuestSetupOverview
                    messages={messages}
                    questTag={selectedQuestTag}
                    teamSize={selectedTeamSize}
                    acceptanceMethod={selectedAcceptanceMethod}
                    wide={useWideSummary}
                  />
                  <View className={styles.sectionCard}>
                    <SectionHeading
                      icon={Check}
                      title={messages.review}
                      description={messages.questSummaryLabel}
                    />
                    <View className={styles.summaryCard}>
                      {summary.map((item) => (
                        <View key={item.label} className={styles.summaryRow}>
                          <Text className={styles.summaryLabel}>
                            {item.label}
                          </Text>
                          <Text className={styles.summaryValue}>
                            {item.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View
                      accessibilityRole={
                        reviewPublishCheck.canPublish ? undefined : "alert"
                      }
                      accessibilityLiveRegion={
                        reviewPublishCheck.canPublish ? "polite" : "assertive"
                      }
                      className={cn(
                        styles.publishCheckCard,
                        !reviewPublishCheck.canPublish &&
                          styles.publishCheckCardBlocked
                      )}
                      testID="create-quest-publish-check"
                    >
                      <Text className={styles.publishCheckTitle}>
                        {messages.publishCheckTitle}
                      </Text>
                      <Text
                        className={cn(
                          styles.publishCheckStatus,
                          !reviewPublishCheck.canPublish &&
                            styles.publishCheckStatusBlocked
                        )}
                      >
                        {reviewPublishCheck.canPublish
                          ? messages.publishCheckReady
                          : messages.publishCheckBlocked}
                      </Text>
                      <View className={styles.escrowRows}>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.rewardPool}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatDraftReward(draft, locale)} ×{" "}
                            {reviewPublishCheck.escrow.headcount} ={" "}
                            {formatSatang(
                              reviewPublishCheck.escrow.rewardPoolSatang,
                              locale
                            )}
                          </Text>
                        </View>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.platformFee}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatSatang(
                              reviewPublishCheck.escrow.platformFeeSatang,
                              locale
                            )}
                          </Text>
                        </View>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.escrowTotal}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatSatang(
                              reviewPublishCheck.escrow.totalRequiredSatang,
                              locale
                            )}
                          </Text>
                        </View>
                      </View>
                      <Text className={styles.publishCheckNote}>
                        {messages.escrowDescription}
                      </Text>
                      {reviewPublishCheck.warnings.length > 0 ? (
                        <Text className={styles.publishCheckNote}>
                          {messages.publishCheckWarning}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>

          <View
            className={cn(
              styles.actionBar,
              useStackedActions && styles.actionBarStacked
            )}
            style={{
              alignItems: useStackedActions ? "stretch" : "center",
              flexDirection: useStackedActions ? "column" : "row",
              paddingBottom: Math.max(spacing.sm, insets.bottom + spacing.xs),
            }}
          >
            {step < 3 ? (
              <Button
                disabled={isSaving}
                onPress={goNext}
                className={styles.nextButtonFull}
                accessibilityLabel={nextLabel}
              >
                <View className={styles.buttonContent}>
                  <Text className={styles.primaryButtonText}>{nextLabel}</Text>
                  <ChevronRight
                    color={colors.white}
                    size={20}
                    strokeWidth={2.5}
                  />
                </View>
              </Button>
            ) : (
              <>
                <ReviewActionButton
                  accessibilityLabel={
                    savingAction === "DRAFT"
                      ? messages.savingDraft
                      : messages.saveDraft
                  }
                  disabled={isSaving}
                  label={
                    savingAction === "DRAFT"
                      ? messages.savingDraft
                      : messages.saveDraft
                  }
                  onPress={() => void finishQuest("DRAFT")}
                  stacked={useStackedActions}
                  testID="create-quest-save-draft"
                  variant="secondary"
                />
                <ReviewActionButton
                  accessibilityLabel={
                    savingAction === "OPEN"
                      ? messages.publishingQuest
                      : messages.publishQuest
                  }
                  disabled={isSaving}
                  label={
                    savingAction === "OPEN"
                      ? messages.publishingQuest
                      : messages.publishQuest
                  }
                  onPress={() => void finishQuest("OPEN")}
                  stacked={useStackedActions}
                  testID="create-quest-save-preview"
                  variant="primary"
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>

      {scheduleField ? (
        Platform.OS === "ios" ? (
          <Modal
            transparent
            animationType="slide"
            onRequestClose={closeSchedulePicker}
            visible
          >
            <View className={styles.modalBackdrop}>
              <View accessibilityViewIsModal className={styles.pickerSheet}>
                <View className={styles.pickerHeader}>
                  <Text className={styles.pickerTitle}>
                    {scheduleField === "start"
                      ? messages.startDateTime
                      : messages.deadlineDateTime}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.dateDone}
                    onPress={confirmIosScheduleValue}
                    className={styles.pickerDoneButton}
                  >
                    <Text className={styles.pickerDoneText}>
                      {messages.dateDone}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={schedulePickerValue}
                  mode="datetime"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={schedulePickerMinimum}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={schedulePickerValue}
            mode={pickerMode}
            display="default"
            is24Hour
            onChange={handleDateChange}
            minimumDate={
              pickerMode === "date" ? schedulePickerMinimum : undefined
            }
          />
        )
      ) : null}
    </SafeAreaView>
  );
}
