import React, { useState } from 'react';
import { cn } from '@/tw/cn';
import { TextInputProps } from 'react-native';
import { Text, TextInput, View } from '@/tw';
import { colors } from '@/theme/colors';
import styles from '../styles/inputStyles';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  success?: boolean;
}

export function Input({ label, error, success = false, style, accessibilityLabel, editable = true, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={styles.container}>
      <Text className={styles.label}>{label}</Text>
      <TextInput
        className={cn(styles.input, error ? styles.inputError : null, success ? styles.inputSuccess : null, focused ? styles.inputFocused : null, !editable ? styles.inputDisabled : null)} style={style}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      <View className={styles.helperSlot}>{error ? <Text className={styles.errorText}>{error}</Text> : null}</View>
    </View>
  );
}
