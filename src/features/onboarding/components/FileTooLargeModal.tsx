import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { onboardingMessages } from '../../../locales/registrationOnboarding';
import { useLocale } from '../../../locales/LocaleProvider';

interface FileTooLargeModalProps {
  visible: boolean;
  onTryAgain: () => void;
  onBack: () => void;
}

export const FileTooLargeModal: React.FC<FileTooLargeModalProps> = ({
  visible,
  onTryAgain,
  onBack,
}) => {
  const { locale } = useLocale();
  const msg = onboardingMessages[locale];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onBack}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Icon */}
          <MaterialIcons name="cancel" size={48} color="#C41C1C" style={styles.icon} />
          
          {/* Title & Description */}
          <Text style={styles.title}>{msg.fileTooLargeTitle}</Text>
          <Text style={styles.description}>{msg.fileTooLargeDesc}</Text>

          {/* Try Again Button (Custom style to match design: Dark Green filled with refresh icon) */}
          <Pressable style={styles.tryAgainButton} onPress={onTryAgain}>
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.tryAgainText}>{msg.tryAgain}</Text>
          </Pressable>

          {/* Back Button (Custom style to match design: Outline dark green) */}
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>{msg.backBtn}</Text>
          </Pressable>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 20,
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  tryAgainButton: {
    backgroundColor: '#014925',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    marginBottom: 12,
  },
  tryAgainText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  btnIcon: {
    marginRight: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
  },
  backText: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 16,
    color: '#111111',
  },
});
