import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDays, Check, ChevronRight, ImagePlus, MapPin, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/features/onboarding/components/Input';
import { Select } from '@/features/onboarding/components/Select';
import { TextArea } from '@/features/onboarding/components/TextArea';
import { TopBar } from '@/components/ui/TopBar';
import { colors } from '@/theme/colors';
import styles from './createQuestStyles';

type Step = 1 | 2 | 3;
type DatePickerField = 'startDate' | 'deadline';

interface QuestDraft {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: string;
  startDate: string;
  deadline: string;
  location: string;
  imageUris: string[];
  candidateMode: string;
  participation: string;
  headcount: string;
  wage: string;
}

const initialDraft: QuestDraft = {
  title: '',
  tag: '',
  description: '',
  conditions: '',
  proofRequired: 'required',
  startDate: '',
  deadline: '',
  location: '',
  imageUris: [],
  candidateMode: 'NO_CANDIDATE',
  participation: 'single',
  headcount: '',
  wage: '',
};

const tagOptions = [
  { label: 'Design & creative', value: 'design' },
  { label: 'Technology', value: 'technology' },
  { label: 'Tutoring', value: 'tutoring' },
  { label: 'Campus life', value: 'campus-life' },
];

const proofOptions = [
  { label: 'Required', value: 'required' },
  { label: 'Optional', value: 'optional' },
  { label: 'Not needed', value: 'none' },
];

const candidateOptions = [
  { value: 'NO_CANDIDATE', label: 'First-come, first-served' },
  { value: 'review', label: 'Review candidates' },
];

const participationOptions = [
  { value: 'single', label: 'Single person' },
  { value: 'team', label: 'Team' },
];

function formatDate(value: string): string {
  if (!value) return 'Choose a date';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Choose a date';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}{required ? <Text style={styles.required}> *</Text> : <Text style={styles.optional}> · optional</Text>}
    </Text>
  );
}

