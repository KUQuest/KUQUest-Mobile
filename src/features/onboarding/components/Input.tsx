import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          success ? styles.inputSuccess : null,
          focused ? styles.inputFocused : null,
          !editable ? styles.inputDisabled : null,
          style,
        ]}
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
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
