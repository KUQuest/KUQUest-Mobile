import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Check, ChevronDown, CircleX, Search, X } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  clearSearchLabel?: string;
  closeLabel?: string;
  disabled?: boolean;
  success?: boolean;
}

export function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder,
  error,
  searchable = false,
  searchPlaceholder,
  noResultsMessage = 'No results',
  emptyMessage = 'No options available',
  loading = false,
  loadingMessage = 'Loading...',
  clearSearchLabel = 'Clear search',
  closeLabel = 'Close',
  disabled = false,
  success = false,
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption = options.find((opt) => opt.value === value);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery))
    : options;

  const closeModal = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.selectBox, error ? styles.selectBoxError : null, success ? styles.selectBoxSuccess : null, disabled ? styles.selectBoxDisabled : null]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={selectedOption?.label ?? placeholder ?? label}
        accessibilityState={{ disabled, expanded: modalVisible }}
        testID="select-trigger"
      >
        <Text style={[styles.selectText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </Text>
        <ChevronDown color={colors.textMuted} size={18} strokeWidth={2} />
      </Pressable>
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>{error}</Text> : null}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
            <Pressable style={styles.modalDismissArea} onPress={closeModal}>
              <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <Pressable onPress={closeModal} style={styles.closeButton} accessibilityRole="button" accessibilityLabel={closeLabel} testID="close-select-button">
                    <X color={colors.textSecondary} size={20} strokeWidth={2} />
                  </Pressable>
                </View>
                {searchable ? (
                  <View style={styles.searchContainer}>
                    <Search color={colors.textMuted} size={18} strokeWidth={2} />
                    <TextInput
                      autoFocus
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={searchPlaceholder}
                      placeholderTextColor={colors.textFaint}
                      style={styles.searchInput}
                      accessibilityRole="search"
                      accessibilityLabel={searchPlaceholder ?? label}
                      testID="select-search-input"
                    />
                    {searchQuery ? (
                      <Pressable style={styles.clearButton} onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={clearSearchLabel} testID="clear-search-button">
                        <CircleX color={colors.textMuted} size={18} strokeWidth={2} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <FlatList
                  data={loading ? [] : filteredOptions}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.optionItem}
                      onPress={() => {
                        onValueChange(item.value);
                        closeModal();
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: item.value === value }}
                    >
                      <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                        {item.label}
                      </Text>
                      {item.value === value && (
                        <Check color={colors.primary} size={18} strokeWidth={2.5} />
                      )}
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {loading ? loadingMessage : normalizedQuery ? noResultsMessage : emptyMessage}
                    </Text>
                  }
                />
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}
