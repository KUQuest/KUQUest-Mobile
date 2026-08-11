import React from 'react';
import { Text, View, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { onboardingMessages } from '../../../locales/registrationOnboarding';
import { useLocale } from '../../../locales/LocaleProvider';
import { colors } from '@/theme/colors';
import styles from '../styles/fileTooLargeModalStyles';

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
          <MaterialIcons name="cancel" size={48} color={colors.dangerIcon} style={styles.icon} />
          
          {/* Title & Description */}
          <Text style={styles.title}>{msg.fileTooLargeTitle}</Text>
          <Text style={styles.description}>{msg.fileTooLargeDesc}</Text>

          {/* Try Again Button (Custom style to match design: Dark Green filled with refresh icon) */}
          <Pressable style={styles.tryAgainButton} onPress={onTryAgain}>
            <MaterialIcons name="refresh" size={18} color={colors.white} style={styles.btnIcon} />
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
