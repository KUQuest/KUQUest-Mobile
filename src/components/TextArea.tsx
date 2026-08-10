import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

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
        placeholderTextColor="#999999"
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: 'NotoSansThai-Bold',
    fontSize: 12,
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#111111',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#D32F2F',
    flex: 1,
  },
  counterText: {
    fontFamily: 'NotoSansThai',
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
  },
});
