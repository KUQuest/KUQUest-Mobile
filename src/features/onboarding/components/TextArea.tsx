import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';
import styles from '../styles/textAreaStyles';

interface TextAreaProps extends TextInputProps {
  label: string;
  error?: string;
  maxLength?: number;
  value: string;
}

export function TextArea({ label, error, maxLength, value, style, ...props }: TextAreaProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.textFaint}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <View style={styles.footerRow}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {maxLength !== undefined && (
          <Text style={styles.counterText}>
            {value.length} / {maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}
