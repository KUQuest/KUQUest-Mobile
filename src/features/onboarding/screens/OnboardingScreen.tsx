import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Host, Button } from '@expo/ui';
import { CalendarDays, Check, CircleAlert, Image as ImageIcon, Pencil, Trash2, UserRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import styles from '@/features/onboarding/styles/registrationStyles';
import { colors } from '@/theme/colors';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Checkbox } from '../components/Checkbox';
import { TextArea } from '../components/TextArea';
import { FileTooLargeModal } from '../components/FileTooLargeModal';
import { onboardingMessages } from '../../../locales/registrationOnboarding';
import { useLocale } from '../../../locales/LocaleProvider';
import { createEmptyProfile } from '../../profile/types';
import type { Certificate, Experience, ProfileDraft, Work } from '../../profile/types';
import { authService } from '../../auth/AuthService';
import { AuthError, type OnboardingStep } from '../../auth/types';
import { ApiError } from '../../../api/ApiClient';
import type { AcademicRegistrationOptions } from '../../../api/contracts';
import { mapProfileRecordsToDraft } from '../../profile/profileMappers';
import { ProfilePersistenceCoordinator, ProfilePersistenceError } from '../profilePersistenceCoordinator';
import { parseOnboardingStep } from '../steps';
import { validateProfileBasics, validateProfileDetails } from '../validation';

function createOnboardingForm(): ProfileDraft {
  return {
    ...createEmptyProfile(),
    certificates: [createEmptyCertificate()],
    works: [createEmptyWork()],
    experiences: [createEmptyExperience()],
  };
}

function createEmptyCertificate(): Certificate {
  return { name: '', issuer: '', issuedAt: '', imageUri: '' };
}

function createEmptyWork(): Work {
  return { imageUri: '', title: '', detail: '' };
}

function createEmptyExperience(): Experience {
  return { title: '', employmentType: '', organization: '', description: '', startedAt: '', endedAt: '' };
}

