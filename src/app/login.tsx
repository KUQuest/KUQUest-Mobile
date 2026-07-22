import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GoogleIcon from '../components/GoogleIcon';

const LogoText = () => (
  <Text style={styles.logoText}>KUQUEST</Text>
);

export default function Login() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.content}>
        <LogoText />
        <Text style={styles.subtitle}>Academic Venture Network</Text>
        
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-alert-outline" size={32} color="#01531D" />
          </View>
          
          <Text style={styles.cardTitle}>Welcome Back</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/step1')}
            style={styles.googleButton}
          >
            <GoogleIcon />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#01531D" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Please sign in with your @ku.th student email to access the platform.
            </Text>
          </View>

          <Text style={styles.termsText}>
            By signing in, you agree to the KUQUEST <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>

          <Text style={styles.signupText}>
            Don't have account, <Text onPress={() => router.push('/signup')} style={styles.signupLink}>Sign up</Text>
          </Text>
          
          <Text style={styles.troubleText}>
            Having trouble? <Text style={styles.signupLink}>Contact Us</Text>
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 KUQUEST</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
          <Text style={styles.footerLink}>Support</Text>
          <Text style={styles.footerLink}>About us</Text>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#01531D',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    // Android shadow
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#85C692',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 32,
  },
  googleButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 15,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F5F8F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#6B7280',
  },
  signupText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  signupLink: {
    color: '#01531D',
    fontWeight: '500',
  },
  troubleText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
