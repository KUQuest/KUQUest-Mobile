import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TopNav from '../components/TopNav';

export default function Step2() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TopNav />
        <View style={styles.header}>
          <Text style={styles.kicker}>REGISTRATION FLOW</Text>
          <Text style={styles.title}>Step 2 of 3</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tell us about yourself</Text>
          <Text style={styles.cardSubtitle}>Build your professional profile to let your employers see.</Text>
          
          <Text style={styles.label}>Description about yourself</Text>
          <View style={styles.textareaContainer}>
            <TextInput 
              style={styles.textarea}
              placeholder="What are your skills? What kind of quests are you looking for?&#10;Share your background or experience..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>0 / 500</Text>
          </View>
          <Text style={styles.tipText}>
            Pro tip: Detailed descriptions get 40% more acceptance.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/step1')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => router.push('/step3')}
        >
          <Text style={styles.nextButtonText}>Complete Registration</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F4',
  },
  scrollContainer: {
    paddingBottom: 120, // Leave space for bottom bar
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#01531D',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '66.66%',
    backgroundColor: '#01531D',
  },
  card: {
    flex: 1,
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
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  textareaContainer: {
    flex: 1,
    minHeight: 250,
    position: 'relative',
  },
  textarea: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(244, 248, 244, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#01531D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#01531D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#01531D',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
