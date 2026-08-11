import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, SafeAreaView } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colors } from '@/theme/colors';
import styles from '../styles/selectStyles';

export interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, value, onValueChange, placeholder, error }: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.selectBox, error ? styles.selectBoxError : null]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </Text>
        <SymbolView name="chevron.down" size={16} tintColor={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <SymbolView name="xmark" size={20} tintColor={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <SymbolView name="checkmark" size={18} tintColor={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
