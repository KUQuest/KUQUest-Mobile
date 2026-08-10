import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
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
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
});
