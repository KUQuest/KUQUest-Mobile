import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TopNav from '../components/TopNav';

export default function Step1() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <TopNav />
      <View style={styles.header}>
        <Text style={styles.kicker}>ACADEMIC REGISTRATION</Text>
        <Text style={styles.title}>Step 1 of 3</Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressPill, styles.progressActive]} />
          <View style={styles.progressPill} />
          <View style={styles.progressPill} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.uploadContainer}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="camera" size={32} color="#9CA3AF" />
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.uploadText}>Profile Picture</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>NAME-SURNAME</Text>
            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#9CA3AF" />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>TELEPHONE</Text>
            <TextInput style={styles.input} placeholder="08X-XXX-XXXX" placeholderTextColor="#9CA3AF" />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>STUDENT ID</Text>
            <TextInput style={styles.input} placeholder="67XXXXXXXXX" placeholderTextColor="#9CA3AF" />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>BANK ACCOUNT</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.inputWithIcon} placeholder="XXXX-XXXX-XX" placeholderTextColor="#9CA3AF" />
              <MaterialCommunityIcons name="bank" size={20} color="#9CA3AF" style={styles.inputIcon} />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.flex1, { marginRight: 16 }]}>
              <Text style={styles.label}>FACULTY</Text>
              <TouchableOpacity style={styles.selectButton}>
                <Text style={styles.selectText}>Engineering</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>STUDENT ID</Text>
              <TextInput style={styles.input} placeholder="6XXXXXXX" placeholderTextColor="#9CA3AF" />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => router.push('/step2')}
        >
          <Text style={styles.continueButtonText}>Continue to Step 2</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 KUQUEST. Institutional Access Restricted.</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Security Policy</Text>
          <Text style={styles.footerLink}>Contact Support</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F4',
  },
  scrollContainer: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  kicker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#01531D',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    width: 192,
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressPill: {
    height: 6,
    flex: 1,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
  },
  progressActive: {
    backgroundColor: '#01531D',
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#01531D',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 14,
    color: '#111827',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  selectButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#01531D',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  footer: {
    marginTop: 48,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
});
