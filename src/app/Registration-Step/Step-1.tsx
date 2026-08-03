import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // แก้ Safe Area Deprecated แล้ว
import { User, Pencil } from 'lucide-react-native';
import { router } from 'expo-router';

import {Header, 
        ProgressBar, 
        Button, 
        RegistrationHeader,
        Step,
        StepProgress,
        ProfileUpload,
        FormInput,
        FormSelect} 
from '../../components/Shared';

interface Step1Props {
  formData?: any;
  setFormData?: (data: any) => void;
  onSubmit?: () => void;
}

export default function Step1() { //{ formData = {}, setFormData = () => {}, onSubmit }: Step1Props
  const [isAccepted, setIsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '',
    occupation: '',
    studentId: '',
    faculty: '',
    department: '',
  });
  const handleBack = () => {
    router.back();
  };

  // const handleSubmit = () => {
  //   if (onSubmit) {
  //     onSubmit();
  //   } else {
  //     console.log('Submitted Data:', formData);
  //   }
  // };
  const handleSubmit = () => {
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
        <RegistrationHeader title="Academic Registration" />
        <Step step={1} />
        <StepProgress step={1} totalSteps={3} />
        <ProfileUpload></ProfileUpload>
        <FormInput label="Full Name" value={formData.firstName} placeholder="Enter your full name" onChangeText={(text) => setFormData({ ...formData, firstName: text })} />
        <FormInput label="Phone Number" value={formData.phoneNumber} placeholder="Enter your phone number" onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })} />
        <FormSelect label="Occupation" options={['Student', 'Teacher']} placeholder="Select your occupation" selectedValue={formData.occupation} onSelect={(value) => setFormData({ ...formData, occupation: value })} />
        {formData.occupation === 'Student' && (
          <FormInput 
            label="Student ID" 
            value={formData.studentId} 
            placeholder="67xxxxxxxx" 
            onChangeText={(text) => setFormData({ ...formData, studentId: text })} 
          />
        )}
        <FormSelect label="Faculty" options={['Engineering', 'Business']} placeholder="Select your faculty" selectedValue={formData.faculty}onSelect={(value) => setFormData({ ...formData, faculty: value })}/>
        <FormInput label="Department" value={formData.department} placeholder="Enter your department" onChangeText={(text) => setFormData({ ...formData, department: text })}/>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop:12,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#014925',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#F8F9FA',
  },
  formGroup: {
    gap: 16,
  },
  termsContainer: {
    marginTop: 8,
    gap: 8,
  },
  termsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  termsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    height: 120,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  buttonFlex: {
    flex: 1,
  },
});