import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Button } from '@expo/ui';
import { SymbolView } from 'expo-symbols';

export default function LoginScreen({ onNext }: { onNext?: () => void }) {
  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <Host seedColor="#014925" style={styles.host}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>KUQUEST</Text>
              <Text style={styles.subtitle}>ACADEMIC VENTURE NETWORK</Text>
            </View>

            {/* Form / Actions Section */}
            <View style={styles.formSection}>
              <View style={styles.noticeCard}>
                <SymbolView
                  name={{ ios: 'graduationcap.fill', android: 'school', web: 'school' }}
                  size={24}
                  tintColor="#014925"
                />
                <Text style={styles.noticeText}>
                  Please sign in with your{' '}
                  <Text style={styles.noticeTextBold}>@ku.th</Text>{' '}
                  student email to access the platform.
                </Text>
              </View>

              <Button
                variant="filled"
                label="Sign Up with Google"
                onPress={handleNext}
                style={styles.button}
              />

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                variant="outlined"
                label="Sign In with Google"
                onPress={handleNext}
                style={styles.button}
              />
            </View>

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <View style={styles.footerLinks}>
                <Pressable onPress={() => { }}>
                  <Text style={styles.footerLinkText}>Terms of Service</Text>
                </Pressable>
                <Pressable onPress={() => { }}>
                  <Text style={styles.footerLinkText}>Privacy Policy</Text>
                </Pressable>
                <Pressable onPress={() => { }}>
                  <Text style={styles.footerLinkText}>Contact Us</Text>
                </Pressable>
              </View>
              <Text style={styles.copyrightText}>
                © 2024 KUQUEST. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-between',
    paddingVertical: 32,
    gap: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: '#014925',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  formSection: {
    width: '100%',
    gap: 16,
  },
  noticeCard: {
    backgroundColor: '#EAF6ED',
    borderColor: '#C5E1C9',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  noticeTextBold: {
    fontWeight: '700',
    color: '#111111',
  },
  button: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 14,
    color: '#777777',
    fontWeight: '500',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  copyrightText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
