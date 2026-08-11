import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';

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
          {checked && <SymbolView name="checkmark" size={14} tintColor="#FFFFFF" />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#C0C0C0',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxChecked: {
    backgroundColor: '#014925',
    borderColor: '#014925',
  },
  boxError: {
    borderColor: '#D32F2F',
  },
  label: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  errorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
    marginLeft: 30,
  },
});
