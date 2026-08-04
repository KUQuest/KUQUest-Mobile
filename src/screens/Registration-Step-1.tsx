import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
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
        
        <StepActionButtons onBack={() => {console.log('ย้อนกลับ'); }} onNext={handleSubmit} lang={lang} />
        
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
});