function DateField({
  label,
  value,
  error,
  onPress,
}: {
  label: string;
  value: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel required>{label}</FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        accessibilityState={{ disabled: false }}
        onPress={onPress}
        style={[styles.dateField, error ? styles.fieldError : null]}
      >
        <Text style={[styles.dateText, !value && styles.placeholderText]}>{formatDate(value)}</Text>
        <CalendarDays color={colors.textSecondary} size={19} strokeWidth={2} />
      </Pressable>
      <Text style={styles.helperText}>{error ?? 'Use day, month, and year.'}</Text>
    </View>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel required>{label}</FieldLabel>
      <View style={styles.choiceGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
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
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<QuestDraft>(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dateField, setDateField] = useState<DatePickerField | null>(null);
  const [completed, setCompleted] = useState(false);

  const updateDraft = <K extends keyof QuestDraft>(field: K, value: QuestDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateStep = (currentStep: Step): boolean => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!draft.title.trim()) nextErrors.title = 'Add a short title so people know what they will do.';
      if (!draft.tag) nextErrors.tag = 'Choose the category that best matches this quest.';
      if (!draft.description.trim()) nextErrors.description = 'Describe the work and expected outcome.';
      if (!draft.conditions.trim()) nextErrors.conditions = 'Add the criteria for marking the quest complete.';
    }
    if (currentStep === 2) {
      if (!draft.startDate) nextErrors.startDate = 'Choose when the quest can begin.';
      if (!draft.deadline) nextErrors.deadline = 'Choose the final date for applications or work.';
      if (draft.startDate && draft.deadline && draft.deadline < draft.startDate) {
        nextErrors.deadline = 'Deadline must be on or after the start date.';
      }
    }
    if (currentStep === 3) {
      if (!draft.headcount.trim() || Number(draft.headcount) < 1) nextErrors.headcount = 'Enter at least 1 participant.';
      if (!draft.wage.trim() || Number(draft.wage) < 0) nextErrors.wage = 'Enter a valid amount in THB.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((current) => (current + 1) as Step);
    else setCompleted(true);
  };

  const goBack = () => {
    if (step === 1) router.back();
    else setStep((current) => (current - 1) as Step);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setDateField(null);
      return;
    }
    if (selectedDate && dateField) updateDraft(dateField, toDateValue(selectedDate));
    if (Platform.OS !== 'ios' || selectedDate) setDateField(null);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.6,
    });
    if (!result.canceled) updateDraft('imageUris', result.assets.slice(0, 3).map((asset) => asset.uri));
  };

  const summary = useMemo(() => [
    { label: 'Title', value: draft.title || '—' },
    { label: 'Category', value: tagOptions.find((option) => option.value === draft.tag)?.label ?? '—' },
    { label: 'Schedule', value: draft.startDate && draft.deadline ? `${formatDate(draft.startDate)} → ${formatDate(draft.deadline)}` : '—' },
    { label: 'Location', value: draft.location || 'Online or to be agreed' },
    { label: 'Participants', value: `${draft.headcount || '—'} · ${draft.participation === 'team' ? 'Team' : 'Single person'}` },
    { label: 'Reward', value: draft.wage ? `฿ ${draft.wage} per person` : '—' },
  ], [draft]);

  if (completed) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <TopBar onBackPress={() => setCompleted(false)} />
        <View style={styles.successState}>
          <View style={styles.successIcon}><Check color={colors.primary} size={32} strokeWidth={2.5} /></View>
          <Text style={styles.successTitle}>Quest ready to post</Text>
          <Text style={styles.successDescription}>This is a local mockup. The quest has not been sent to the API yet.</Text>
          <Button onPress={() => { setDraft(initialDraft); setStep(1); setCompleted(false); }} style={styles.fullButton}>Create another quest</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar onBackPress={goBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>CREATE A QUEST</Text>
          <Text style={styles.title}>Create Quest</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step {step} of 3</Text>
            <Text style={styles.stepName}>{step === 1 ? 'Details' : step === 2 ? 'Schedule' : 'Review'}</Text>
          </View>
          <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step }}>
            {[1, 2, 3].map((item) => <View key={item} style={[styles.progressSegment, item <= step && styles.progressSegmentActive]} />)}
          </View>
        </View>

        {step === 1 ? (
          <View>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>01</Text></View>
              <View style={styles.sectionHeadingText}><Text style={styles.sectionTitle}>Quest details</Text><Text style={styles.sectionDescription}>Give people enough context to decide if this quest is right for them.</Text></View>
            </View>
            <Input label="Title *" placeholder="e.g. Design a poster for the faculty fair" value={draft.title} onChangeText={(value) => updateDraft('title', value)} error={errors.title} maxLength={100} />
            <Select label="Category *" options={tagOptions} value={draft.tag} onValueChange={(value) => updateDraft('tag', value)} placeholder="Choose a category" error={errors.tag} />
            <TextArea label="Description *" placeholder="What needs to be done and what should the result look like?" value={draft.description} onChangeText={(value) => updateDraft('description', value)} error={errors.description} maxLength={300} />
            <TextArea label="Completion criteria *" placeholder="How will you know the quest is complete?" value={draft.conditions} onChangeText={(value) => updateDraft('conditions', value)} error={errors.conditions} maxLength={300} />
            <Select label="Proof of completion" options={proofOptions} value={draft.proofRequired} onValueChange={(value) => updateDraft('proofRequired', value)} placeholder="Choose proof requirement" />
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>02</Text></View>
              <View style={styles.sectionHeadingText}><Text style={styles.sectionTitle}>Schedule & location</Text><Text style={styles.sectionDescription}>Set a clear window for the work. You can keep the location flexible.</Text></View>
            </View>
            <DateField label="Start date" value={draft.startDate} error={errors.startDate} onPress={() => setDateField('startDate')} />
            <DateField label="Deadline" value={draft.deadline} error={errors.deadline} onPress={() => setDateField('deadline')} />
            <View style={styles.fieldGroup}>
              <FieldLabel>Location</FieldLabel>
              <View style={styles.inputWithIcon}>
                <MapPin color={colors.textMuted} size={18} strokeWidth={2} />
                <TextInput style={styles.iconInput} placeholder="e.g. Faculty building or online" placeholderTextColor={colors.textFaint} value={draft.location} onChangeText={(value) => updateDraft('location', value)} accessibilityLabel="Location" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <FieldLabel>Images</FieldLabel>
              <Pressable accessibilityRole="button" accessibilityLabel="Add up to 3 quest images" onPress={() => void pickImages()} style={styles.imagePicker}>
                {draft.imageUris.length > 0 ? (
                  <View style={styles.imageGrid}>{draft.imageUris.map((uri) => <Image key={uri} source={{ uri }} style={styles.previewImage} />)}</View>
                ) : (
                  <><ImagePlus color={colors.primary} size={28} strokeWidth={1.8} /><Text style={styles.imageTitle}>Add images</Text><Text style={styles.helperText}>Up to 3 photos · optional</Text></>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>03</Text></View>
              <View style={styles.sectionHeadingText}><Text style={styles.sectionTitle}>Participants & reward</Text><Text style={styles.sectionDescription}>Choose how people join and what each participant receives.</Text></View>
            </View>
            <ChoiceGroup label="Candidate mode" value={draft.candidateMode} options={candidateOptions} onChange={(value) => updateDraft('candidateMode', value)} />
            <Text style={styles.choiceHint}>{draft.candidateMode === 'NO_CANDIDATE' ? 'Automatically accepts people in the order they apply.' : 'You review applicants and choose who can join.'}</Text>
            <ChoiceGroup label="Participation" value={draft.participation} options={participationOptions} onChange={(value) => updateDraft('participation', value)} />
            <Input label="Headcount *" placeholder="e.g. 3" value={draft.headcount} onChangeText={(value) => updateDraft('headcount', value.replace(/[^0-9]/g, ''))} error={errors.headcount} keyboardType="number-pad" />
            <View style={styles.fieldGroup}>
              <FieldLabel required>Wage per person</FieldLabel>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>฿</Text>
                <TextInput style={styles.currencyTextInput} placeholder="0.00" placeholderTextColor={colors.textFaint} value={draft.wage} onChangeText={(value) => updateDraft('wage', value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" accessibilityLabel="Wage per person in Thai baht" />
                <Text style={styles.currencyUnit}>THB</Text>
              </View>
              <Text style={errors.wage ? styles.errorText : styles.helperText}>{errors.wage ?? 'Paid to each accepted participant.'}</Text>
            </View>
            <View style={styles.reviewHeading}><Sparkles color={colors.primary} size={18} strokeWidth={2} /><Text style={styles.reviewTitle}>Review before posting</Text></View>
            <View style={styles.reviewCard}>{summary.map((item) => <View key={item.label} style={styles.summaryRow}><Text style={styles.summaryLabel}>{item.label}</Text><Text style={styles.summaryValue}>{item.value}</Text></View>)}</View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <Button variant="secondary" onPress={goBack} style={styles.backButton}>Back</Button>
        <Button onPress={goNext} style={styles.nextButton}><View style={styles.buttonContent}><Text style={styles.primaryButtonText}>{step === 3 ? 'Complete' : 'Next'}</Text><ChevronRight color={colors.white} size={18} strokeWidth={2.5} /></View></Button>
      </View>

      {dateField ? <DateTimePicker value={getDatePickerValue(draft[dateField])} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} minimumDate={dateField === 'deadline' && draft.startDate ? getDatePickerValue(draft.startDate) : undefined} /> : null}
    </SafeAreaView>
  );
}
