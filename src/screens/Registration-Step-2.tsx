import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Button, TextInput, useNativeState } from '@expo/ui';

import { registrationMessages as translations, useLocale } from '../locales/registrationOnboarding';

export default function RegistrationStep2() {
  const { locale } = useLocale();
  const t = translations[locale];
  const { width } = useWindowDimensions();
  // Calculate button width: half screen width - padding (24 * 2) - gap (16) / 2
  const buttonWidth = (width - 48 - 16) / 2;

  // useNativeState for @expo/ui TextInput
  const textValue = useNativeState('');

  const handleChangeText = useCallback((value: string) => {
    'worklet';
    textValue.value = value;
  }, [textValue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>KUQUEST</Text>
          <Text style={styles.subtitle}>{t.step2Subtitle}</Text>

          <Text style={styles.stepIndicator}>{t.step2Indicator}</Text>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBarSegment, styles.progressBarActive]} />
            <View style={[styles.progressBarSegment, styles.progressBarActive]} />
            <View style={[styles.progressBarSegment, styles.progressBarInactive]} />
          </View>
        </View>

        {/* Card Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.step2CardTitle}</Text>
          <Text style={styles.cardSubtitle}>
            {t.step2CardSubtitle}
          </Text>

          <Text style={styles.inputLabel}>
            {t.step2InputLabel}
          </Text>
          
          <Host matchContents>
            <View style={styles.textInputWrapper}>
              <TextInput
                value={textValue}
                onChangeText={handleChangeText}
                placeholder={t.step2InputPlaceholder}
                multiline={true}
                numberOfLines={8}
                style={styles.textInput}
              />
            </View>
          </Host>
          
          <Text style={styles.characterCount}>0 / 500</Text>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionCard}>
          <Host seedColor="#014925" matchContents>
            <View style={styles.buttonRow}>
              <Button
                variant="outlined"
                label={t.backButton}
                onPress={() => console.log('Back pressed')}
                style={{ width: buttonWidth }}
              />
              <Button
                variant="filled"
                label={t.nextButton}
                onPress={() => console.log('Next pressed')}
                style={{ width: buttonWidth }}
              />
            </View>
          </Host>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  title: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 28,
    color: '#014925',
    letterSpacing: -0.5,
    fontWeight: '900',
    marginBottom: 24,
  },
  subtitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 20,
    color: '#111111',
    letterSpacing: 1,
    marginBottom: 32,
  },
  stepIndicator: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#014925',
  },
  progressBarInactive: {
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 20,
    color: '#014925',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 14,
    color: '#111111',
    marginBottom: 12,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: 160,
  },
  textInput: {
    flex: 1,
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#111111',
    padding: 12,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
});
