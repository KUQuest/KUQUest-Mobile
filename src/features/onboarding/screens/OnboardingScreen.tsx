import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Button } from '@/components/ui/Button';
import Animated, * as Reanimated from 'react-native-reanimated';
import { CalendarDays, CircleAlert, Image as ImageIcon, Pencil, Trash2, UserRound, X } from 'lucide-react-native';
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
import { parseOnboardingStep } from '../steps';
import { validateProfileBasics, validateProfileDetails } from '../validation';

function createOnboardingForm(): ProfileDraft {
  return {
    ...createEmptyProfile(),
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

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() ?? '', lastName: parts.join(' ') };
}

function isLocalAsset(uri: string): boolean {
  return Boolean(uri) && !/^https?:\/\//i.test(uri);
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

function formatDate(value: string, locale: 'en' | 'th'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}
function getOnboardingTransition(kind: 'in' | 'out', reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  const transition = kind === 'in' ? Reanimated.FadeIn : Reanimated.FadeOut;
  if (!transition || typeof transition.duration !== 'function') return undefined;
  return transition.duration(220);
}
const MotionView = Animated.createAnimatedComponent ? Animated.createAnimatedComponent(View) : Animated.View;

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function removeIndexedErrors(errors: Record<string, string>, prefix: string, removedIndex: number): Record<string, string> {
  const prefixWithSeparator = `${prefix}_`;
  return Object.entries(errors).reduce<Record<string, string>>((next, [key, value]) => {
    if (!key.startsWith(prefixWithSeparator)) {
      next[key] = value;
      return next;
    }

    const remainder = key.slice(prefixWithSeparator.length);
    const separatorIndex = remainder.indexOf('_');
    const itemIndex = Number.parseInt(remainder.slice(0, separatorIndex), 10);
    if (!Number.isInteger(itemIndex) || separatorIndex === -1) {
      next[key] = value;
      return next;
    }
    if (itemIndex < removedIndex) {
      next[key] = value;
    } else if (itemIndex > removedIndex) {
      next[`${prefix}_${itemIndex - 1}_${remainder.slice(separatorIndex + 1)}`] = value;
    }
    return next;
  }, {});
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
  const [isPolicyVisible, setPolicyVisible] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; value: string; kind: 'certificate' | 'experience'; field?: 'startedAt' | 'endedAt' } | null>(null);
  const [today] = useState(() => new Date());
  const persistedPortfolioImages = useRef(new Set<string>());
  const pendingPortfolioReplacements = useRef(new Map<string, { oldId: string; newId: string }>());
  const pendingCertificateDeletes = useRef(new Set<string>());
  const pendingPortfolioDeletes = useRef(new Set<string>());
  const pendingExperienceDeletes = useRef(new Set<string>());
  const reduceMotion = useReducedMotionPreference();
  const leaveRegistration = useCallback(() => {
    if (isEditMode) {
      router.back();
      return;
    }
    Alert.alert(msg.cancelRegistrationTitle, msg.cancelRegistrationMessage, [
      { text: msg.cancel, style: 'cancel' },
      { text: msg.cancelRegistration, style: 'destructive', onPress: () => void authService.signOut().then(() => router.replace('/')) },
    ]);
  }, [isEditMode, msg.cancel, msg.cancelRegistration, msg.cancelRegistrationMessage, msg.cancelRegistrationTitle, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoadingProfile || isSubmitting) return true;
      if (isEditMode) {
        router.back();
        return true;
      }
      if (currentStep > 1) {
        setCurrentStep((currentStep - 1) as OnboardingStep);
        return true;
      }
      leaveRegistration();
      return true;
    });
    return () => subscription.remove();
  }, [currentStep, isEditMode, isLoadingProfile, isSubmitting, leaveRegistration, router]);

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
        const departmentId = status.departmentId ?? profile.department?.id ?? '';
        const faculty = academicOptions.faculties.find((item) =>
          item.departments.some((department) => department.id === departmentId)
        );
        const name = [status.firstName || profile.firstName, status.lastName || profile.lastName]
          .filter(Boolean)
          .join(' ');

        if (active) {
          setOptions(academicOptions);
          setForm({
            name,
            telephone: status.telephone ?? profile.telephone ?? '',
            occupation: status.occupationId ?? '',
            studentId: status.studentId ?? profile.studentId ?? '',
            faculty: faculty?.id ?? '',
            department: departmentId,
            acceptedTerms: Boolean(status.termsAcceptedAt),
            description: profile.bio ?? '',
            profileImage: profile.avatar?.url ?? session.user.image ?? '',
            certificates: certificates.map((certificate) => ({
              id: certificate.id,
              name: certificate.name,
              issuer: certificate.issuer,
              issuedAt: certificate.issuedAt,
              imageUri: certificate.image?.url ?? '',
            })),
            works: portfolio.map((entry) => ({
              id: entry.id,
              title: entry.title,
              detail: entry.description ?? '',
              imageUri: entry.images[0]?.url ?? '',
            })),
            experiences: experiences.map((entry) => ({
              id: entry.id,
              title: entry.title,
              employmentType: entry.employmentType,
              organization: entry.organization ?? '',
              description: entry.description ?? '',
              startedAt: entry.startedAt,
              endedAt: entry.endedAt ?? '',
            })),
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
  const clearErrors = (...keys: string[]) => {
    setErrors((previous) => {
      let changed = false;
      const next = { ...previous };
      keys.forEach((key) => {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  };

  const clearRemovedItemErrors = (prefix: string, index: number) => {
    setErrors((previous) => removeIndexedErrors(previous, prefix, index));
  };

  const handleOccupationChange = (occupation: string) => {
    const requiresStudentId = options?.occupations.find((item) => item.id === occupation)?.requiresStudentId ?? false;
    setForm((previous) => ({
      ...previous,
      occupation,
      ...(requiresStudentId ? {} : { studentId: '' }),
    }));
    clearErrors('occupation', 'studentId');
  };

  const handleFacultyChange = (faculty: string) => {
    setForm((previous) => ({ ...previous, faculty, department: '' }));
    clearErrors('faculty', 'department');
  };

  const handleDepartmentChange = (department: string) => {
    setForm((previous) => ({ ...previous, department }));
    clearErrors('department');
  };


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
    onboardingDebug('save pressed', { currentStep, isEditMode, isSubmitting });
    if (!validateStep3()) return;
    onboardingDebug('save started', {
      isEditMode,
      certificateCount: form.certificates.filter((item) => item.name || item.issuer || item.issuedAt || item.imageUri).length,
      portfolioCount: form.works.filter((item) => item.title || item.detail || item.imageUri).length,
      experienceCount: form.experiences.filter((item) => item.title || item.employmentType || item.organization || item.description || item.startedAt || item.endedAt).length,
    });
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const session = await authService.getSession();
      if (!session) throw new Error('No active session');
      const api = await authService.getStudentApi();
      const { firstName, lastName } = splitName(form.name);
      const departmentId = form.department;
      if (!isEditMode) {
        const occupationId = form.occupation;
        if (!occupationId || !departmentId) throw new Error('Academic registration options are incomplete');
        const termsVersion = process.env.EXPO_PUBLIC_TERMS_VERSION;
        if (form.acceptedTerms && !termsVersion) throw new Error('EXPO_PUBLIC_TERMS_VERSION is required');
        await api.updateAcademicRegistration({
          firstName,
          lastName,
          telephone: form.telephone,
          occupationId,
          studentId: form.studentId || undefined,
          departmentId,
          termsVersion: form.acceptedTerms && termsVersion ? termsVersion : undefined,
        });
      }
      await api.updateProfile({
        firstName,
        lastName,
        ...(form.description.trim() ? { bio: form.description.trim() } : {}),
        telephone: form.telephone,
        ...(departmentId ? { departmentId } : {}),
      });

      if (isLocalAsset(form.profileImage)) {
        await api.uploadAvatar({ uri: form.profileImage });
      }

      for (const [index, certificate] of form.certificates.entries()) {
        if (!(certificate.name || certificate.issuer || certificate.issuedAt || certificate.imageUri)) continue;
        onboardingDebug('saving certificate', { index, hasId: Boolean(certificate.id), hasLocalImage: isLocalAsset(certificate.imageUri) });
        const certificateData = { name: certificate.name, issuer: certificate.issuer, issuedAt: certificate.issuedAt };
        const id = certificate.id
          ? (await api.updateCertificate(certificate.id, certificateData), certificate.id)
          : await api.createCertificate(certificateData);
        if (!certificate.id) {
          setForm((previous) => ({
            ...previous,
            certificates: previous.certificates.map((item, itemIndex) => itemIndex === index ? { ...item, id } : item),
          }));
        }
        if (isLocalAsset(certificate.imageUri)) await api.uploadCertificateImage(id, { uri: certificate.imageUri });
      }

      for (const [index, work] of form.works.entries()) {
        if (!(work.title || work.detail || work.imageUri)) continue;
        onboardingDebug('saving portfolio item', { index, hasId: Boolean(work.id), hasLocalImage: isLocalAsset(work.imageUri), titleLength: work.title.length, detailLength: work.detail.length });
        let id = work.id;
        const pendingReplacement = isLocalAsset(work.imageUri)
          ? pendingPortfolioReplacements.current.get(work.imageUri)
          : undefined;
        if (pendingReplacement) {
          await api.deletePortfolio(pendingReplacement.oldId);
          pendingPortfolioReplacements.current.delete(work.imageUri);
          persistedPortfolioImages.current.add(work.imageUri);
          id = pendingReplacement.newId;
        }
        const hasNewImage = isLocalAsset(work.imageUri) && !persistedPortfolioImages.current.has(work.imageUri);
        if (!pendingReplacement && id && hasNewImage) {
          const replacementId = await api.createPortfolio({ title: work.title.trim(), description: work.detail.trim() || undefined, imageUris: [work.imageUri] });
          pendingPortfolioReplacements.current.set(work.imageUri, { oldId: id, newId: replacementId });
          id = replacementId;
          setForm((previous) => ({
            ...previous,
            works: previous.works.map((item, itemIndex) => itemIndex === index ? { ...item, id: replacementId } : item),
          }));
          await api.deletePortfolio(work.id ?? '');
          pendingPortfolioReplacements.current.delete(work.imageUri);
          persistedPortfolioImages.current.add(work.imageUri);
        } else if (id) {
          await api.updatePortfolio(id, { title: work.title.trim(), ...(work.detail.trim() ? { description: work.detail.trim() } : {}) });
        } else {
          id = await api.createPortfolio({ title: work.title.trim(), description: work.detail.trim() || undefined, imageUris: work.imageUri ? [work.imageUri] : [] });
          if (isLocalAsset(work.imageUri)) persistedPortfolioImages.current.add(work.imageUri);
        }
        if (id && (!work.id || id !== work.id)) {
          setForm((previous) => ({
            ...previous,
            works: previous.works.map((item, itemIndex) => itemIndex === index ? { ...item, id } : item),
          }));
        }
      }

      for (const [index, experience] of form.experiences.entries()) {
        if (!(experience.title || experience.employmentType || experience.organization || experience.description || experience.startedAt || experience.endedAt)) continue;
        const experienceData = {
          title: experience.title.trim(),
          employmentType: experience.employmentType.trim(),
          ...(experience.organization.trim() ? { organization: experience.organization.trim() } : {}),
          ...(experience.description.trim() ? { description: experience.description.trim() } : {}),
          startedAt: experience.startedAt,
          endedAt: experience.endedAt.trim() || null,
        };
        const saved = experience.id
          ? await api.updateExperience(experience.id, experienceData)
          : await api.createExperience(experienceData);
        if (!experience.id && saved?.id) {
          setForm((previous) => ({
            ...previous,
            experiences: previous.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, id: saved.id } : item),
          }));
        }
      }

      for (const id of pendingCertificateDeletes.current) {
        await api.deleteCertificate(id);
        pendingCertificateDeletes.current.delete(id);
      }
      for (const id of pendingPortfolioDeletes.current) {
        await api.deletePortfolio(id);
        pendingPortfolioDeletes.current.delete(id);
      }
      for (const id of pendingExperienceDeletes.current) {
        await api.deleteExperience(id);
        pendingExperienceDeletes.current.delete(id);
      }

      if (isEditMode) router.replace('/(tabs)/profile');
      else router.replace('/');
    } catch (error) {
      onboardingDebug('edit save failed', { error: error instanceof Error ? { name: error.name, message: error.message } : String(error) });
      if (error instanceof AuthError && error.code === 'SESSION_EXPIRED') {
        await authService.signOut().catch(() => undefined);
        router.replace('/');
        return;
      }
      setSubmitError(error instanceof Error && error.message.includes('EXPO_PUBLIC_TERMS_VERSION')
        ? error.message
        : msg.submitErrorMsg || 'Failed to save data. Please try again.');
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

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (!datePickerTarget) {
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
    clearErrors(`cert_${index}_${String(field)}`);
  };
  const handleUpdateWork = (index: number, field: keyof Work, value: string) => {
    setForm((previous) => ({
      ...previous,
      works: previous.works.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
    clearErrors(`work_${index}_${String(field)}`);
  };
  const handleUpdateExperience = (index: number, field: keyof Experience, value: string) => {
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
    clearErrors(`experience_${index}_${String(field)}`);
  };

  const removeExperienceNow = (index: number) => {
    const experience = form.experiences[index];
    if (experience?.id) pendingExperienceDeletes.current.add(experience.id);
    clearRemovedItemErrors('experience', index);
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.filter((_, itemIndex) => itemIndex !== index),
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

  const removeCertificate = (index: number) => {
    const certificate = form.certificates[index];
    try {
      if (certificate?.id) {
        pendingCertificateDeletes.current.add(certificate.id);
      }
      clearRemovedItemErrors('cert', index);
      setForm((previous) => ({
        ...previous,
        certificates: previous.certificates.filter((_, itemIndex) => itemIndex !== index),
      }));
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  const removeWork = (index: number) => {
    const work = form.works[index];
    try {
      if (work?.id) {
        pendingPortfolioDeletes.current.add(work.id);
      }
      clearRemovedItemErrors('work', index);
      setForm((previous) => ({
        ...previous,
        works: previous.works.filter((_, itemIndex) => itemIndex !== index),
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.stepTitle}>{isEditMode ? msg.editProfile : currentStep === 1 ? msg.stepTitle : currentStep === 2 ? msg.step2Title : msg.step3Title}</Text>
          <Text style={styles.stepIndicator}>{currentStep === 1 ? msg.stepIndicator : currentStep === 2 ? msg.step2Indicator : msg.step3Indicator}</Text>
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

        <MotionView
          key={`step-content-${currentStep}`}
          entering={getOnboardingTransition('in', reduceMotion)}
          style={styles.formSection}
        >
          {currentStep === 1 && <>
            <Input
              label={msg.nameSurname}
              placeholder={msg.nameSurnamePlaceholder}
              value={form.name}
              onChangeText={(name) => {
                setForm((previous) => ({ ...previous, name }));
                clearErrors('name');
              }}
              error={errors.name}
            />
            <Input
              label={msg.telephone}
              placeholder={msg.telephonePlaceholder}
              value={form.telephone}
              onChangeText={(telephone) => {
                setForm((previous) => ({ ...previous, telephone }));
                clearErrors('telephone');
              }}
              keyboardType="phone-pad"
              error={errors.telephone}
            />
            <Select
              label={msg.occupation}
              placeholder={msg.occupationPlaceholder}
              options={occupationOptions}
              value={form.occupation}
              onValueChange={handleOccupationChange}
              error={errors.occupation}
              closeLabel={msg.closeSelect}
            />
            {selectedOccupation?.requiresStudentId && <Input
              label={msg.studentId}
              placeholder={msg.studentIdPlaceholder}
              value={form.studentId}
              onChangeText={(studentId) => {
                setForm((previous) => ({ ...previous, studentId }));
                clearErrors('studentId');
              }}
              error={errors.studentId}
            />}
            <Select
              label={msg.faculty}
              placeholder={msg.facultyPlaceholder}
              options={facultyOptions}
              value={form.faculty}
              onValueChange={handleFacultyChange}
              error={errors.faculty}
              searchable
              searchPlaceholder={msg.searchFaculty}
              noResultsMessage={msg.noSearchResults}
              emptyMessage={msg.noSelectOptions}
              loadingMessage={msg.loadingOptions}
              clearSearchLabel={msg.clearSearch}
              closeLabel={msg.closeSelect}
            />
            <Select
              label={msg.department}
              placeholder={form.faculty ? msg.departmentPlaceholder : msg.departmentSelectFacultyFirst}
              options={departmentOptions}
              value={form.department}
              onValueChange={handleDepartmentChange}
              error={errors.department}
              searchable
              disabled={!form.faculty}
              searchPlaceholder={msg.searchDepartment}
              noResultsMessage={msg.noSearchResults}
              emptyMessage={msg.noSelectOptions}
              loadingMessage={msg.loadingOptions}
              clearSearchLabel={msg.clearSearch}
              closeLabel={msg.closeSelect}
            />
            <Text style={styles.termsLabel}>{msg.termsAndConditions}</Text>
            <View style={styles.policySummary}>
              <Text style={styles.policySummaryTitle}>{msg.privacyPolicy}</Text>
              <Text style={styles.policySummaryText}>{msg.privacySummary}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg.readFullPolicy}
                style={styles.policyReadAction}
                onPress={() => setPolicyVisible(true)}
              >
                <Text style={styles.policyReadActionText}>{msg.readFullPolicy}</Text>
              </Pressable>
            </View>
            <Checkbox
              label={msg.acceptTerms}
              checked={form.acceptedTerms}
              onChange={(acceptedTerms) => {
                setForm((previous) => ({ ...previous, acceptedTerms }));
                clearErrors('acceptedTerms');
              }}
              error={errors.acceptedTerms}
            />
          </>}

          {currentStep === 2 && <>
            <View style={styles.step2Intro}>
              <Text style={styles.step2CardTitle}>{msg.aboutYourself}</Text>
              <Text style={styles.step2CardSubtitle}>{msg.aboutYourselfSub}</Text>
            </View>
            <TextArea
              label={msg.descriptionLabel}
              placeholder={msg.descriptionPlaceholder}
              value={form.description}
              onChangeText={(description) => {
                setForm((previous) => ({ ...previous, description }));
                clearErrors('description');
              }}
              maxLength={1000}
            />
          </>}

          {currentStep === 3 && <>
            <Text style={styles.sectionDesc}>{msg.step3Desc}</Text>
            <View style={styles.step3Section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{msg.certification}</Text>
              </View>
              <Text style={styles.sectionDesc}>{msg.certDesc}</Text>
              {form.certificates.map((cert, index) => <MotionView
                key={`cert-${cert.id ?? index}`}
                entering={getOnboardingTransition('in', reduceMotion)}
                exiting={getOnboardingTransition('out', reduceMotion)}
                style={styles.itemCard}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemLabel}>{msg.certification}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={msg.removeCertificate(index + 1)}
                    onPress={() => removeCertificate(index)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={msg.addImage}
                  style={[styles.imageUploadBox, styles.certificateImageBox]}
                  onPress={() => void handlePickImage((uri) => handleUpdateCertificate(index, 'imageUri', uri), [4, 3])}
                >
                  {cert.imageUri ? <Image source={{ uri: cert.imageUri }} style={styles.uploadedImage} /> : <View style={styles.imagePlaceholderContent}><ImageIcon size={24} color={colors.textMuted} strokeWidth={2} /><Text style={styles.addImgText}>{msg.addImage}</Text></View>}
                </Pressable>
                <Input label={msg.certName} placeholder={msg.certName} value={cert.name} onChangeText={(value) => handleUpdateCertificate(index, 'name', value)} error={errors[`cert_${index}_name`]} />
                <Input label={msg.certIssuer} placeholder={msg.certIssuer} value={cert.issuer} onChangeText={(value) => handleUpdateCertificate(index, 'issuer', value)} error={errors[`cert_${index}_issuer`]} />
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>{msg.certIssuedAt}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${msg.certIssuedAt}: ${formatDate(cert.issuedAt, locale) || msg.selectDate}`}
                    accessibilityState={{ expanded: datePickerTarget?.index === index }}
                    style={[styles.dateInputBox, errors[`cert_${index}_issuedAt`] ? styles.dateInputError : null]}
                    onPress={() => openDatePicker(index, cert.issuedAt)}
                  >
                    <Text style={cert.issuedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{formatDate(cert.issuedAt, locale) || msg.selectDate}</Text>
                    <CalendarDays size={18} color={colors.textMuted} strokeWidth={2} />
                  </Pressable>
                  {errors[`cert_${index}_issuedAt`] ? <Text style={styles.fieldErrorText}>{errors[`cert_${index}_issuedAt`]}</Text> : null}
                </View>
              </MotionView>)}
              {form.certificates.length === 0 ? <View style={styles.emptySection}><Text style={styles.emptySectionText}>{msg.optionalEmpty}</Text></View> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={msg.addMoreCert} style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, certificates: [...previous.certificates, createEmptyCertificate()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreCert}</Text></Pressable>
            </View>
            <View style={styles.step3Section}>
              <Text style={styles.sectionTitleNormal}>{msg.experience}</Text>
              {form.experiences.map((experience, index) => <MotionView
                key={`experience-${experience.id ?? index}`}
                entering={getOnboardingTransition('in', reduceMotion)}
                exiting={getOnboardingTransition('out', reduceMotion)}
                style={styles.itemCard}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemLabel}>{msg.experience}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={msg.removeExperience(index + 1)} onPress={() => removeExperience(index)} style={styles.removeButton}>
                    <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                  </Pressable>
                </View>
                <Input label={msg.jobTitle} placeholder={msg.jobTitle} value={experience.title} onChangeText={(value) => handleUpdateExperience(index, 'title', value)} error={errors[`experience_${index}_title`]} />
                <Select label={msg.employmentType} placeholder={msg.employmentTypePlaceholder} options={msg.employmentTypes} value={experience.employmentType} onValueChange={(value) => handleUpdateExperience(index, 'employmentType', value)} error={errors[`experience_${index}_employmentType`]} closeLabel={msg.closeSelect} />
                <Input label={msg.organization} placeholder={msg.organization} value={experience.organization} onChangeText={(value) => handleUpdateExperience(index, 'organization', value)} />
                <TextArea label={msg.experienceDescriptionLabel} placeholder={msg.experienceDescriptionPlaceholder} value={experience.description} onChangeText={(value) => handleUpdateExperience(index, 'description', value)} maxLength={1000} />
                <View style={styles.dateInputWrapper}><Text style={styles.dateInputLabel}>{msg.startMonthYear}</Text><Pressable accessibilityRole="button" accessibilityLabel={formatMonthYear(experience.startedAt, locale) || msg.startMonthYear} style={[styles.dateInputBox, errors[`experience_${index}_startedAt`] ? styles.dateInputError : null]} onPress={() => openExperienceDatePicker(index, 'startedAt', experience.startedAt)}><Text style={experience.startedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{formatMonthYear(experience.startedAt, locale) || msg.startMonthYear}</Text><CalendarDays size={18} color={colors.textMuted} strokeWidth={2} /></Pressable>{errors[`experience_${index}_startedAt`] ? <Text style={styles.fieldErrorText}>{errors[`experience_${index}_startedAt`]}</Text> : null}</View>
                <View style={styles.dateInputWrapper}><Text style={styles.dateInputLabel}>{msg.endMonthYear}</Text><Pressable accessibilityRole="button" accessibilityLabel={formatMonthYear(experience.endedAt, locale) || msg.present} style={[styles.dateInputBox, errors[`experience_${index}_endedAt`] ? styles.dateInputError : null]} onPress={() => openExperienceDatePicker(index, 'endedAt', experience.endedAt)}><Text style={experience.endedAt ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>{formatMonthYear(experience.endedAt, locale) || msg.present}</Text><CalendarDays size={18} color={colors.textMuted} strokeWidth={2} /></Pressable>{experience.endedAt ? <Pressable accessibilityRole="button" accessibilityLabel={msg.present} onPress={() => handleUpdateExperience(index, 'endedAt', '')}><Text style={styles.addImgText}>{msg.present}</Text></Pressable> : null}{errors[`experience_${index}_endedAt`] ? <Text style={styles.fieldErrorText}>{errors[`experience_${index}_endedAt`]}</Text> : null}</View>
              </MotionView>)}
              {form.experiences.length === 0 ? <View style={styles.emptySection}><Text style={styles.emptySectionText}>{msg.optionalEmpty}</Text></View> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={msg.addMoreExp} style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, experiences: [...previous.experiences, createEmptyExperience()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreExp}</Text></Pressable>
            </View>
            <View style={styles.step3Section}>
              <Text style={styles.sectionTitleNormal}>{msg.myWorks}</Text>
              {form.works.map((work, index) => <MotionView
                key={`work-${work.id ?? index}`}
                entering={getOnboardingTransition('in', reduceMotion)}
                exiting={getOnboardingTransition('out', reduceMotion)}
                style={styles.itemCard}
              >
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemLabel}>{msg.myWorks}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={msg.removeWork(index + 1)} onPress={() => removeWork(index)} style={styles.removeButton}>
                    <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={msg.addImage} style={styles.imageUploadBox} onPress={() => void handlePickImage((uri) => handleUpdateWork(index, 'imageUri', uri), [4, 3])}>{work.imageUri ? <Image source={{ uri: work.imageUri }} style={styles.uploadedImage} /> : <View style={styles.imagePlaceholderContent}><ImageIcon size={24} color={colors.textMuted} strokeWidth={2} /><Text style={styles.addImgText}>{msg.addImage}</Text></View>}</Pressable>
                <Input label={msg.workTitle} placeholder={msg.workTitle} value={work.title} onChangeText={(title) => handleUpdateWork(index, 'title', title)} error={errors[`work_${index}_title`]} />
                <TextArea label={msg.workDetailLabel} accessibilityLabel={msg.workDetailLabel} placeholder={msg.detailProject} value={work.detail} onChangeText={(detail) => handleUpdateWork(index, 'detail', detail)} maxLength={1000} />
              </MotionView>)}
              {form.works.length === 0 ? <View style={styles.emptySection}><Text style={styles.emptySectionText}>{msg.optionalEmpty}</Text></View> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={msg.addMoreWorks} style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, works: [...previous.works, createEmptyWork()] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreWorks}</Text></Pressable>
            </View>
            {submitError && <View style={styles.submitErrorCard} accessibilityRole="alert"><CircleAlert size={20} color={colors.danger} strokeWidth={2} /><Text style={styles.submitErrorText}>{submitError}</Text></View>}
          </>}
        </MotionView>
      </ScrollView>
      <View style={styles.actionBar}>
        {isSubmitting ? <Text accessibilityLiveRegion="polite" style={styles.savingStatus}>{msg.savingStatus}</Text> : null}
        <View style={styles.actionButtons}>
          <View style={styles.actionButton}>
            <Button
              variant="secondary"
              accessibilityLabel={currentStep === 1 && !isEditMode ? msg.cancelRegistration : msg.back}
              onPress={() => {
                if (currentStep === 1) {
                  leaveRegistration();
                } else {
                  setCurrentStep((stepValue) => (stepValue - 1) as OnboardingStep);
                }
              }}
              disabled={isSubmitting}
            >
              {currentStep === 1 && !isEditMode ? msg.cancelRegistration : msg.back}
            </Button>
          </View>
          <View style={styles.actionButton}>
            <Button
              accessibilityLabel={currentStep === 1 || currentStep === 2 ? msg.next : isSubmitting ? msg.submitting : submitError ? msg.retrySubmitBtn : isEditMode ? msg.saveChanges : msg.completeBtn}
              onPress={() => {
                if (currentStep === 1) {
                  if (validate()) setCurrentStep(2);
                } else if (currentStep === 2) {
                  setCurrentStep(3);
                } else {
                  void handleComplete();
                }
              }}
              disabled={isSubmitting}
            >
              {currentStep === 1 || currentStep === 2 ? msg.next : isSubmitting ? msg.submitting : submitError ? msg.retrySubmitBtn : isEditMode ? msg.saveChanges : msg.completeBtn}
            </Button>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
      {datePickerTarget ? <DateTimePicker value={new Date(datePickerTarget.value)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={handleDateChange} onDismiss={() => setDatePickerTarget(null)} maximumDate={today} /> : null}
      <FileTooLargeModal visible={isModalVisible} onBack={() => setModalVisible(false)} onTryAgain={() => { setModalVisible(false); retryAction?.(); }} />
      <Modal visible={isPolicyVisible} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setPolicyVisible(false)}>
        <View style={styles.policyModalOverlay}>
          <View accessibilityViewIsModal style={styles.policyModalContent}>
            <View style={styles.policyModalHeader}>
              <Text accessibilityRole="header" style={styles.policyModalTitle}>{msg.privacyPolicy}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={msg.closePolicy} style={styles.policyModalClose} onPress={() => setPolicyVisible(false)}>
                <X color={colors.textSecondary} size={22} strokeWidth={2} />
              </Pressable>
            </View>
            <ScrollView style={styles.policyModalScroll} contentContainerStyle={styles.policyModalScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.policyModalText}>{msg.privacyPolicyText}</Text>
            </ScrollView>
            <View style={styles.policyModalFooter}>
              <Button onPress={() => setPolicyVisible(false)} accessibilityLabel={msg.closePolicy}>{msg.closePolicy}</Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
