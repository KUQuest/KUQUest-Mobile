import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Platform
} from 'react-native';
import { GraduationCap, ArrowRight } from 'lucide-react-native';

export default function LoginScreen({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>KUQUEST</Text>
            <Text style={styles.subtitle}>Academic Venture Network</Text>
          </View>

          {/* Form / Actions Section */}
          <View style={styles.actionContainer}>
            
            {/* Info Box */}
            <View style={styles.infoBox}>
              <GraduationCap color="#014925" size={20} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Please sign in with your{' '}
                <Text style={styles.infoTextBold}>@ku.th</Text> student
                email to access the platform.
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={onNext} 
              activeOpacity={0.8}
            >
              <ArrowRight color="#FFFFFF" size={20} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={onNext} 
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign In with Google</Text>
            </TouchableOpacity>
            
          </View>

          {/* Footer Section */}
          <View style={styles.footerContainer}>
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.linkText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.copyrightText}>© 2024 KUQUEST. All rights reserved.</Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// Stylesheet (แทนที่ Tailwind CSS)
// ----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA', // สีพื้นหลังเผื่อไว้ให้คล้ายหน้าเว็บขาวๆ
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#014925',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 2.4, // เทียบเคียง tracking-[0.15em]
    textTransform: 'uppercase',
  },

  // Actions
  actionContainer: {
    marginBottom: 64,
  },
  infoBox: {
    backgroundColor: '#EAF6ED',
    borderWidth: 1,
    borderColor: '#C5E1C9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoIcon: {
    marginTop: Platform.OS === 'ios' ? 0 : 2,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  infoTextBold: {
    fontWeight: 'bold',
    color: '#111827',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#014925',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#014925',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#014925',
    fontWeight: '600',
    fontSize: 16,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  copyrightText: {
    fontSize: 14,
    color: '#6B7280',
  },
});