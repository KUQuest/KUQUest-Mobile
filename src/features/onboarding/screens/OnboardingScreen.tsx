import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Host, Button } from '@expo/ui';
import { MaterialIcons } from '@expo/vector-icons';
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
import type { Certificate, ProfileDraft, Work } from '../../profile/types';
import { authService } from '../../auth/AuthService';
import type { OnboardingStep } from '../../auth/types';
import type { AcademicRegistrationOptions } from '../../../api/contracts';
import { parseOnboardingStep } from '../steps';
import { validateProfileBasics, validateProfileDetails } from '../validation';

function createOnboardingForm(): ProfileDraft {
  return {
    ...createEmptyProfile(),
    certificates: [{ name: '', issuer: '', issuedAt: '', imageUri: '' }],
    works: [{ imageUri: '', title: '', detail: '' }],
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() ?? '', lastName: parts.join(' ') };
}

function isLocalAsset(uri: string): boolean {
  return Boolean(uri) && !/^https?:\/\//i.test(uri);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const msg = onboardingMessages[locale];
  const { mode, step } = useLocalSearchParams<{ mode?: string; step?: string | string[] }>();
  const isEditMode = mode === 'edit';
  const routeStep = parseOnboardingStep(step);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(routeStep);
  const [form, setForm] = useState<ProfileDraft>(createOnboardingForm);
  const [options, setOptions] = useState<AcademicRegistrationOptions | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const { width } = useWindowDimensions();
  const buttonWidth = (width - 96) / 2;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const session = await authService.getSession();
        if (!session) throw new Error('No active session');
        const api = await authService.getStudentApi();
        const [academicOptions, status, profile, certificates, portfolio] = await Promise.all([
          api.getAcademicRegistrationOptions(),
          api.getAcademicRegistrationStatus(),
          api.getProfile(),
          api.listCertificates(),
          api.listPortfolio(),
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
          });
        }
      } catch {
        if (active) setSubmitError(msg.submitErrorMsg || msg.loadingProfile);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [msg.loadingProfile, msg.submitErrorMsg]);

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
      const { firstName, lastName } = splitName(form.name);
      const occupationId = form.occupation;
      const departmentId = form.department;
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
        termsVersion: form.acceptedTerms ? termsVersion : undefined,
      });
      await api.updateProfile({
        firstName,
        lastName,
        ...(form.description.trim() ? { bio: form.description.trim() } : {}),
        telephone: form.telephone,
        departmentId,
      });

      if (isLocalAsset(form.profileImage)) {
        await api.uploadAvatar({ uri: form.profileImage });
      }

      for (const certificate of form.certificates.filter((item) => item.name || item.issuer || item.issuedAt)) {
        const certificateData = { name: certificate.name, issuer: certificate.issuer, issuedAt: certificate.issuedAt };
        const id = certificate.id
          ? (await api.updateCertificate(certificate.id, certificateData), certificate.id)
          : await api.createCertificate(certificateData);
        if (isLocalAsset(certificate.imageUri)) await api.uploadCertificateImage(id, { uri: certificate.imageUri });
      }

      for (const work of form.works.filter((item) => item.title || item.detail || item.imageUri)) {
        const id = work.id
          ? (await api.updatePortfolio(work.id, { title: work.title, description: work.detail }), work.id)
          : await api.createPortfolio({ title: work.title, description: work.detail, imageUris: [work.imageUri] });
        if (work.id && isLocalAsset(work.imageUri)) {
          await api.createPortfolio({ title: work.title, description: work.detail, imageUris: [work.imageUri] });
          await api.deletePortfolio(id);
        }
      }

      if (isEditMode) router.replace('/(tabs)/profile');
      else router.replace('/');
    } catch (error) {
      setSubmitError(error instanceof Error && error.message.includes('EXPO_PUBLIC_TERMS_VERSION')
        ? error.message
        : msg.submitErrorMsg || 'Failed to save data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async (onSelected: (uri: string) => void, aspect: [number, number]) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  if (isLoadingProfile) {
    return <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}><Text style={styles.loadingText}>{msg.loadingProfile}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.stepTitle}>{isEditMode ? msg.editProfile : currentStep === 1 ? msg.stepTitle : currentStep === 2 ? msg.step2Title : msg.step3Title}</Text>
          {!isEditMode && <Text style={styles.stepIndicator}>{currentStep === 1 ? msg.stepIndicator : currentStep === 2 ? msg.step2Indicator : msg.step3Indicator}</Text>}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarActive} />
            <View style={currentStep >= 2 ? styles.progressBarActive : styles.progressBarInactive} />
            <View style={currentStep >= 2 ? styles.progressBarActive : styles.progressBarInactive} />
            <View style={currentStep >= 3 ? styles.progressBarActive : styles.progressBarInactive} />
          </View>
          {currentStep === 1 && <Pressable style={styles.avatarPlaceholder} onPress={() => void handlePickImage((uri) => setForm((previous) => ({ ...previous, profileImage: uri })), [1, 1])}>
            {form.profileImage ? <Image source={{ uri: form.profileImage }} style={styles.avatarImage} /> : <MaterialIcons name="person" size={40} color={colors.textMuted} />}
            <View style={styles.editBadge}><MaterialIcons name="edit" size={16} color={colors.white} /></View>
          </Pressable>}
        </View>

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
            <View style={styles.step2Card}><Text style={styles.step2CardTitle}>{msg.aboutYourself}</Text><Text style={styles.step2CardSubtitle}>{msg.aboutYourselfSub}</Text><TextArea label={msg.descriptionLabel} placeholder={msg.descriptionPlaceholder} value={form.description} onChangeText={(description) => setForm({ ...form, description })} maxLength={500} /></View>
            <View style={styles.skipButtonContainer}><Pressable onPress={() => setCurrentStep(3)} style={styles.skipButton}><Text style={styles.skipButtonText}>{msg.skip}</Text></Pressable></View>
            <View style={styles.buttonRow}><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="outlined" label={msg.back} onPress={() => setCurrentStep(1)} style={{ width: buttonWidth }} /></Host></View><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="filled" label={msg.next} onPress={() => setCurrentStep(3)} style={{ width: buttonWidth }} /></Host></View></View>
          </>}

          {currentStep === 3 && <>
            <View style={styles.step3Section}><View style={styles.sectionHeader}><View style={styles.badgeSuccess}><MaterialIcons name="check" size={12} color={colors.white} /></View><Text style={styles.sectionTitle}>{msg.certification}</Text></View><Text style={styles.sectionDesc}>{msg.certDesc}</Text>
              {form.certificates.map((cert, index) => <View key={`cert-${cert.id ?? index}`} style={styles.itemCard}><Input label={msg.certName} placeholder={msg.certName} value={cert.name} onChangeText={(value) => handleUpdateCertificate(index, 'name', value)} error={errors[`cert_${index}_name`]} /><Input label={msg.certIssuer} placeholder={msg.certIssuer} value={cert.issuer} onChangeText={(value) => handleUpdateCertificate(index, 'issuer', value)} error={errors[`cert_${index}_issuer`]} /><Input label={msg.certIssuedAt} placeholder="YYYY-MM-DD" value={cert.issuedAt} onChangeText={(value) => handleUpdateCertificate(index, 'issuedAt', value)} error={errors[`cert_${index}_issuedAt`]} /></View>)}
              <Pressable style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, certificates: [...previous.certificates, { name: '', issuer: '', issuedAt: '', imageUri: '' }] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreCert}</Text></Pressable>
            </View>
            <View style={styles.step3Section}><Text style={styles.sectionTitleNormal}>{msg.myWorks}</Text>
              {form.works.map((work, index) => <View key={`work-${work.id ?? index}`} style={styles.itemCard}><Pressable style={styles.imageUploadBox} onPress={() => void handlePickImage((uri) => handleUpdateWork(index, 'imageUri', uri), [4, 3])}>{work.imageUri ? <Image source={{ uri: work.imageUri }} style={styles.uploadedImage} /> : <View style={styles.imagePlaceholderContent}><MaterialIcons name="image" size={24} color={colors.textMuted} /><Text style={styles.addImgText}>{msg.addImage}</Text></View>}</Pressable><Input label="" placeholder={msg.workTitle} value={work.title} onChangeText={(title) => handleUpdateWork(index, 'title', title)} error={errors[`work_${index}_title`]} /><TextArea label="" placeholder={msg.detailProject} value={work.detail} onChangeText={(detail) => handleUpdateWork(index, 'detail', detail)} maxLength={300} /></View>)}
              <Pressable style={styles.addMoreBtn} onPress={() => setForm((previous) => ({ ...previous, works: [...previous.works, { imageUri: '', title: '', detail: '' }] }))}><Text style={styles.addMoreBtnText}>{msg.addMoreWorks}</Text></Pressable>
            </View>
            {submitError && <View style={styles.submitErrorCard}><MaterialIcons name="error" size={20} color={colors.danger} /><Text style={styles.submitErrorText}>{submitError}</Text></View>}
            <View style={styles.buttonRow}><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="outlined" label={msg.back} onPress={() => setCurrentStep(2)} style={{ width: buttonWidth }} disabled={isSubmitting} /></Host></View><View style={styles.halfBtn}><Host seedColor={colors.primary} matchContents><Button variant="filled" label={isSubmitting ? msg.submitting : submitError ? msg.retrySubmitBtn : isEditMode ? msg.saveChanges : msg.completeBtn} onPress={() => void handleComplete()} style={{ width: buttonWidth }} disabled={isSubmitting} /></Host></View></View>
          </>}
        </View>
      </ScrollView>
      <FileTooLargeModal visible={isModalVisible} onBack={() => setModalVisible(false)} onTryAgain={() => { setModalVisible(false); retryAction?.(); }} />
    </SafeAreaView>
  );
}
