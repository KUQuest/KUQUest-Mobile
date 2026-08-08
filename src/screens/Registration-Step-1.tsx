import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
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

const translations = {
  en: {
    errRequired: '* Please fill in all required fields',
    errStudentId: '* Please enter your student ID',
    errTerms: '* Please accept the Terms and Conditions before proceeding',
    headerTitle: 'Academic Registration',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'Enter your phone number',
    occupationLabel: 'Occupation',
    occupationOptions: ['Student', 'Teacher'],
    occupationPlaceholder: 'Select your occupation',
    studentValue: 'Student',
    studentIdLabel: 'Student ID',
    studentIdPlaceholder: '67xxxxxxxx',
    facultyLabel: 'Faculty',
    facultyOptions: ['Engineering', 'Business'],
    facultyPlaceholder: 'Select your faculty',
    departmentLabel: 'Department',
    departmentPlaceholder: 'Enter your department',
    termsLabel: 'Terms and Conditions',
    termsTitle: 'Privacy Policy',
    termsContent: 'Privacy Policy We value your privacy. This policy explains how we collect, use, and protect your personal data in accordance with academic standards and data protection regulations. Your information is used solely for academic registration and institutional communication.',
    checkboxLabel: 'I accept the Terms and Conditions',
  },
  th: {
    errRequired: '* กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
    errStudentId: '* กรุณากรอกรหัสนิสิต/นักศึกษา',
    errTerms: '* กรุณายอมรับข้อตกลงและเงื่อนไขก่อนดำเนินการต่อ',
    headerTitle: 'ลงทะเบียนข้อมูลทางการศึกษา',
    fullNameLabel: 'ชื่อ-นามสกุล',
    fullNamePlaceholder: 'กรอกชื่อ-นามสกุล',
    phoneLabel: 'เบอร์โทรศัพท์',
    phonePlaceholder: '08X-XXX-XXXX',
    occupationLabel: 'อาชีพ',
    occupationOptions: ['นักเรียน', 'อาจารย์'],
    occupationPlaceholder: 'เลือกอาชีพ',
    studentValue: 'นักเรียน',
    studentIdLabel: 'รหัสนิสิต/นักศึกษา',
    studentIdPlaceholder: '67XXXXXXXX',
    facultyLabel: 'คณะ',
    facultyOptions: ['วิศวกรรมศาสตร์', 'บริหารธุรกิจ'],
    facultyPlaceholder: 'เลือกคณะ',
    departmentLabel: 'สาขา',
    departmentPlaceholder: 'กรอกสาขา',
    termsLabel: 'ข้อกำหนดและเงื่อนไข',
    termsTitle: 'นโยบายความเป็นส่วนตัว',
    termsContent: 'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายถึงวิธีการที่เรารวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตามมาตรฐานและข้อบังคับการคุ้มครองข้อมูล ข้อมูลของคุณจะถูกใช้สำหรับการลงทะเบียนและการสื่อสารภายในสถาบันเท่านั้น',
    checkboxLabel: 'ฉันยอมรับข้อกำหนดและเงื่อนไข',
  }
};

type AcademicRegistrationOptions = {
  occupations: { id: string; name: string; requiresStudentId: boolean }[];
  faculties: {
    id: string;
    name: string;
    departments: { id: string; name: string }[];
  }[];
};

type AcademicRegistrationStatus = {
  firstName: string;
  telephone: string | null;
  occupationId: string | null;
  studentId: string | null;
  departmentId: string | null;
  termsAcceptedAt: string | null;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const termsVersion = '2026-01-01';

const requestApi = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured.');

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...init?.headers },
  });
  const body = await response.json() as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.success ? 'The request failed.' : body.error.message);
  }

  return body.data;
};

interface Step1Props {
  lang?: 'en' | 'th'
}

