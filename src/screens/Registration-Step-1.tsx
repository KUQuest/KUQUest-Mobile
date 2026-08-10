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
} from '../components/Shared';

import { registrationMessages as translations } from '../locales/registrationMessages';

interface Step1Props {
  lang?: 'en' | 'th'
}

export default function Step1({ lang = 'th' }: Step1Props) {
  const t = translations[lang];

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
      setErrorMessage(t.errRequired);
      return;
    }

    if (formData.occupation === t.studentValue && !formData.studentId) {
      setErrorMessage(t.errStudentId);
      return;
    }

    if (!isAccepted) {
      setErrorMessage(t.errTerms);
      return;
    }
    console.log('Submitted Data:', formData);
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
          <RegistrationHeader title={t.headerTitle} />
          <Step step={1} lang={lang} />
          <StepProgress step={1} totalSteps={3} />
          <ProfileUpload />

          <FormInput
            label={t.fullNameLabel}
            value={formData.firstName}
            placeholder={t.fullNamePlaceholder}
            onChangeText={(text) => {
              setFormData({ ...formData, firstName: text });
              setErrorMessage('');
            }}
          />

          <FormInput
            label={t.phoneLabel}
            value={formData.phoneNumber}
            placeholder={t.phonePlaceholder}
            keyboardType="phone-pad"
            onChangeText={(text) => {
              setFormData({ ...formData, phoneNumber: text });
              setErrorMessage('');
            }}
          />

          <FormSelect
            label={t.occupationLabel}
            options={t.occupationOptions}
            placeholder={t.occupationPlaceholder}
            selectedValue={formData.occupation}
            onSelect={(value) => {
              setFormData({ ...formData, occupation: value });
              setErrorMessage('');
            }}
          />

          {formData.occupation === t.studentValue && (
            <FormInput
              label={t.studentIdLabel}
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
            label={t.facultyLabel}
            options={t.facultyOptions}
            placeholder={t.facultyPlaceholder}
            selectedValue={formData.faculty}
            onSelect={(value) => {
              setFormData({ ...formData, faculty: value });
              setErrorMessage('');
            }}
          />

          <FormInput
            label={t.departmentLabel}
            value={formData.department}
            placeholder={t.departmentPlaceholder}
            onChangeText={(text) => {
              setFormData({ ...formData, department: text });
              setErrorMessage('');
            }}
          />

          <TermsBox
            label={t.termsLabel}
            title={t.termsTitle}
            content={t.termsContent}
          />

          <Checkbox
            label={t.checkboxLabel}
            isChecked={isAccepted}
            onToggle={() => {
              setIsAccepted(!isAccepted);
              setErrorMessage('');
            }}
          />

          <StepActionButtons onBack={() => { console.log('ย้อนกลับ'); }} onNext={handleSubmit} lang={lang} />

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