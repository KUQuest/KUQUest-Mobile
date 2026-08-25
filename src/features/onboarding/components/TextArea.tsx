import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';
import styles from '../styles/textAreaStyles';

interface TextAreaProps extends TextInputProps {
  label: string;
  error?: string;
  maxLength?: number;
  value: string;
  success?: boolean;
}

export function TextArea({ label, error, maxLength, value, success = false, style, accessibilityLabel, editable = true, onFocus, onBlur, ...props }: TextAreaProps) {
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
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
        value={value}
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
      {(error || maxLength !== undefined) ? (
        <View style={styles.footerRow}>
          {error ? (
            <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>{error}</Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {maxLength !== undefined && (
            <Text style={styles.counterText}>
              {value.length} / {maxLength}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
