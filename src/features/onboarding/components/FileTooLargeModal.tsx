import React from 'react';
import { Modal } from 'react-native';
import { Pressable, Text, View } from '@/tw';
import { CircleX, RefreshCw } from 'lucide-react-native';
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
      <View className={styles.overlay}>
        <View className={styles.modalContainer}>
          
          {/* Icon */}
          <View className={styles.icon}>
            <CircleX size={48} color={colors.dangerIcon} strokeWidth={2} />
          </View>
          
          {/* Title & Description */}
          <Text className={styles.title}>{msg.fileTooLargeTitle}</Text>
          <Text className={styles.description}>{msg.fileTooLargeDesc}</Text>

          {/* Try Again Button (Custom style to match design: Dark Green filled with refresh icon) */}
          <Pressable accessibilityRole="button" className={styles.tryAgainButton} onPress={onTryAgain}>
            <View className={styles.btnIcon}>
              <RefreshCw size={18} color={colors.white} strokeWidth={2} />
            </View>
            <Text className={styles.tryAgainText}>{msg.tryAgain}</Text>
          </Pressable>

          {/* Back Button (Custom style to match design: Outline dark green) */}
          <Pressable accessibilityRole="button" className={styles.backButton} onPress={onBack}>
            <Text className={styles.backText}>{msg.backBtn}</Text>
          </Pressable>
          
        </View>
      </View>
    </Modal>
  );
};
