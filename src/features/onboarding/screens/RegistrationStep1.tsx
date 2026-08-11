import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StepActionButtons,
  RegistrationHeader,
  Step,
  StepProgress,
  ProfileUpload,
  FormInput,
  FormSelect,
  TermsBox,
  Checkbox
} from '../../../components/ui/AppPrimitives';

import { onboardingMessages as translations } from '../../../locales/registrationOnboarding';
import { useLocale } from '../../../locales/LocaleProvider';

export default function Step1() {
  const { locale } = useLocale();
  const t = translations[locale];

  const [isAccepted, setIsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '',
    occupation: '',
    studentId: '',
    faculty: '',
    department: '',
  });

  const handleSubmit = () => {
    setErrorMessage('');

    if (!formData.firstName || !formData.phoneNumber || !formData.occupation || !formData.faculty || !formData.department) {
      setErrorMessage(t.requiredError);
      return;
    }

    if (formData.occupation === 'Student' && !formData.studentId) {
      setErrorMessage(t.studentIdError);
      return;
    }

    if (!isAccepted) {
      setErrorMessage(t.termsError);
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <RegistrationHeader title={t.title} />
          <Step step={1} lang={locale} />
          <StepProgress step={1} totalSteps={3} />
          <ProfileUpload />

          <FormInput
            label={t.nameSurname}
            value={formData.firstName}
            placeholder={t.nameSurnamePlaceholder}
            onChangeText={(text) => {
              setFormData({ ...formData, firstName: text });
              setErrorMessage('');
            }}
          />

          <FormInput
            label={t.telephone}
            value={formData.phoneNumber}
            placeholder={t.telephonePlaceholder}
            keyboardType="phone-pad"
            onChangeText={(text) => {
              setFormData({ ...formData, phoneNumber: text });
              setErrorMessage('');
            }}
          />

          <FormSelect
            label={t.occupation}
            options={[t.student, t.professor]}
            placeholder={t.occupationPlaceholder}
            selectedValue={formData.occupation}
            onSelect={(value) => {
              setFormData({ ...formData, occupation: value });
              setErrorMessage('');
            }}
          />

          {formData.occupation === 'Student' && (
            <FormInput
              label={t.studentId}
              value={formData.studentId}
              placeholder={t.studentIdPlaceholder}
              keyboardType="numeric"
              onChangeText={(text) => {
                setFormData({ ...formData, studentId: text });
                setErrorMessage('');
              }}
            />
          )}

          <FormSelect
            label={t.faculty}
            options={t.faculties.map((faculty) => faculty.label)}
            placeholder={t.facultyPlaceholder}
            selectedValue={formData.faculty}
            onSelect={(value) => {
              setFormData({ ...formData, faculty: value });
              setErrorMessage('');
            }}
          />

          <FormInput
            label={t.department}
            value={formData.department}
            placeholder={t.departmentPlaceholder}
            onChangeText={(text) => {
              setFormData({ ...formData, department: text });
              setErrorMessage('');
            }}
          />

          <TermsBox
            label={t.termsAndConditions}
            title={t.privacyPolicy}
            content={t.privacyPolicyText}
          />

          <Checkbox
            label={t.acceptTerms}
            isChecked={isAccepted}
            onToggle={() => {
              setIsAccepted(!isAccepted);
              setErrorMessage('');
            }}
          />

          <StepActionButtons onBack={() => undefined} onNext={handleSubmit} lang={locale} />

          {errorMessage !== '' && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 12,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    alignSelf: 'flex-start',
    fontFamily: 'font42dotSans_600SemiBold',
  },
});
