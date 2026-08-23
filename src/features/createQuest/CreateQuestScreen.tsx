import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, findNodeHandle, InteractionManager, Modal, Platform, Pressable as RNPressable, TextInput as RNTextInput, useWindowDimensions } from 'react-native';
import { cn } from '@/tw/cn';
import { Image, KeyboardAvoidingView, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@/tw';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { CalendarClock, Check, ChevronRight, ImagePlus, MapPin, Sparkles, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/features/onboarding/components/Input';
import { Select } from '@/features/onboarding/components/Select';
import { TextArea } from '@/features/onboarding/components/TextArea';
import { TopBar } from '@/components/ui/TopBar';
import { useLocale } from '@/locales/LocaleProvider';
import { createQuestMessages } from '@/locales/createQuestMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics, getCreateQuestLayoutMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './createQuestStyles';
import { getHeadcountForParticipation, getRewardValidationError, getSchedulePickerValue, getScheduleTimeValue, initialDraft, isQuestDraftDirty, type QuestDraft } from './createQuestModel';
import { deleteQuestDraft, getQuestDraftStorageKey, loadQuestDraft, persistQuestDraft } from './createQuestPersistence';
import { MAX_QUEST_IMAGES } from '../questBoard/types';

type Step = 1 | 2 | 3;
type ScheduleField = 'start' | 'end';
type PickerMode = 'date' | 'time';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type CompletionState = 'DRAFT' | 'OPEN';
type Focusable = React.ComponentRef<typeof RNTextInput> | React.ComponentRef<typeof RNPressable>;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function formatDate(value: string, locale: 'en' | 'th', emptyLabel: string): string {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatDateTime(dateValue: string, timeValue: string, locale: 'en' | 'th', emptyLabel: string): string {
  if (!dateValue || !TIME_PATTERN.test(timeValue)) return emptyLabel;
  return `${formatDate(dateValue, locale, emptyLabel)} · ${timeValue}`;
}

function getDateTimeValue(dateValue: string, timeValue: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !TIME_PATTERN.test(timeValue)) return null;
  const date = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

function FieldLabel({ children, required = false, optionalLabel }: { children: string; required?: boolean; optionalLabel: string }) {
  return (
    <Text className={styles.fieldLabel}>
      {children}{required ? <Text className={styles.required}> *</Text> : optionalLabel ? <Text className={styles.optional}> · {optionalLabel}</Text> : null}
    </Text>
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
      <FieldLabel required optionalLabel="">{label}</FieldLabel>
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
        <Text className={cn(styles.dateText, !hasValue && styles.placeholderText)}>{value || emptyLabel}</Text>
        <CalendarClock color={colors.textSecondary} size={19} strokeWidth={2} />
      </Pressable>
      <Text accessibilityLiveRegion={error ? 'assertive' : 'none'} className={error ? styles.errorText : styles.helperText}>{error ?? helper}</Text>
    </View>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  optionalLabel,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  optionalLabel: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <View className={styles.fieldGroup}>
      <FieldLabel required={required} optionalLabel={optionalLabel}>{label}</FieldLabel>
      <View className={styles.choiceGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              className={cn(styles.choice, selected && styles.choiceSelected)}
            >
              <Text className={cn(styles.choiceText, selected && styles.choiceTextSelected)}>{option.label}</Text>
              {selected ? <Check color={colors.primary} size={18} strokeWidth={2.5} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CreateQuestScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = createQuestMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const layout = getCreateQuestLayoutMetrics(width);
  const chrome = getAppChromeMetrics(width, fontScale);
  const insets = useSafeAreaInsets();
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
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<QuestDraft>(initialDraft);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [savingAction, setSavingAction] = useState<CompletionState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const [scheduleField, setScheduleField] = useState<ScheduleField | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('date');
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);
  const [completedState, setCompletedState] = useState<CompletionState | null>(null);

  const tagOptions = useMemo(() => [
    { label: locale === 'th' ? 'การออกแบบและงานสร้างสรรค์' : 'Design & creative', value: 'design' },
    { label: locale === 'th' ? 'เทคโนโลยี' : 'Technology', value: 'technology' },
    { label: locale === 'th' ? 'การสอนพิเศษ' : 'Tutoring', value: 'tutoring' },
    { label: locale === 'th' ? 'ชีวิตในมหาวิทยาลัย' : 'Campus life', value: 'campus-life' },
  ], [locale]);
  const proofOptions = useMemo(() => [
    { label: messages.required, value: 'required' },
    { label: messages.optional, value: 'optional' },
    { label: messages.notNeeded, value: 'none' },
  ], [messages]);
  const candidateOptions = useMemo(() => [
    { value: 'FIRST_COME_FIRST_SERVED' as const, label: messages.firstCome },
    { value: 'CANDIDATE' as const, label: messages.reviewCandidates },
  ], [messages]);
  const participationOptions = useMemo(() => [
    { value: 'SINGLE' as const, label: messages.singlePerson },
    { value: 'GROUP' as const, label: messages.team },
  ], [messages]);

  const saveDraft = useCallback(async (draftToSave: QuestDraft, state: CompletionState = 'DRAFT'): Promise<boolean> => {
    const requestId = ++saveRequestRef.current;
    setSaveState('saving');
    setSavingAction(state);
    try {
      if (!draftStorageKey) {
        setSaveState('error');
        setSavingAction(null);
        return false;
      }
      await persistQuestDraft(draftStorageKey, draftToSave, step, state);
      if (requestId !== saveRequestRef.current) return false;
      setSaveState('saved');
      setSavingAction(null);
      return true;
    } catch {
      if (requestId !== saveRequestRef.current) return false;
      setSaveState('error');
      setSavingAction(null);
      return false;
    }
  }, [draftStorageKey, step]);

  useEffect(() => {
    let active = true;
    void getQuestDraftStorageKey().then((storageKey) => {
      if (active) setDraftStorageKey(storageKey);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftStorageKey) return undefined;
    let active = true;
    void loadQuestDraft(draftStorageKey).then((snapshot) => {
      if (!active) return;
      if (snapshot) {
        setDraft(snapshot.draft);
        setStep(snapshot.step);
        if (snapshot.state === 'OPEN') setCompletedState('OPEN');
      }
      setDraftHydrated(true);
    }).catch(() => {
      if (!active) return;
      setSaveState('error');
      setDraftHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey || skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveDraft(draft);
    }, 400);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, draftHydrated, draftStorageKey, saveDraft, step]);

  const updateDraft = <K extends keyof QuestDraft>(field: K, value: QuestDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState('idle');
    setValidationSummary(null);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateParticipation = (value: QuestDraft['participation']) => {
    setDraft((current) => ({
      ...current,
      participation: value,
      headcount: getHeadcountForParticipation(value, current.headcount),
    }));
    setSaveState('idle');
    setSavingAction(null);
    setValidationSummary(null);
    setErrors((current) => {
      const next = { ...current };
      delete next.headcount;
      return next;
    });
  };

  const focusRefs: Record<string, React.RefObject<Focusable | null>> = {
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
  };

  const focusInvalidField = (field: string) => {
    InteractionManager.runAfterInteractions(() => {
      const target = focusRefs[field]?.current;
      if (!target) return;
      const reactTag = findNodeHandle(target);
      if (reactTag) void AccessibilityInfo.setAccessibilityFocus(reactTag);
      if ('focus' in target && typeof target.focus === 'function') target.focus();
      const scrollTag = findNodeHandle(scrollRef.current);
      if (scrollTag && 'measureLayout' in target && typeof target.measureLayout === 'function') {
        target.measureLayout(scrollTag, (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true }), () => scrollRef.current?.scrollTo({ y: 0, animated: true }));
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
  };

  const validateStep = (currentStep: Step): boolean => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!draft.title.trim()) nextErrors.title = messages.titleError;
      if (!draft.tag) nextErrors.tag = messages.questTagError;
      if (!draft.description.trim()) nextErrors.description = messages.descriptionError;
      if (!draft.conditions.trim()) nextErrors.conditions = messages.completionCriteriaError;
    }
    if (currentStep === 2) {
      const today = toDateValue(new Date());
      if (!draft.startDate) nextErrors.startDate = messages.startDateError;
      else if (draft.startDate < today) nextErrors.startDate = messages.startDatePastError;
      if (!draft.deadline) nextErrors.deadline = messages.deadlineError;
      if (draft.startDate && draft.deadline && draft.deadline < draft.startDate) nextErrors.deadline = messages.deadlineOrderError;
      if (!draft.startTime || !TIME_PATTERN.test(draft.startTime)) nextErrors.startTime = messages.startTimeError;
      if (!draft.endTime || !TIME_PATTERN.test(draft.endTime)) nextErrors.endTime = messages.endTimeError;
      const startDateTime = getDateTimeValue(draft.startDate, draft.startTime);
      const endDateTime = getDateTimeValue(draft.deadline, draft.endTime);
      if (startDateTime !== null && endDateTime !== null && endDateTime <= startDateTime) nextErrors.endTime = messages.timeOrderError;
      if (draft.locationMode === 'ON_CAMPUS' && !draft.location.trim()) nextErrors.location = messages.locationError;
    }
    if (currentStep === 3) {
      if (!draft.headcount.trim() || Number(draft.headcount) < 1) nextErrors.headcount = messages.headcountError;
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
      focusInvalidField(firstErrorKey);
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
    setStep(target);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const finishQuest = async (state: CompletionState) => {
    if (!validateStep(3)) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const saved = await saveDraft(draft, state);
    if (saved) setCompletedState(state);
  };

  const leaveCreateFlow = () => router.replace('/(tabs)');

  const goBack = () => {
    if (step === 1) {
      if (isQuestDraftDirty(draft)) {
        Alert.alert(messages.discardTitle, messages.discardDescription, [
          { text: messages.keepEditing, style: 'cancel' },
          { text: messages.discard, style: 'destructive', onPress: leaveCreateFlow },
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
    setPickerMode('date');
    setIosPickerValue(null);
  };

  const openSchedulePicker = (field: ScheduleField) => {
    const dateValue = field === 'start' ? draft.startDate : draft.deadline;
    const timeValue = field === 'start' ? draft.startTime : draft.endTime;
    setScheduleField(field);
    setPickerMode('date');
    setIosPickerValue(Platform.OS === 'ios' ? getDateTimePickerValue(dateValue, timeValue) : null);
  };

  const saveScheduleValue = (field: ScheduleField, value: Date) => {
    const dateKey = field === 'start' ? 'startDate' : 'deadline';
    const timeKey = field === 'start' ? 'startTime' : 'endTime';
    updateDraft(dateKey, toDateValue(value));
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const saveScheduleTime = (field: ScheduleField, value: Date) => {
    const timeKey = field === 'start' ? 'startTime' : 'endTime';
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      closeSchedulePicker();
      return;
    }
    if (!selectedDate || !scheduleField) return;

    if (Platform.OS === 'ios') {
      setIosPickerValue(selectedDate);
      return;
    }

    if (pickerMode === 'date') {
      const dateKey = scheduleField === 'start' ? 'startDate' : 'deadline';
      updateDraft(dateKey, toDateValue(selectedDate));
      setPickerMode('time');
      return;
    }

    saveScheduleTime(scheduleField, selectedDate);
    closeSchedulePicker();
  };

  const confirmIosScheduleValue = () => {
    if (scheduleField && iosPickerValue) saveScheduleValue(scheduleField, iosPickerValue);
    closeSchedulePicker();
  };

  const pickImages = async () => {
    setImageError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_QUEST_IMAGES,
        quality: 0.6,
      });
      if (!result.canceled) updateDraft('imageUris', result.assets.slice(0, MAX_QUEST_IMAGES).map((asset) => asset.uri));
    } catch {
      setImageError(messages.imageError);
    }
  };

  const removeImage = (index: number) => {
    setDraft((current) => ({ ...current, imageUris: current.imageUris.filter((_, imageIndex) => imageIndex !== index) }));
    setImageError(undefined);
  };

  const resetDraft = async () => {
    saveRequestRef.current += 1;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    skipPersistRef.current = true;
    try {
      if (draftStorageKey) await deleteQuestDraft(draftStorageKey);
    } catch {
      setSaveState('error');
    }
    setDraft(initialDraft);
    setErrors({});
    setValidationSummary(null);
    setImageError(undefined);
    setSaveState('idle');
    setSavingAction(null);
    setStep(1);
    setCompletedState(null);
  };

  const combinationHint = useMemo(() => {
    if (draft.participation === 'SINGLE') return draft.candidateMode === 'FIRST_COME_FIRST_SERVED' ? messages.singleFirstComeHint : messages.singleCandidateHint;
    return draft.candidateMode === 'FIRST_COME_FIRST_SERVED' ? messages.groupFirstComeHint : messages.groupCandidateHint;
  }, [draft.candidateMode, draft.participation, messages]);

  const summary = useMemo(() => [
    { label: messages.summary.title, value: draft.title || '—' },
    { label: messages.summary.questTag, value: tagOptions.find((option) => option.value === draft.tag)?.label ?? messages.notSelected },
    { label: messages.summary.description, value: draft.description || '—' },
    { label: messages.summary.completionCriteria, value: draft.conditions || '—' },
    { label: messages.summary.proof, value: proofOptions.find((option) => option.value === draft.proofRequired)?.label ?? messages.notSelected },
    { label: messages.summary.schedule, value: draft.startDate && draft.deadline && draft.startTime && draft.endTime ? `${formatDate(draft.startDate, locale, messages.notSelected)} · ${draft.startTime}–${draft.endTime} → ${formatDate(draft.deadline, locale, messages.notSelected)}` : messages.notSelected },
    { label: messages.summary.location, value: draft.locationMode === 'ONLINE' ? messages.online : draft.location || messages.notSelected },
    { label: messages.summary.images, value: draft.imageUris.length ? messages.selectedImages(draft.imageUris.length) : messages.noImages },
    { label: messages.summary.candidateMode, value: candidateOptions.find((option) => option.value === draft.candidateMode)?.label ?? messages.notSelected },
    { label: messages.summary.participation, value: participationOptions.find((option) => option.value === draft.participation)?.label ?? messages.notSelected },
    { label: messages.summary.headcount, value: draft.headcount || messages.notSelected },
    { label: messages.summary.reward, value: draft.wage ? `฿ ${draft.wage} / ${locale === 'th' ? 'คน' : 'person'}` : messages.notSelected },
  ], [candidateOptions, draft, locale, messages, participationOptions, proofOptions, tagOptions]);

  if (!draftHydrated && !completedState) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
        <TopBar onBackPress={goBack} backLabel={messages.back} title={messages.title} />
        <View accessibilityRole="progressbar" className={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text className={styles.loadingText}>{messages.loadingDraft}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (completedState) {
    const published = completedState === 'OPEN';
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
        <TopBar onBackPress={() => setCompletedState(null)} backLabel={messages.back} title={messages.title} />
        <View className={styles.successState}>
          <View className={styles.successIcon}><Check color={colors.primary} size={32} strokeWidth={2.5} /></View>
          <Text accessibilityRole="header" className={styles.successTitle}>{published ? messages.publishedQuestTitle : messages.savedDraftTitle}</Text>
          <Text className={styles.successDescription}>{published ? messages.publishedQuestDescription : messages.savedDraftDescription}</Text>
          <Button onPress={() => void resetDraft()} className={styles.fullButton}>{messages.createAnotherDraft}</Button>
          <Button variant="secondary" onPress={leaveCreateFlow} className={styles.fullButton}>{messages.viewQuestBoard}</Button>
        </View>
      </SafeAreaView>
    );
  }

  const stepName = step === 1 ? messages.details : step === 2 ? messages.schedule : messages.questSummary;
  const stepLabels = [messages.details, messages.schedule, messages.questSummary];
  const sectionTitle = step === 1 ? messages.questDetails : step === 2 ? messages.scheduleLocation : messages.participantsReward;
  const sectionDescription = step === 1 ? messages.questDetailsDescription : step === 2 ? messages.scheduleLocationDescription : messages.participantsRewardDescription;
  const isSaving = saveState === 'saving';
  const schedulePickerDate = scheduleField === 'start' ? draft.startDate : draft.deadline;
  const schedulePickerTime = scheduleField === 'start' ? draft.startTime : draft.endTime;
  const schedulePickerValue = getSchedulePickerValue(Platform.OS, getDateTimePickerValue(schedulePickerDate, schedulePickerTime), iosPickerValue);
  const schedulePickerMinimum = scheduleField === 'start'
    ? new Date()
    : draft.startDate
      ? getDateTimePickerValue(draft.startDate, draft.startTime)
      : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <TopBar onBackPress={goBack} backLabel={messages.back} title={messages.title} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 180, paddingHorizontal: layout.horizontalPadding }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignSelf: 'center', width: layout.isExpanded ? layout.contentMaxWidth : '100%' }}>
            {validationSummary ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="assertive" className={styles.validationSummary}>
                <Text className={styles.validationSummaryText}>{validationSummary}</Text>
              </View>
            ) : null}
            <View className={styles.headerBlock}>
              <View className={styles.progressHeader}>
                <Text className={styles.stepText}>{messages.step(step, 3)}</Text>
                <Text className={styles.stepName}>{stepName}</Text>
              </View>
              <View className={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step }}>
                {[1, 2, 3].map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={messages.step(item, 3)} accessibilityState={{ disabled: item >= step }} disabled={item >= step} onPress={() => goToStep(item as Step)} className={styles.progressSegment}><View className={cn(styles.progressSegmentBar, item <= step && styles.progressSegmentActive)} /></Pressable>)}
              </View>
              <View className={styles.stepLabels} accessible={false}>
                {stepLabels.map((label, index) => <Text key={label} className={cn(styles.stepLabel, index + 1 === step && styles.stepLabelActive)}>{label}</Text>)}
              </View>
              {saveState === 'saving' || saveState === 'saved' ? <View accessibilityLiveRegion="polite" className={styles.autosaveStatus}><Text className={styles.autosaveText}>{saveState === 'saving' ? messages.autosaveSaving : messages.autosaveSaved}</Text></View> : null}
            </View>

            <View>
              <View className={styles.sectionHeading}>
                <View className={styles.sectionHeadingText}>
                  <Text accessibilityRole="header" className={styles.sectionTitle}>{sectionTitle}</Text>
                  <Text className={styles.sectionDescription}>{sectionDescription}</Text>
                </View>
              </View>

              {step === 1 ? (
                <>
                  <Input ref={titleRef} label={`${messages.titleLabel} *`} placeholder={messages.titlePlaceholder} value={draft.title} onChangeText={(value) => updateDraft('title', value)} error={errors.title} maxLength={100} />
                  <Select ref={tagRef} label={`${messages.questTag} *`} options={tagOptions} value={draft.tag} onValueChange={(value) => updateDraft('tag', value)} placeholder={messages.chooseQuestTag} error={errors.tag} />
                  <TextArea ref={descriptionRef} label={`${messages.description} *`} placeholder={messages.descriptionPlaceholder} value={draft.description} onChangeText={(value) => updateDraft('description', value)} error={errors.description} maxLength={300} />
                  <TextArea ref={conditionsRef} label={`${messages.completionCriteria} *`} placeholder={messages.completionCriteriaPlaceholder} value={draft.conditions} onChangeText={(value) => updateDraft('conditions', value)} error={errors.conditions} maxLength={300} />
                  <Select label={`${messages.proofOfCompletion} · ${messages.optional}`} options={proofOptions} value={draft.proofRequired} onValueChange={(value) => updateDraft('proofRequired', value)} placeholder={messages.proofPlaceholder} />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <DateTimeField emptyLabel={messages.notSelected} label={messages.startDateTime} value={formatDateTime(draft.startDate, draft.startTime, locale, messages.notSelected)} hasValue={Boolean(draft.startDate && TIME_PATTERN.test(draft.startTime))} error={errors.startDate ?? errors.startTime} helper={messages.dateTimeHelper} fieldRef={startDateRef} testID="create-quest-start-datetime" onPress={() => openSchedulePicker('start')} />
                  <DateTimeField emptyLabel={messages.notSelected} label={messages.deadlineDateTime} value={formatDateTime(draft.deadline, draft.endTime, locale, messages.notSelected)} hasValue={Boolean(draft.deadline && TIME_PATTERN.test(draft.endTime))} error={errors.deadline ?? errors.endTime} helper={messages.dateTimeHelper} fieldRef={deadlineRef} testID="create-quest-deadline-datetime" onPress={() => openSchedulePicker('end')} />
                  <View className={styles.fieldGroup}>
                    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.locationMode === 'ONLINE' }} accessibilityLabel={messages.onlineQuest} onPress={() => updateDraft('locationMode', draft.locationMode === 'ONLINE' ? 'ON_CAMPUS' : 'ONLINE')} className={styles.onlineToggle}>
                      <View className={cn(styles.checkbox, draft.locationMode === 'ONLINE' && styles.checkboxChecked)}>{draft.locationMode === 'ONLINE' ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}</View>
                      <View className={styles.onlineToggleCopy}><Text className={styles.onlineToggleTitle}>{messages.onlineQuest}</Text><Text className={styles.onlineToggleHint}>{messages.onlineQuestHint}</Text></View>
                    </Pressable>
                    {draft.locationMode === 'ON_CAMPUS' ? <><FieldLabel required optionalLabel="">{messages.location}</FieldLabel><View className={cn(styles.inputWithIcon, errors.location && styles.fieldError)}><MapPin color={colors.textMuted} size={18} strokeWidth={2} /><TextInput ref={locationRef} className={styles.iconInput} placeholder={messages.locationPlaceholder} placeholderTextColor={colors.textFaint} value={draft.location} onChangeText={(value) => updateDraft('location', value)} accessibilityLabel={messages.location} testID="create-quest-location" /></View>{errors.location ? <Text className={styles.errorText}>{errors.location}</Text> : null}</> : null}
                  </View>
                  <View className={styles.fieldGroup}>
                    <FieldLabel optionalLabel={messages.optional}>{messages.images}</FieldLabel>
                    {draft.imageUris.length > 0 ? (
                      <View className={styles.imagePicker} accessible={false}>
                        <View className={styles.imageGrid}>
                          {draft.imageUris.map((uri, index) => (
                            <View key={`${uri}-${index}`} className={styles.imagePreviewContainer}>
                              <Image accessibilityLabel={messages.questImage(index + 1)} cachePolicy="memory-disk" onError={() => setImageError(messages.imageError)} source={{ uri }} className={styles.previewImage} />
                              <Pressable accessibilityRole="button" accessibilityLabel={messages.removeImage(index + 1)} hitSlop={8} onPress={() => removeImage(index)} className={styles.removeImageButton}>
                                <X color={colors.white} size={15} strokeWidth={2.5} />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel={messages.changeImages} onPress={() => void pickImages()} className={styles.changeImagesButton}><Text className={styles.imageTitle}>{messages.changeImages}</Text></Pressable>
                      </View>
                    ) : (
                      <Pressable accessibilityRole="button" accessibilityLabel={messages.addImages} onPress={() => void pickImages()} className={styles.imagePicker}><ImagePlus color={colors.primary} size={28} strokeWidth={1.8} /><Text className={styles.imageTitle}>{messages.addImages}</Text><Text className={styles.helperText}>{messages.imagesOptional}</Text></Pressable>
                    )}
                    {imageError ? <Text accessibilityRole="alert" className={styles.errorText}>{imageError}</Text> : null}
                  </View>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <ChoiceGroup label={messages.participation} value={draft.participation} options={participationOptions} optionalLabel={messages.optional} onChange={(value) => updateParticipation(value as QuestDraft['participation'])} />
                  <ChoiceGroup label={messages.candidateMode} value={draft.candidateMode} options={candidateOptions} optionalLabel={messages.optional} onChange={(value) => updateDraft('candidateMode', value as QuestDraft['candidateMode'])} />
                  <Text className={styles.choiceHint}>{combinationHint}</Text>
                  {draft.participation === 'SINGLE' ? (
                    <View className={styles.fieldGroup}>
                      <FieldLabel required optionalLabel={messages.optional}>{messages.headcount}</FieldLabel>
                      <View accessible accessibilityLabel={`${messages.headcount}: 1`} className={styles.readOnlyField}>
                        <Text className={styles.readOnlyValue}>1</Text>
                      </View>
                      <Text className={styles.singleHeadcountHint}>{messages.singleHeadcountHint}</Text>
                    </View>
                  ) : (
                    <Input ref={headcountRef} label={`${messages.headcount} *`} placeholder={messages.headcountPlaceholder} value={draft.headcount} onChangeText={(value) => updateDraft('headcount', value.replace(/[^0-9]/g, ''))} error={errors.headcount} keyboardType="number-pad" />
                  )}
                  <View className={styles.fieldGroup}>
                    <FieldLabel required optionalLabel={messages.optional}>{messages.rewardPerPerson}</FieldLabel>
                    <View className={cn(styles.currencyInput, errors.wage ? styles.fieldError : null)}>
                      <Text className={styles.currencySymbol}>฿</Text>
                      <TextInput ref={rewardRef} className={styles.currencyTextInput} placeholder={messages.rewardPlaceholder} placeholderTextColor={colors.textFaint} value={draft.wage} onChangeText={(value) => updateDraft('wage', value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" accessibilityLabel={`${messages.rewardPerPerson} (THB)`} />
                      <Text className={styles.currencyUnit}>THB</Text>
                    </View>
                    <Text accessibilityLiveRegion={errors.wage ? 'assertive' : 'none'} className={errors.wage ? styles.errorText : styles.helperText}>{errors.wage ?? messages.rewardHelper}</Text>
                  </View>
                  <View className={styles.summaryHeading}><Sparkles color={colors.primary} size={18} strokeWidth={2} /><Text className={styles.summaryTitle}>{messages.questSummaryLabel}</Text></View>
                  <View className={styles.summaryCard}>{summary.map((item) => <View key={item.label} className={styles.summaryRow}><Text className={styles.summaryLabel}>{item.label}</Text><Text className={styles.summaryValue}>{item.value}</Text></View>)}</View>
                </>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View className={styles.actionBar} style={{
          marginBottom: chrome.isTablet ? 0 : Math.max(insets.bottom, spacing.sm) + spacing.xs,
          paddingBottom: Math.max(spacing.sm, insets.bottom + spacing.xs),
        }}>
          {step < 3 ? (
            <Button disabled={isSaving} onPress={goNext} className={styles.nextButton} accessibilityLabel={messages.next}>
              <View className={styles.buttonContent}><Text className={styles.primaryButtonText}>{messages.next}</Text><ChevronRight color={colors.white} size={18} strokeWidth={2.5} /></View>
            </Button>
          ) : (
            <>
              <Button variant="secondary" disabled={isSaving} onPress={() => void finishQuest('DRAFT')} className={styles.finalActionButton} accessibilityLabel={savingAction === 'DRAFT' ? messages.savingDraft : messages.saveDraft}>
                {savingAction === 'DRAFT' ? messages.savingDraft : messages.saveDraft}
              </Button>
              <Button disabled={isSaving} onPress={() => void finishQuest('OPEN')} className={styles.finalActionButton} accessibilityLabel={savingAction === 'OPEN' ? messages.savingPreview : messages.savePreview}>
                {savingAction === 'OPEN' ? messages.savingPreview : messages.savePreview}
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {scheduleField ? Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={closeSchedulePicker} visible>
          <View className={styles.modalBackdrop}>
            <View accessibilityViewIsModal className={styles.pickerSheet}>
              <View className={styles.pickerHeader}>
                <Text className={styles.pickerTitle}>{scheduleField === 'start' ? messages.startDateTime : messages.deadlineDateTime}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={messages.dateDone} onPress={confirmIosScheduleValue} className={styles.pickerDoneButton}>
                  <Text className={styles.pickerDoneText}>{messages.dateDone}</Text>
                </Pressable>
              </View>
              <DateTimePicker value={schedulePickerValue} mode="datetime" display="spinner" onChange={handleDateChange} minimumDate={schedulePickerMinimum} />
            </View>
          </View>
        </Modal>
      ) : (
        <DateTimePicker value={schedulePickerValue} mode={pickerMode} display="default" is24Hour onChange={handleDateChange} minimumDate={pickerMode === 'date' ? schedulePickerMinimum : undefined} />
      ) : null}
    </SafeAreaView>
  );
}
