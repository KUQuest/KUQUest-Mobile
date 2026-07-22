import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TopNav from '../components/TopNav';

export default function Step3() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TopNav />
        <View style={styles.header}>
          <Text style={styles.kicker}>STEP 3 OF 3</Text>
          <Text style={styles.title}>Certification & Experience</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#01531D" />
            </View>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>Certification</Text>
              <Text style={styles.sectionSubtitle}>
                Boost your credibility by providing proof of your academic and professional achievements.
              </Text>
            </View>
          </View>

          {/* CERTIFICATES SECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>CERTIFICATES</Text>
            <View style={styles.uploadBox}>
              <MaterialCommunityIcons name="cloud-upload" size={32} color="#9CA3AF" style={styles.uploadIcon} />
              <Text style={styles.uploadText}>Drag and drop your academic certificates here</Text>
              <Text style={styles.uploadHelpText}>Supported formats: PDF, JPG, PNG (Max 5MB each)</Text>
              <TouchableOpacity style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Browse Files</Text>
              </TouchableOpacity>
            </View>
            <TextInput 
              style={[styles.textarea, styles.lightBackground, { height: 96 }]}
              placeholder="Detail your relevant project work, academic achievements, or professional background..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* EXPERIENCE SECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>EXPERIENCE</Text>
            <View style={styles.experienceForm}>
              <TextInput 
                style={[styles.input, styles.lightBackground]} 
                placeholder="Job title" 
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Start</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={[styles.inputWithIcon, styles.lightBackground]} 
                    placeholder="--/--/--" 
                    placeholderTextColor="#9CA3AF"
                  />
                  <MaterialCommunityIcons name="calendar" size={16} color="#374151" style={styles.inputIcon} />
                </View>
                <Text style={styles.dateLabel}>End</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={[styles.inputWithIcon, styles.lightBackground]} 
                    placeholder="--/--/--" 
                    placeholderTextColor="#9CA3AF"
                  />
                  <MaterialCommunityIcons name="calendar" size={16} color="#374151" style={styles.inputIcon} />
                </View>
              </View>
              <TextInput 
                style={[styles.textarea, styles.lightBackground, { height: 96 }]}
                placeholder="Detail your relevant project work, academic achievements, or professional background..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.addButtonText}>Add more experience</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* MY WORKS SECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>MY WORKS</Text>
            <View style={styles.worksRow}>
              <TouchableOpacity style={styles.imageUploadBox}>
                <MaterialCommunityIcons name="image-outline" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                <Text style={styles.imageUploadText}>+ Add Image</Text>
              </TouchableOpacity>
              <View style={styles.worksForm}>
                <TextInput 
                  style={[styles.input, styles.lightBackground]} 
                  placeholder="Title" 
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput 
                  style={[styles.textarea, styles.lightBackground, { flex: 1, minHeight: 80 }]}
                  placeholder="Detail your relevant project work, academic achievements, or..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.addButtonText}>Add more works</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/step2')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#01531D',
    marginBottom: 16,
    textAlign: 'center',
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
    width: '100%',
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
    gap: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    backgroundColor: '#85C692',
    padding: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  sectionHeaderTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    letterSpacing: 1,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadIcon: {
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadHelpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#01531D',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#01531D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lightBackground: {
    backgroundColor: 'rgba(244, 248, 244, 0.5)',
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
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    paddingRight: 32,
    fontSize: 14,
    color: '#111827',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  textarea: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  experienceForm: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#01531D',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addPlus: {
    fontSize: 18,
    lineHeight: 18,
    color: '#01531D',
  },
  addButtonText: {
    color: '#01531D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  worksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageUploadBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imageUploadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#01531D',
  },
  worksForm: {
    flex: 2,
    gap: 12,
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
  },
  backButtonText: {
    color: '#01531D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#01531D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