function formatMonthYear(value: string, locale: 'en' | 'th'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

function onboardingDebug(message: string, details: Record<string, unknown> = {}): void {
  if (__DEV__) {
    console.log(`[onboarding] ${message}`, details);
  }
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const msg = onboardingMessages[locale];
  const { mode, step } = useLocalSearchParams<{ mode?: string; step?: string | string[] }>();
  const isEditMode = mode === 'edit';
  const routerRef = useRef(router);
  const routeStep = parseOnboardingStep(step);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(routeStep);
  const [form, setForm] = useState<ProfileDraft>(createOnboardingForm);
  const [options, setOptions] = useState<AcademicRegistrationOptions | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; value: string; kind: 'certificate' | 'experience'; field?: 'startedAt' | 'endedAt' } | null>(null);
  const [today] = useState(() => new Date());
  const persistenceCoordinator = useRef(new ProfilePersistenceCoordinator());
  const { width } = useWindowDimensions();
  const buttonWidth = (width - 96) / 2;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadError(false);
      setIsLoadingProfile(true);
      try {
        const session = await authService.getSession();
        if (!session) throw new Error('No active session');
        const api = await authService.getStudentApi();
        const experiencesPromise = typeof api.listExperience === 'function'
          ? api.listExperience().catch((error) => {
            if (error instanceof ApiError && error.status === 404) return [];
            throw error;
          })
          : Promise.resolve([]);
        const [academicOptions, status, profile, certificates, portfolio, experiences] = await Promise.all([
          api.getAcademicRegistrationOptions(),
          api.getAcademicRegistrationStatus(),
          api.getProfile(),
          api.listCertificates(),
          api.listPortfolio(),
          experiencesPromise,
        ]);
        const mappedForm = mapProfileRecordsToDraft({
          profile,
          status,
          options: academicOptions,
          certificates,
          portfolio,
          experiences,
          fallbackName: session.user.name,
          fallbackImage: session.user.image ?? '',
        });

        if (active) {
          setOptions(academicOptions);
          setForm({
            ...mappedForm,
            certificates: mappedForm.certificates.length > 0 ? mappedForm.certificates : [createEmptyCertificate()],
            works: mappedForm.works.length > 0 ? mappedForm.works : [createEmptyWork()],
            experiences: mappedForm.experiences.length > 0 ? mappedForm.experiences : [createEmptyExperience()],
          });
        }
      } catch (error) {
        if (error instanceof AuthError && error.code === 'SESSION_EXPIRED') {
          await authService.signOut().catch(() => undefined);
          if (active) routerRef.current.replace('/');
          return;
        }
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [loadAttempt, msg.loadingProfile, msg.submitErrorMsg]);

  const occupationOptions = (options?.occupations ?? []).map((occupation) => ({
    label: occupation.name,
    value: occupation.id,
  }));
  const selectedOccupation = options?.occupations.find((occupation) => occupation.id === form.occupation);
  const selectedFaculty = options?.faculties.find((faculty) => faculty.id === form.faculty);
  const facultyOptions = (options?.faculties ?? []).map((faculty) => ({ label: faculty.name, value: faculty.id }));
  const departmentOptions = (selectedFaculty?.departments ?? []).map((department) => ({
    label: department.name,
    value: department.id,
  }));

  const validate = () => {
    const newErrors = validateProfileBasics(form, isEditMode, msg, selectedOccupation?.requiresStudentId ?? false);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = validateProfileDetails(form, msg);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      onboardingDebug('save validation failed', { fields: Object.keys(newErrors) });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const session = await authService.getSession();
      if (!session) throw new Error('No active session');
      const api = await authService.getStudentApi();
      const result = await persistenceCoordinator.current.save(
        api,
        form,
        isEditMode,
        process.env.EXPO_PUBLIC_TERMS_VERSION,
      );
      setForm(result.draft);
      if (isEditMode) router.replace('/(tabs)/profile');
      else router.replace('/');
    } catch (error) {
      if (error instanceof AuthError && error.code === 'SESSION_EXPIRED') {
        await authService.signOut().catch(() => undefined);
        router.replace('/');
        return;
      }
      if (error instanceof ProfilePersistenceError) {
        setForm(error.draft);
        if (error.partial) {
          setSubmitError(`${msg.submitErrorMsg} ${msg.partialSaveMsg}`);
        } else {
          setSubmitError(msg.submitErrorMsg || 'Failed to save data. Please try again.');
        }
      } else {
        setSubmitError(error instanceof Error && error.message.includes('EXPO_PUBLIC_TERMS_VERSION')
          ? error.message
          : msg.submitErrorMsg || 'Failed to save data. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async (onSelected: (uri: string) => void, aspect: [number, number]) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.5,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setRetryAction(() => () => void handlePickImage(onSelected, aspect));
        setModalVisible(true);
        return;
      }
      onSelected(asset.uri);
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate || !datePickerTarget) {
      setDatePickerTarget(null);
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const date = datePickerTarget.kind === 'experience' ? `${year}-${month}-01` : `${year}-${month}-${day}`;
    if (datePickerTarget.kind === 'certificate') handleUpdateCertificate(datePickerTarget.index, 'issuedAt', date);
    else if (datePickerTarget.field) handleUpdateExperience(datePickerTarget.index, datePickerTarget.field, date);
    setDatePickerTarget(null);
  };

  const openDatePicker = (index: number, value: string) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
    setDatePickerTarget({ index, value: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString(), kind: 'certificate' });
  };

  const openExperienceDatePicker = (index: number, field: 'startedAt' | 'endedAt', value: string) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
    setDatePickerTarget({ index, field, value: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(), kind: 'experience' });
  };

  const handleUpdateCertificate = (index: number, field: keyof Certificate, value: string) => {
    setForm((previous) => ({
      ...previous,
      certificates: previous.certificates.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };
  const handleUpdateWork = (index: number, field: keyof Work, value: string) => {
    setForm((previous) => ({
      ...previous,
      works: previous.works.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };
  const handleUpdateExperience = (index: number, field: keyof Experience, value: string) => {
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeExperienceNow = (index: number) => {
    const experience = form.experiences[index];
    if (experience?.id) persistenceCoordinator.current.markExperienceDeleted(experience.id);
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.length === 1 ? [createEmptyExperience()] : previous.experiences.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removeExperience = (index: number) => {
    const experience = form.experiences[index];
    if (!experience?.id) {
      removeExperienceNow(index);
      return;
    }
    Alert.alert(msg.confirmDeleteTitle, msg.confirmDeleteMessage, [
      { text: msg.cancel, style: 'cancel' },
      { text: msg.confirm, style: 'destructive', onPress: () => removeExperienceNow(index) },
    ]);
  };

  const removeCertificate = async (index: number) => {
    const certificate = form.certificates[index];
    try {
      if (certificate?.id) {
        persistenceCoordinator.current.markCertificateDeleted(certificate.id);
      }
      setForm((previous) => ({
        ...previous,
        certificates: previous.certificates.length === 1
          ? [createEmptyCertificate()]
          : previous.certificates.filter((_, itemIndex) => itemIndex !== index),
      }));
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  const removeWork = async (index: number) => {
    const work = form.works[index];
    try {
      if (work?.id) {
        persistenceCoordinator.current.markPortfolioDeleted(work.id);
      }
      setForm((previous) => ({
        ...previous,
        works: previous.works.length === 1
          ? [createEmptyWork()]
          : previous.works.filter((_, itemIndex) => itemIndex !== index),
      }));
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  if (isLoadingProfile) {
    return <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}><Text style={styles.loadingText}>{msg.loadingProfile}</Text></SafeAreaView>;
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadErrorCard} accessibilityRole="alert">
          <CircleAlert size={24} color={colors.danger} strokeWidth={2} />
          <Text style={styles.submitErrorText}>{msg.loadError}</Text>
          <Pressable accessibilityRole="button" style={styles.addMoreBtn} onPress={() => setLoadAttempt((attempt) => attempt + 1)}>
            <Text style={styles.addMoreBtnText}>{msg.retrySubmitBtn}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.stepTitle}>{isEditMode ? msg.editProfile : currentStep === 1 ? msg.stepTitle : currentStep === 2 ? msg.step2Title : msg.step3Title}</Text>
          {!isEditMode && <Text style={styles.stepIndicator}>{currentStep === 1 ? msg.stepIndicator : currentStep === 2 ? msg.step2Indicator : msg.step3Indicator}</Text>}
          <View style={styles.progressContainer} accessibilityLabel={msg.progressLabel(currentStep)}>
            {[1, 2, 3].map((progressStep) => (
              <View key={progressStep} style={currentStep >= progressStep ? styles.progressBarActive : styles.progressBarInactive} />
            ))}
          </View>
          {currentStep === 1 && <Pressable accessibilityRole="button" accessibilityLabel={msg.addImage} style={styles.avatarPlaceholder} onPress={() => void handlePickImage((uri) => setForm((previous) => ({ ...previous, profileImage: uri })), [1, 1])}>
            {form.profileImage ? <Image source={{ uri: form.profileImage }} style={styles.avatarImage} /> : <UserRound size={40} color={colors.textMuted} strokeWidth={2} />}
            <View style={styles.editBadge}><Pencil size={16} color={colors.white} strokeWidth={2} /></View>
          </Pressable>}
        </View>

        {submitError && currentStep !== 3 ? <View style={styles.submitErrorCard} accessibilityRole="alert"><CircleAlert size={20} color={colors.danger} strokeWidth={2} /><Text style={styles.submitErrorText}>{submitError}</Text></View> : null}

        <View style={styles.formSection}>
          {currentStep === 1 && <>
            <Input label={msg.nameSurname} placeholder={msg.nameSurnamePlaceholder} value={form.name} onChangeText={(name) => setForm({ ...form, name })} error={errors.name} />
            <Input label={msg.telephone} placeholder={msg.telephonePlaceholder} value={form.telephone} onChangeText={(telephone) => setForm({ ...form, telephone })} keyboardType="phone-pad" error={errors.telephone} />
            <Select label={msg.occupation} placeholder={msg.occupationPlaceholder} options={occupationOptions} value={form.occupation} onValueChange={(occupation) => setForm({ ...form, occupation })} error={errors.occupation} />
            {selectedOccupation?.requiresStudentId && <Input label={msg.studentId} placeholder={msg.studentIdPlaceholder} value={form.studentId} onChangeText={(studentId) => setForm({ ...form, studentId })} error={errors.studentId} />}
            <Select label={msg.faculty} placeholder={msg.facultyPlaceholder} options={facultyOptions} value={form.faculty} onValueChange={(faculty) => setForm({ ...form, faculty, department: '' })} error={errors.faculty} searchable searchPlaceholder={msg.searchFaculty} noResultsMessage={msg.noSearchResults} emptyMessage={msg.noSelectOptions} loadingMessage={msg.loadingOptions} clearSearchLabel={msg.clearSearch} closeLabel={msg.closeSelect} />
            <Select label={msg.department} placeholder={form.faculty ? msg.departmentPlaceholder : msg.departmentSelectFacultyFirst} options={departmentOptions} value={form.department} onValueChange={(department) => setForm({ ...form, department })} error={errors.department} searchable disabled={!form.faculty} searchPlaceholder={msg.searchDepartment} noResultsMessage={msg.noSearchResults} emptyMessage={msg.noSelectOptions} loadingMessage={msg.loadingOptions} clearSearchLabel={msg.clearSearch} closeLabel={msg.closeSelect} />
            <Text style={styles.termsLabel}>{msg.termsAndConditions}</Text>
            <ScrollView style={styles.termsBox} contentContainerStyle={styles.termsBoxContent} nestedScrollEnabled><Text style={styles.termsTitle}>{msg.privacyPolicy}</Text><Text style={styles.termsText}>{msg.privacyPolicyText}</Text></ScrollView>
            <Checkbox label={msg.acceptTerms} checked={form.acceptedTerms} onChange={(acceptedTerms) => setForm({ ...form, acceptedTerms })} error={errors.acceptedTerms} />
            <View style={styles.buttonRow}><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="outlined" label={msg.back} onPress={() => isEditMode ? router.back() : void authService.signOut().then(() => router.replace('/'))} style={{ width: buttonWidth }} /></Host></View><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="filled" label={msg.next} onPress={() => { if (validate()) setCurrentStep(2); }} style={{ width: buttonWidth }} /></Host></View></View>
          </>}

          {currentStep === 2 && <>
            <View style={styles.step2Card}><Text style={styles.step2CardTitle}>{msg.aboutYourself}</Text><Text style={styles.step2CardSubtitle}>{msg.aboutYourselfSub}</Text><TextArea label={msg.descriptionLabel} placeholder={msg.descriptionPlaceholder} value={form.description} onChangeText={(description) => setForm({ ...form, description })} maxLength={1000} /></View>
            <View style={styles.skipButtonContainer}><Pressable onPress={() => setCurrentStep(3)} style={styles.skipButton}><Text style={styles.skipButtonText}>{msg.skip}</Text></Pressable></View>
            <View style={styles.buttonRow}><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="outlined" label={msg.back} onPress={() => setCurrentStep(1)} style={{ width: buttonWidth }} /></Host></View><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="filled" label={msg.next} onPress={() => setCurrentStep(3)} style={{ width: buttonWidth }} /></Host></View></View>
          </>}

          {currentStep === 3 && <>
            <Text style={styles.sectionDesc}>{msg.step3Desc}</Text>
            <View style={styles.step3Section}><View style={styles.sectionHeader}><View style={styles.badgeSuccess}><Check size={12} color={colors.white} strokeWidth={2.5} /></View><Text style={styles.sectionTitle}>{msg.certification}</Text></View><Text style={styles.sectionDesc}>{msg.certDesc}</Text>
              {form.certificates.map((cert, index) => <View key={`cert-${cert.id ?? index}`} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemLabel}>{msg.certification}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${msg.removeItem} ${index + 1}`} onPress={() => removeCertificate(index)} style={styles.removeButton}>
                    <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={msg.addImage} style={[styles.imageUploadBox, styles.certificateImageBox]} onPress={() => void handlePickImage((uri) => handleUpdateCertificate(index, 'imageUri', uri), [4, 3])}>
                  {cert.imageUri ? <Image source={{ uri: cert.imageUri }} style={styles.uploadedImage} /> : <View style={styles.imagePlaceholderContent}><ImageIcon size={24} color={colors.textMuted} strokeWidth={2} /><Text style={styles.addImgText}>{msg.addImage}</Text></View>}
                </Pressable>
                <Input label={msg.certName} placeholder={msg.certName} value={cert.name} onChangeText={(value) => handleUpdateCertificate(index, 'name', value)} error={errors[`cert_${index}_name`]} />
                <Input label={msg.certIssuer} placeholder={msg.certIssuer} value={cert.issuer} onChangeText={(value) => handleUpdateCertificate(index, 'issuer', value)} error={errors[`cert_${index}_issuer`]} />
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>{msg.certIssuedAt}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={cert.issuedAt || msg.certIssuedAt} accessibilityState={{ expanded: datePickerTarget?.index === index }} style={[styles.dateInputBox, errors[`cert_${index}_issuedAt`] ? styles.dateInputError : null]} onPress={() => openDatePicker(index, cert.issuedAt)}>
                    <Text style={cert.issuedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{cert.issuedAt || 'YYYY-MM-DD'}</Text>
                    <CalendarDays size={18} color={colors.textMuted} strokeWidth={2} />
                  </Pressable>
                  {errors[`cert_${index}_issuedAt`] ? <Text style={styles.fieldErrorText}>{errors[`cert_${index}_issuedAt`]}</Text> : null}
                </View>
              </View>)}
              <Pressable style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, certificates: [...previous.certificates, createEmptyCertificate()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreCert}</Text></Pressable>
            </View>
            <View style={styles.step3Section}><Text style={styles.sectionTitleNormal}>{msg.experience}</Text>
              {form.experiences.map((experience, index) => <View key={`experience-${experience.id ?? index}`} style={styles.itemCard}>
                <View style={styles.itemCardHeader}><Text style={styles.itemLabel}>{msg.experience}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${msg.removeItem} ${index + 1}`} onPress={() => removeExperience(index)} style={styles.removeButton}><Trash2 size={18} color={colors.danger} strokeWidth={2} /></Pressable></View>
                <Input label={msg.jobTitle} placeholder={msg.jobTitle} value={experience.title} onChangeText={(value) => handleUpdateExperience(index, 'title', value)} error={errors[`experience_${index}_title`]} />
                <Select label={msg.employmentType} placeholder={msg.employmentTypePlaceholder} options={msg.employmentTypes} value={experience.employmentType} onValueChange={(value) => handleUpdateExperience(index, 'employmentType', value)} error={errors[`experience_${index}_employmentType`]} />
                <Input label={msg.organization} placeholder={msg.organization} value={experience.organization} onChangeText={(value) => handleUpdateExperience(index, 'organization', value)} />
                <TextArea label={msg.descriptionLabel} placeholder={msg.descriptionPlaceholder} value={experience.description} onChangeText={(value) => handleUpdateExperience(index, 'description', value)} maxLength={1000} />
                <View style={styles.dateInputWrapper}><Text style={styles.dateInputLabel}>{msg.startMonthYear}</Text><Pressable accessibilityRole="button" accessibilityLabel={formatMonthYear(experience.startedAt, locale) || msg.startMonthYear} style={[styles.dateInputBox, errors[`experience_${index}_startedAt`] ? styles.dateInputError : null]} onPress={() => openExperienceDatePicker(index, 'startedAt', experience.startedAt)}><Text style={experience.startedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{formatMonthYear(experience.startedAt, locale) || msg.startMonthYear}</Text><CalendarDays size={18} color={colors.textMuted} strokeWidth={2} /></Pressable>{errors[`experience_${index}_startedAt`] ? <Text style={styles.fieldErrorText}>{errors[`experience_${index}_startedAt`]}</Text> : null}</View>
                <View style={styles.dateInputWrapper}><Text style={styles.dateInputLabel}>{msg.endMonthYear}</Text><Pressable accessibilityRole="button" accessibilityLabel={formatMonthYear(experience.endedAt, locale) || msg.present} style={[styles.dateInputBox, errors[`experience_${index}_endedAt`] ? styles.dateInputError : null]} onPress={() => openExperienceDatePicker(index, 'endedAt', experience.endedAt)}><Text style={experience.endedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{formatMonthYear(experience.endedAt, locale) || msg.present}</Text><CalendarDays size={18} color={colors.textMuted} strokeWidth={2} /></Pressable>{experience.endedAt ? <Pressable accessibilityRole="button" accessibilityLabel={msg.present} onPress={() => handleUpdateExperience(index, 'endedAt', '')}><Text style={styles.addImgText}>{msg.present}</Text></Pressable> : null}{errors[`experience_${index}_endedAt`] ? <Text style={styles.fieldErrorText}>{errors[`experience_${index}_endedAt`]}</Text> : null}</View>
              </View>)}
              <Pressable style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, experiences: [...previous.experiences, createEmptyExperience()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreExp}</Text></Pressable>
            </View>
            <View style={styles.step3Section}><Text style={styles.sectionTitleNormal}>{msg.myWorks}</Text>
              {form.works.map((work, index) => <View key={`work-${work.id ?? index}`} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemLabel}>{msg.myWorks}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${msg.removeItem} ${index + 1}`} onPress={() => removeWork(index)} style={styles.removeButton}>
                    <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={msg.addImage} style={styles.imageUploadBox} onPress={() => void handlePickImage((uri) => handleUpdateWork(index, 'imageUri', uri), [4, 3])}>{work.imageUri ? <Image source={{ uri: work.imageUri }} style={styles.uploadedImage} /> : <View style={styles.imagePlaceholderContent}><ImageIcon size={24} color={colors.textMuted} strokeWidth={2} /><Text style={styles.addImgText}>{msg.addImage}</Text></View>}</Pressable><Input label="" accessibilityLabel={msg.workTitle} placeholder={msg.workTitle} value={work.title} onChangeText={(title) => handleUpdateWork(index, 'title', title)} error={errors[`work_${index}_title`]} /><TextArea label="" accessibilityLabel={msg.detailProject} placeholder={msg.detailProject} value={work.detail} onChangeText={(detail) => handleUpdateWork(index, 'detail', detail)} maxLength={1000} />
              </View>)}
              <Pressable style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, works: [...previous.works, createEmptyWork()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreWorks}</Text></Pressable>
            </View>
            {submitError && <View style={styles.submitErrorCard} accessibilityRole="alert"><CircleAlert size={20} color={colors.danger} strokeWidth={2} /><Text style={styles.submitErrorText}>{submitError}</Text></View>}
            <View style={styles.buttonRow}><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="outlined" label={msg.back} onPress={() => setCurrentStep(2)} style={{ width: buttonWidth }} disabled={isSubmitting} /></Host></View><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="filled" label={isSubmitting ? msg.submitting : submitError ? msg.retrySubmitBtn : isEditMode ? msg.saveChanges : msg.completeBtn} onPress={() => void handleComplete()} style={{ width: buttonWidth }} disabled={isSubmitting} /></Host></View></View>
          </>}
        </View>
      </ScrollView>
      {datePickerTarget ? <DateTimePicker value={new Date(datePickerTarget.value)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} maximumDate={today} /> : null}
      <FileTooLargeModal visible={isModalVisible} onBack={() => setModalVisible(false)} onTryAgain={() => { setModalVisible(false); retryAction?.(); }} />
    </SafeAreaView>
  );
}
