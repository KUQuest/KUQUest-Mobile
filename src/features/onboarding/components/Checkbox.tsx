import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
    <View style={styles.container}>
      <Pressable
        style={styles.row}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
          {checked && <Check color={colors.white} size={14} strokeWidth={2.5} />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
