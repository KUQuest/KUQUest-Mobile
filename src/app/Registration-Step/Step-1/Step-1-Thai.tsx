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
} from '../../../components/Shared';

export default function Step1() {
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
      setErrorMessage('* กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (formData.occupation === 'นิสิต/นักศึกษา' && !formData.studentId) {
      setErrorMessage('* กรุณากรอกรหัสนิสิต/นักศึกษา');
      return;
    }

    if (!isAccepted) {
      setErrorMessage('* กรุณายอมรับข้อตกลงและเงื่อนไขก่อนดำเนินการต่อ');
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
        <RegistrationHeader title="ลงทะเบียนข้อมูลทางการศึกษา" />
        <Step step={1} lang="th"/>
        <StepProgress step={1} totalSteps={3} />
        <ProfileUpload />
        
        <FormInput 
          label="ชื่อ-นามสกุล" 
          value={formData.firstName} 
          placeholder="กรอกชื่อ-นามสกุล" 
          onChangeText={(text) => {
            setFormData({ ...formData, firstName: text });
            setErrorMessage('');
          }} 
        />
        
        <FormInput 
          label="เบอร์โทรศัพท์" 
          value={formData.phoneNumber} 
          placeholder="08X-XXX-XXXX" 
          keyboardType="phone-pad"
          onChangeText={(text) => {
            setFormData({ ...formData, phoneNumber: text });
            setErrorMessage('');
          }} 
        />
        
        <FormSelect 
          label="อาชีพ" 
          options={['นักเรียน', 'อาจารย์']} 
          placeholder="เลือกอาชีพ" 
          selectedValue={formData.occupation} 
          onSelect={(value) => {
            setFormData({ ...formData, occupation: value });
            setErrorMessage('');
          }} 
        />
        
        {formData.occupation === 'นักเรียน' && (
          <FormInput 
            label="รหัสนิสิต/นักศึกษา" 
            value={formData.studentId} 
            placeholder="67XXXXXXXX" 
            keyboardType="numeric"
            onChangeText={(text) => {
              setFormData({ ...formData, studentId: text });
              setErrorMessage('');
            }} 
          />
        )}
        
        <FormSelect 
          label="คณะ" 
          options={['วิศวกรรมศาสตร์', 'บริหารธุรกิจ']} 
          placeholder="เลือกคณะ" 
          selectedValue={formData.faculty} 
          onSelect={(value) => {
            setFormData({ ...formData, faculty: value });
            setErrorMessage('');
          }}
        />
        
        <FormInput 
          label="สาขา" 
          value={formData.department} 
          placeholder="กรอกสาขา" 
          onChangeText={(text) => {
            setFormData({ ...formData, department: text });
            setErrorMessage('');
          }}
        />
        
        <TermsBox 
          label="ข้อกำหนดและเงื่อนไข" 
          title="นโยบายความเป็นส่วนตัว" 
          content="เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายถึงวิธีการที่เรารวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตามมาตรฐานและข้อบังคับการคุ้มครองข้อมูล ข้อมูลของคุณจะถูกใช้สำหรับการลงทะเบียนและการสื่อสารภายในสถาบันเท่านั้น"
        />
        
        <Checkbox 
          label="ฉันยอมรับข้อกำหนดและเงื่อนไข" 
          isChecked={isAccepted} 
          onToggle={() => {
            setIsAccepted(!isAccepted);
            setErrorMessage('');
          }}
        />
        
        <StepActionButtons onBack={() => {console.log('ย้อนกลับ'); }} onNext={handleSubmit} lang='th'/>
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
    fontFamily: 'BeVietnamPro-600Bold',
  },
});