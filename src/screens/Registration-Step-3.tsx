import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Host, Button } from '@expo/ui';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Checkbox } from '../components/Checkbox';
import { TextArea } from '../components/TextArea';
import { FileTooLargeModal } from '../components/FileTooLargeModal';
import { onboardingMessages, SupportedLocale } from '../locales/RegistrationMessages3';
import { useLocale } from '../locales/LocaleContext';
import { ProfileApi } from '../api/ProfileApi';
import { authService } from '../auth/AuthService';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const { mode } = useLocalSearchParams();
  const isEditMode = mode === 'edit';
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      ProfileApi.getProfile().then((data: any) => {
        setForm(data);
        setIsLoadingProfile(false);
      });
    }
  }, [isEditMode]);



  const { width } = useWindowDimensions();
  // Calculate button width: screen width - margins (32) - paddings (48) - gap (16) / 2
  const buttonWidth = (width - 96) / 2;

  const { locale, toggleLocale } = useLocale();
  const msg = onboardingMessages[locale];

  const [form, setForm] = useState({
    name: '',
    telephone: '',
    occupation: '',
    studentId: '',
    faculty: '',
    department: '',
    acceptedTerms: false,
    description: '',
    profileImage: '',
    certificates: [{ link: '', detail: '' }],
    experiences: [{ jobTitle: '', startDate: '', endDate: '', detail: '' }],
    works: [{ imageUri: '', title: '', detail: '' }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const [datePicker, setDatePicker] = useState<{ show: boolean, index: number, field: 'startDate' | 'endDate' }>({
    show: false,
    index: 0,
    field: 'startDate'
  });

  const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate) return '--/--/--';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoDate;
    }
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    const urlPattern = /^(https?:\/\/)?([\w\d\-_]+\.+[A-Za-z]{2,})+\/?/;

    form.certificates.forEach((cert, i) => {
      if (cert.link || cert.detail) {
        if (cert.link && !urlPattern.test(cert.link)) {
          newErrors[`cert_${i}_link`] = msg.invalidUrl || 'Invalid URL';
        }
      }
    });

    form.experiences.forEach((exp, i) => {
      if (exp.jobTitle || exp.startDate || exp.endDate || exp.detail) {
        if (!exp.jobTitle) newErrors[`exp_${i}_jobTitle`] = msg.requiredField || 'Required';
        if (!exp.startDate) newErrors[`exp_${i}_startDate`] = msg.requiredField || 'Required';
      }
    });

    form.works.forEach((work, i) => {
      if (work.title || work.imageUri || work.detail) {
        if (!work.title) newErrors[`work_${i}_title`] = msg.requiredField || 'Required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cleanForm = {
        ...form,
        certificates: form.certificates.filter(c => c.link || c.detail),
        experiences: form.experiences.filter(e => e.jobTitle || e.startDate || e.endDate || e.detail),
        works: form.works.filter(w => w.title || w.imageUri || w.detail),
      };

      if (isEditMode) {
        await ProfileApi.updateProfile(cleanForm);
        router.replace('/(tabs)/profile' as any);
      } else {
        await ProfileApi.saveOnboardingProfile(cleanForm);
        await authService.completeOnboarding();
        router.replace('/');
      }
    } catch (err) {
      console.error("Step 3 Submit Error:", err);
      setSubmitError(msg.submitErrorMsg || 'Failed to save data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCertificate = () => {
    setForm({ ...form, certificates: [...form.certificates, { link: '', detail: '' }] });
  };
  const handleUpdateCertificate = (index: number, field: string, value: string) => {
    const updated = [...form.certificates];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, certificates: updated });
  };

  const handleAddExperience = () => {
    setForm({ ...form, experiences: [...form.experiences, { jobTitle: '', startDate: '', endDate: '', detail: '' }] });
  };
  const handleUpdateExperience = (index: number, field: string, value: string) => {
    const updated = [...form.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, experiences: updated });
  };

  const handleAddWork = () => {
    setForm({ ...form, works: [...form.works, { imageUri: '', title: '', detail: '' }] });
  };
  const handleUpdateWork = (index: number, field: string, value: string) => {
    const updated = [...form.works];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, works: updated });
  };

  const handlePickWorkImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setRetryAction(() => () => handlePickWorkImage(index));
        setModalVisible(true);
      } else {
        handleUpdateWork(index, 'imageUri', asset.uri);
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setRetryAction(() => handlePickImage);
        setModalVisible(true);
      } else {
        setForm({ ...form, profileImage: asset.uri });
      }
    }
  };

  const handleToggleLocale = () => {
    toggleLocale();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = 'Required';
    if (!form.telephone) newErrors.telephone = 'Required';
    if (!form.occupation) newErrors.occupation = 'Required';

    if (form.occupation === 'Student' && !form.studentId) {
      newErrors.studentId = 'Required';
    }

    if (!form.faculty) newErrors.faculty = 'Required';
    if (!form.department) newErrors.department = 'Required';
    if (!isEditMode && !form.acceptedTerms) newErrors.acceptedTerms = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validate()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = async () => {
    if (isEditMode) {
      router.back();
      return;
    }
    await authService.signOut();
    router.replace('/');
  };

  const occupationOptions = [
    { label: msg.student, value: 'Student' },
    { label: msg.professor, value: 'Professor' },
  ];

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'NotoSansThai', color: '#014925' }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Language Toggle */}
        <Pressable
          style={styles.langToggle}
          onPress={handleToggleLocale}
          accessibilityRole="button"
        >
          <Text style={styles.langToggleText}>
            {locale === 'th' ? 'TH / EN' : 'EN / TH'}
          </Text>
        </Pressable>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.stepTitle}>
            {isEditMode ? msg.editProfile : (currentStep === 1 ? msg.stepTitle : currentStep === 2 ? msg.step2Title : msg.step3Title)}
          </Text>
          {!isEditMode && (
            <Text style={styles.stepIndicator}>
              {currentStep === 1 ? msg.stepIndicator : currentStep === 2 ? msg.step2Indicator : msg.step3Indicator}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressBarActive} />
            <View style={currentStep >= 2 ? styles.progressBarActive : styles.progressBarInactive} />
            <View style={styles.progressBarInactive} />
          </View>

          {currentStep === 1 && (
            <Pressable style={styles.avatarPlaceholder} onPress={handlePickImage}>
              {form.profileImage ? (
                <Image source={{ uri: form.profileImage }} style={styles.avatarImage} />
              ) : (
                <MaterialIcons name="person" size={40} color="#666666" />
              )}
              <View style={styles.editBadge}>
                <MaterialIcons name="edit" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {currentStep === 1 && (
            <>
              <Input
                label={msg.nameSurname}
                placeholder={msg.nameSurnamePlaceholder}
                value={form.name}
                onChangeText={(text: string) => setForm({ ...form, name: text })}
                error={errors.name}
              />

              <Input
                label={msg.telephone}
                placeholder={msg.telephonePlaceholder}
                value={form.telephone}
                onChangeText={(text: string) => setForm({ ...form, telephone: text })}
                keyboardType="phone-pad"
                error={errors.telephone}
              />

              <Select
                label={msg.occupation}
                placeholder={msg.occupationPlaceholder}
                options={occupationOptions}
                value={form.occupation}
                onValueChange={(val: string) => setForm({ ...form, occupation: val })}
                error={errors.occupation}
              />

              {form.occupation === 'Student' && (
                <Input
                  label={msg.studentId}
                  placeholder={msg.studentIdPlaceholder}
                  value={form.studentId}
                  onChangeText={(text: string) => setForm({ ...form, studentId: text })}
                  error={errors.studentId}
                />
              )}

              <Select
                label={msg.faculty}
                placeholder={msg.facultyPlaceholder}
                options={msg.faculties}
                value={form.faculty}
                onValueChange={(val: string) => setForm({ ...form, faculty: val })}
                error={errors.faculty}
              />

              <Input
                label={msg.department}
                placeholder={msg.departmentPlaceholder}
                value={form.department}
                onChangeText={(text: string) => setForm({ ...form, department: text })}
                error={errors.department}
              />

              {!isEditMode && (
                <>
                  <Text style={styles.termsLabel}>{msg.termsAndConditions}</Text>
                  <ScrollView style={styles.termsBox} contentContainerStyle={styles.termsBoxContent} nestedScrollEnabled={true}>
                    <Text style={styles.termsTitle}>{msg.privacyPolicy}</Text>
                    <Text style={styles.termsText}>{msg.privacyPolicyText}</Text>
                  </ScrollView>

                  <Checkbox
                    label={msg.acceptTerms}
                    checked={form.acceptedTerms}
                    onChange={(checked: boolean) => setForm({ ...form, acceptedTerms: checked })}
                    error={errors.acceptedTerms}
                  />
                </>
              )}

              <View style={styles.buttonRow}>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="outlined"
                      label={msg.back}
                      onPress={handleBack}
                      style={{ width: buttonWidth }}
                    />
                  </Host>
                </View>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="filled"
                      label={msg.next}
                      onPress={handleNext}
                      style={{ width: buttonWidth }}
                    />
                  </Host>
                </View>
              </View>
            </>
          )}

          {currentStep === 2 && (
            <>
              <View style={styles.step2Card}>
                <Text style={styles.step2CardTitle}>{msg.aboutYourself}</Text>
                <Text style={styles.step2CardSubtitle}>{msg.aboutYourselfSub}</Text>

                <TextArea
                  label={msg.descriptionLabel}
                  placeholder={msg.descriptionPlaceholder}
                  value={form.description}
                  onChangeText={(text: string) => setForm({ ...form, description: text })}
                  maxLength={500}
                />
              </View>

              <View style={styles.skipButtonContainer}>
                <Pressable onPress={() => handleNext()} style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>{msg.skip}</Text>
                </Pressable>
              </View>

              <View style={styles.buttonRow}>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="outlined"
                      label={msg.back}
                      onPress={() => setCurrentStep(1)}
                      style={{ width: buttonWidth }}
                    />
                  </Host>
                </View>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="filled"
                      label={msg.next}
                      onPress={handleNext}
                      style={{ width: buttonWidth }}
                    />
                  </Host>
                </View>
              </View>
            </>
          )}

          {currentStep === 3 && (
            <>
              {/* Certification Section */}
              <View style={styles.step3Section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.badgeSuccess}>
                    <MaterialIcons name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>{msg.certification}</Text>
                </View>
                <Text style={styles.sectionDesc}>{msg.certDesc}</Text>

                {form.certificates.map((cert, index) => (
                  <View key={`cert-${index}`} style={styles.itemCard}>
                    <Text style={styles.itemLabel}>{msg.certLink}</Text>
                    <View style={styles.importLinkBox}>
                      <MaterialIcons name="link" size={20} color="#666" />
                      <Input
                        label=""
                        placeholder={msg.importLink}
                        value={cert.link}
                        onChangeText={(val: string) => handleUpdateCertificate(index, 'link', val)}
                        style={styles.importLinkInput}
                        error={errors[`cert_${index}_link`]}
                      />
                    </View>
                    <TextArea
                      label=""
                      placeholder={msg.detailProject}
                      value={cert.detail}
                      onChangeText={(val: string) => handleUpdateCertificate(index, 'detail', val)}
                      maxLength={300}
                    />
                  </View>
                ))}

                <Pressable style={styles.addMoreBtn} onPress={handleAddCertificate}>
                  <Text style={styles.addMoreBtnText}>{msg.addMoreCert}</Text>
                </Pressable>
              </View>

              {/* Experience Section */}
              <View style={styles.step3Section}>
                <Text style={styles.sectionTitleNormal}>{msg.experience}</Text>

                {form.experiences.map((exp, index) => (
                  <View key={`exp-${index}`} style={styles.itemCard}>
                    <Input
                      label={msg.jobTitle}
                      placeholder={msg.jobTitle}
                      value={exp.jobTitle}
                      onChangeText={(val: string) => handleUpdateExperience(index, 'jobTitle', val)}
                      error={errors[`exp_${index}_jobTitle`]}
                    />

                    <View style={styles.dateRow}>
                      <Pressable
                        style={styles.dateInputWrapper}
                        onPress={() => setDatePicker({ show: true, index, field: 'startDate' })}
                      >
                        <Text style={styles.dateInputLabel}>{msg.startDate}</Text>
                        <View style={styles.dateInputBox}>
                          <Text style={exp.startDate ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>
                            {formatDateForDisplay(exp.startDate)}
                          </Text>
                          <MaterialIcons name="calendar-today" size={16} color="#666" />
                        </View>
                        {errors[`exp_${index}_startDate`] && (
                          <Text style={styles.fieldErrorText}>{errors[`exp_${index}_startDate`]}</Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.dateInputWrapper}
                        onPress={() => setDatePicker({ show: true, index, field: 'endDate' })}
                      >
                        <Text style={styles.dateInputLabel}>{msg.endDate}</Text>
                        <View style={styles.dateInputBox}>
                          <Text style={exp.endDate ? styles.dateInputTextActive : styles.dateInputTextPlaceholder}>
                            {formatDateForDisplay(exp.endDate)}
                          </Text>
                          <MaterialIcons name="calendar-today" size={16} color="#666" />
                        </View>
                      </Pressable>
                    </View>

                    <TextArea
                      label=""
                      placeholder={msg.detailProject}
                      value={exp.detail}
                      onChangeText={(val: string) => handleUpdateExperience(index, 'detail', val)}
                      maxLength={300}
                    />
                  </View>
                ))}

                <Pressable style={styles.addMoreBtn} onPress={handleAddExperience}>
                  <Text style={styles.addMoreBtnText}>{msg.addMoreExp}</Text>
                </Pressable>
              </View>

              {/* My Works Section */}
              <View style={styles.step3Section}>
                <Text style={styles.sectionTitleNormal}>{msg.myWorks}</Text>

                {form.works.map((work, index) => (
                  <View key={`work-${index}`} style={styles.itemCard}>
                    <Pressable style={styles.imageUploadBox} onPress={() => handlePickWorkImage(index)}>
                      {work.imageUri ? (
                        <Image source={{ uri: work.imageUri }} style={styles.uploadedImage} />
                      ) : (
                        <View style={styles.imagePlaceholderContent}>
                          <MaterialIcons name="image" size={24} color="#666" />
                          <Text style={styles.addImgText}>{msg.addImage}</Text>
                        </View>
                      )}
                    </Pressable>

                    <Input
                      label=""
                      placeholder={msg.workTitle}
                      value={work.title}
                      onChangeText={(val: string) => handleUpdateWork(index, 'title', val)}
                      error={errors[`work_${index}_title`]}
                    />
                    <TextArea
                      label=""
                      placeholder={msg.detailProject}
                      value={work.detail}
                      onChangeText={(val: string) => handleUpdateWork(index, 'detail', val)}
                      maxLength={300}
                    />
                  </View>
                ))}

                <Pressable style={styles.addMoreBtn} onPress={handleAddWork}>
                  <Text style={styles.addMoreBtnText}>{msg.addMoreWorks}</Text>
                </Pressable>
              </View>
              {submitError && (
                <View style={styles.submitErrorCard}>
                  <MaterialIcons name="error" size={20} color="#D32F2F" />
                  <Text style={styles.submitErrorText}>{submitError}</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="outlined"
                      label={msg.back}
                      onPress={() => setCurrentStep(2)}
                      style={{ width: buttonWidth }}
                      disabled={isSubmitting}
                    />
                  </Host>
                </View>
                <View style={styles.halfBtn}>
                  <Host seedColor="#014925" matchContents>
                    <Button
                      variant="filled"
                      label={isSubmitting ? msg.submitting : (submitError ? msg.retrySubmitBtn : (isEditMode ? msg.saveChanges : msg.completeBtn))}
                      onPress={handleComplete}
                      style={{ width: buttonWidth }}
                      disabled={isSubmitting}
                    />
                  </Host>
                </View>
              </View>
            </>
          )}

          {datePicker.show && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setDatePicker({ ...datePicker, show: false });
                if (selectedDate && event.type !== 'dismissed') {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  handleUpdateExperience(datePicker.index, datePicker.field, dateStr);
                }
              }}
            />
          )}
        </View>
      </ScrollView>
      <FileTooLargeModal
        visible={isModalVisible}
        onBack={() => setModalVisible(false)}
        onTryAgain={() => {
          setModalVisible(false);
          if (retryAction) retryAction();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2F0', // Slightly warm grey/pinkish background from the mockup
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    // Add shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  langToggle: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F4F1',
    borderWidth: 1,
    borderColor: '#D0E3D5',
    marginBottom: 16,
  },
  langToggleText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#014925',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  title: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 24,
    color: '#014925',
    letterSpacing: -0.5,
  },
  stepTitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 18,
    color: '#111111',
    marginTop: 16,
  },
  stepIndicator: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  progressBarActive: {
    height: 4,
    width: 40,
    backgroundColor: '#014925',
    borderRadius: 2,
  },
  progressBarInactive: {
    height: 4,
    width: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#4CAF50', // Brighter green to indicate editability
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  formSection: {
    width: '100%',
  },
  termsLabel: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#333333',
    marginBottom: 6,
  },
  termsBox: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    height: 120,
  },
  termsBoxContent: {
    padding: 12,
    paddingBottom: 24,
  },
  termsTitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#111111',
    marginBottom: 4,
  },
  termsText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  submitErrorCard: {
    backgroundColor: '#FDECEF',
    borderColor: '#F5C2C7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  submitErrorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#842029',
    flex: 1,
  },
  halfBtn: {
    flex: 1,
  },
  step2Card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Add shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  step2CardTitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 18,
    color: '#014925',
    marginBottom: 8,
  },
  step2CardSubtitle: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 18,
  },
  skipButtonContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  step3Section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeSuccess: {
    backgroundColor: '#95E3A0',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 18,
    color: '#111',
  },
  sectionTitleNormal: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#333',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionDesc: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemLabel: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 10,
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  importLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  importLinkInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 14,
    color: '#333',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  addMoreBtn: {
    borderWidth: 1,
    borderColor: '#014925',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addMoreBtnText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 14,
    color: '#014925',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldErrorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  dateInputTextActive: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#111',
  },
  dateInputTextPlaceholder: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#999',
  },
  imageUploadBox: {
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
  },
  imagePlaceholderContent: {
    alignItems: 'center',
  },
  addImgText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});