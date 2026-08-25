import React from 'react';
import { cn } from '@/tw/cn';
import { Pressable, Text, View } from '@/tw';
import { Check } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import styles from '../styles/checkboxStyles';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ label, checked, onChange, error }: CheckboxProps) {
  return (
    <View className={styles.container}>
      <Pressable
        className={styles.row}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
      >
        <View className={cn(styles.box, checked && styles.boxChecked, error && styles.boxError)}>
          {checked && <Check color={colors.white} size={14} strokeWidth={2.5} />}
        </View>
        <Text className={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" className={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
