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

// นำเข้า Shared Components
import { Header, ProgressBar, Input, Select, Button } from '../../components/Shared';

interface Step1Props {
  formData?: any;
  setFormData?: (data: any) => void;
  onSubmit?: () => void;
}

export default function Step1({ formData = {}, setFormData = () => {}, onSubmit }: Step1Props) {
  const [isAccepted, setIsAccepted] = useState(false);
  const occupation = formData?.occupation || 'Student';

  // ปุ่ม Cancel / Back ย้อนกลับไปหน้าก่อนหน้า
  const handleBack = () => {
    router.back();
  };

  // ปุ่ม Submit ข้อมูล
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      console.log('Submitted Data:', formData);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <Header title="Academic Registration" />
        <ProgressBar step={1} total={1} />
    
        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            >
              {/* Avatar Section */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarCircle}>
                    <User size={36} color="#6B7280" strokeWidth={2} />
                  </View>
                  <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                    <Pencil size={14} color="#FFFFFF" fill="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
    
              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Input 
                  label="Name-Surname" 
                  placeholder="Enter your full name" 
                  defaultValue={formData?.name} 
                  onChangeText={(text: string) => setFormData({ ...formData, name: text })} 
                />
    
                <Input 
                  label="Telephone" 
                  placeholder="08X-XXX-XXXX" 
                  keyboardType="phone-pad"
                  defaultValue={formData?.phone} 
                  onChangeText={(text: string) => setFormData({ ...formData, phone: text })} 
                />
    
                <Select 
                  label="Occupation" 
                  options={[
                    { label: 'Student', value: 'Student' }, 
                    { label: 'Professor', value: 'Professor' }
                  ]} 
                  value={occupation}
                  onValueChange={(value: string) => setFormData({ ...formData, occupation: value })}
                />
    
                {occupation === 'Student' && (
                  <Input 
                    label="Student ID" 
                    placeholder="67XXXXXXX" 
                    keyboardType="numeric"
                    defaultValue={formData?.studentId} 
                    onChangeText={(text: string) => setFormData({ ...formData, studentId: text })} 
                  />
                )}
    
                <Select 
                  label="Faculty" 
                  options={[
                    { label: 'Select your faculty', value: '' }, 
                    { label: 'Engineering', value: 'Engineering' }
                  ]} 
                  value={formData?.faculty || ''}
                  onValueChange={(value: string) => setFormData({ ...formData, faculty: value })}
                />
    
                <Select 
                  label="Department" 
                  options={[
                    { label: 'Select your Department', value: '' }, 
                    { label: 'Computer Engineering', value: 'Computer Engineering' }
                  ]} 
                  value={formData?.department || ''}
                  onValueChange={(value: string) => setFormData({ ...formData, department: value })}
                />
    
                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <Text style={styles.termsLabel}>Terms and Conditions</Text>
                  
                  <View style={styles.termsBox}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                      <Text style={styles.termsTitle}>Privacy Policy</Text>
                      <Text style={styles.termsText}>
                        We value your privacy. This policy explains how we collect, use, and protect 
                        your personal data in accordance with academic standards and data protection 
                        regulations. Your information is used solely for academic registration and 
                        institutional communication.
                      </Text>
                    </ScrollView>
                  </View>
    
                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    activeOpacity={0.7}
                    onPress={() => setIsAccepted(!isAccepted)}
                  >
                    <Switch
                      value={isAccepted}
                      onValueChange={setIsAccepted}
                      trackColor={{ false: '#D1D5DB', true: '#014925' }}
                      thumbColor="#FFFFFF"
                    />
                    <Text style={styles.checkboxLabel}>I accept the Terms and Conditions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
    
            {/* Bottom Button Actions */}
            <View style={styles.bottomBar}>
              <View style={styles.buttonFlex}>
                <Button variant="secondary" onPress={handleBack}>Cancel</Button>
              </View>
              <View style={styles.buttonFlex}>
                <Button variant="primary" onPress={handleSubmit}>Submit</Button>
              </View>
            </View>
          </View>
        </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 24,
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