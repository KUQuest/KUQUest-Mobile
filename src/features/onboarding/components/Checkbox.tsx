import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
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
      <Pressable style={styles.row} onPress={() => onChange(!checked)}>
        <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
          {checked && <SymbolView name="checkmark" size={14} tintColor={colors.white} />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