export default function Step1({ lang = 'en' }: Step1Props) {
  const t = translations[lang];

  const [isAccepted, setIsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [registrationOptions, setRegistrationOptions] = useState<AcademicRegistrationOptions | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    telephone: '',
    occupationId: '',
    studentId: '',
    facultyId: '',
    departmentId: '',
  });

  useEffect(() => {
    let isActive = true;

    const loadRegistration = async () => {
      try {
        const [options, status] = await Promise.all([
          requestApi<AcademicRegistrationOptions>('/api/v1/academic-registration/options'),
          requestApi<AcademicRegistrationStatus>('/api/v1/academic-registration/status'),
        ]);
        if (!isActive) return;

        const faculty = options.faculties.find(({ departments }) =>
          departments.some(({ id }) => id === status.departmentId),
        );

        setRegistrationOptions(options);
        setFormData({
          firstName: status.firstName,
          telephone: status.telephone ?? '',
          occupationId: status.occupationId ?? '',
          studentId: status.studentId ?? '',
          facultyId: faculty?.id ?? '',
          departmentId: status.departmentId ?? '',
        });
        setIsAccepted(Boolean(status.termsAcceptedAt));
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load registration details.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadRegistration();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedOccupation = registrationOptions?.occupations.find(
    ({ id }) => id === formData.occupationId,
  );
  const selectedFaculty = registrationOptions?.faculties.find(({ id }) => id === formData.facultyId);
  const selectedDepartment = selectedFaculty?.departments.find(({ id }) => id === formData.departmentId);

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!formData.firstName || !formData.telephone || !formData.occupationId || !formData.departmentId) {
      setErrorMessage(t.errRequired);
      return;
    }

    if (selectedOccupation?.requiresStudentId && !formData.studentId) {
      setErrorMessage(t.errStudentId);
      return;
    }

    if (!isAccepted) {
      setErrorMessage(t.errTerms);
      return;
    }

    setIsSaving(true);
    try {
      await requestApi<undefined>('/api/v1/academic-registration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          telephone: formData.telephone,
          occupationId: formData.occupationId,
          studentId: formData.studentId || undefined,
          departmentId: formData.departmentId,
          termsVersion,
        }),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save registration details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <RegistrationHeader title={t.headerTitle} />
        <Step step={1} lang={lang} />
        <StepProgress step={1} totalSteps={3} />
        {isLoading && <ActivityIndicator style={styles.loading} color="#208AEF" />}
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
          value={formData.telephone}
          placeholder={t.phonePlaceholder} 
          keyboardType="phone-pad"
          onChangeText={(text) => {
            setFormData({ ...formData, telephone: text });
            setErrorMessage('');
          }} 
        />
        
        <FormSelect 
          label={t.occupationLabel} 
          options={registrationOptions?.occupations.map(({ name }) => name) ?? []}
          placeholder={t.occupationPlaceholder} 
          selectedValue={selectedOccupation?.name ?? ''}
          onSelect={(name) => {
            const occupation = registrationOptions?.occupations.find((option) => option.name === name);
            setFormData({ ...formData, occupationId: occupation?.id ?? '', studentId: '' });
            setErrorMessage('');
          }} 
        />
        
        {selectedOccupation?.requiresStudentId && (
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
          options={registrationOptions?.faculties.map(({ name }) => name) ?? []}
          placeholder={t.facultyPlaceholder} 
          selectedValue={selectedFaculty?.name ?? ''}
          onSelect={(name) => {
            const faculty = registrationOptions?.faculties.find((option) => option.name === name);
            setFormData({ ...formData, facultyId: faculty?.id ?? '', departmentId: '' });
            setErrorMessage('');
          }}
        />
        
        <FormSelect
          label={t.departmentLabel} 
          placeholder={t.departmentPlaceholder} 
          options={selectedFaculty?.departments.map(({ name }) => name) ?? []}
          selectedValue={selectedDepartment?.name ?? ''}
          onSelect={(name) => {
            const department = selectedFaculty?.departments.find((option) => option.name === name);
            setFormData({ ...formData, departmentId: department?.id ?? '' });
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
        
        <StepActionButtons onBack={() => {console.log('ย้อนกลับ'); }} onNext={handleSubmit} lang={lang} />
        
        {isSaving && <ActivityIndicator style={styles.loading} color="#208AEF" />}

        {errorMessage !== '' && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    alignSelf: 'flex-start',
    fontFamily: 'font42dotSans_600SemiBold',
  },
  loading: {
    marginVertical: 12,
  },
});
