import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { 
  Button, 
  RegistrationHeader,
  Step,
  StepProgress,
  ProfileUpload,
  FormInput,
  FormSelect,
  TermsBox,
  Checkbox
} from '../../components/Shared';

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
      setErrorMessage('* Please fill in all required fields');
      return;
    }

    if (formData.occupation === 'Student' && !formData.studentId) {
      setErrorMessage('* Please enter your student ID');
      return;
    }

    if (!isAccepted) {
      setErrorMessage('* Please accept the Terms and Conditions before proceeding');
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
        <RegistrationHeader title="Academic Registration" />
        <Step step={1} />
        <StepProgress step={1} totalSteps={3} />
        <ProfileUpload />
        
        <FormInput 
          label="Full Name" 
          value={formData.firstName} 
          placeholder="Enter your full name" 
          onChangeText={(text) => {
            setFormData({ ...formData, firstName: text });
            setErrorMessage('');
          }} 
        />
        
        <FormInput 
          label="Phone Number" 
          value={formData.phoneNumber} 
          placeholder="Enter your phone number" 
          onChangeText={(text) => {
            setFormData({ ...formData, phoneNumber: text });
            setErrorMessage('');
          }} 
        />
        
        <FormSelect 
          label="Occupation" 
          options={['Student', 'Teacher']} 
          placeholder="Select your occupation" 
          selectedValue={formData.occupation} 
          onSelect={(value) => {
            setFormData({ ...formData, occupation: value });
            setErrorMessage('');
          }} 
        />
        
        {formData.occupation === 'Student' && (
          <FormInput 
            label="Student ID" 
            value={formData.studentId} 
            placeholder="67xxxxxxxx" 
            onChangeText={(text) => {
              setFormData({ ...formData, studentId: text });
              setErrorMessage('');
            }} 
          />
        )}
        
        <FormSelect 
          label="Faculty" 
          options={['Engineering', 'Business']} 
          placeholder="Select your faculty" 
          selectedValue={formData.faculty} 
          onSelect={(value) => {
            setFormData({ ...formData, faculty: value });
            setErrorMessage('');
          }}
        />
        
        <FormInput 
          label="Department" 
          value={formData.department} 
          placeholder="Enter your department" 
          onChangeText={(text) => {
            setFormData({ ...formData, department: text });
            setErrorMessage('');
          }}
        />
        
        <TermsBox 
          label="Terms and Conditions" 
          title="Privacy Policy" 
          content="Privacy Policy We value your privacy. This policy explains how we collect, use, and protect your personal data in accordance with academic standards and data protection regulations. Your information is used solely for academic registration and institutional communication."
        />
        
        <Checkbox 
          label="I accept the Terms and Conditions" 
          isChecked={isAccepted} 
          onToggle={() => {
            setIsAccepted(!isAccepted);
            setErrorMessage('');
          }}
        />
        
        <Button onPress={handleSubmit}>Continue</Button>
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