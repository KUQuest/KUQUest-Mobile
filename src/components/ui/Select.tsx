import React, { useState } from "react";
import { cn } from "@/tw/cn";
import { Keyboard, Modal, Pressable as RNPressable } from "react-native";
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "@/tw";
import { Check, ChevronDown, X } from "lucide-react-native";
import { SearchInput } from "./SearchInput";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "./selectStyles";

export interface Option {
  label: string;
  value: string;
}

export interface SelectProps {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  options: readonly Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  noResultsMessage?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  clearSearchLabel?: string;
  closeLabel?: string;
  disabled?: boolean;
  success?: boolean;
}

export const Select = React.forwardRef<
  React.ComponentRef<typeof RNPressable>,
  SelectProps
>(function Select(
  {
    label,
    accessibilityLabel,
    accessibilityHint,
    options,
    value,
    onValueChange,
    placeholder,
    error,
    searchable = false,
    searchPlaceholder,
    noResultsMessage = "No results",
    emptyMessage = "No options available",
    loading = false,
    onSearchChange,
    loadingMessage = "Loading...",
    clearSearchLabel = "Clear search",
    closeLabel = "Close",
    disabled = false,
    success = false,
  },
  ref
) {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fieldAccessibilityLabel = accessibilityLabel ?? label;
  const selectedOption = options.find((opt) => opt.value === value);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLocaleLowerCase().includes(normalizedQuery)
      )
    : options;

  const openModal = () => setModalVisible(true);

  const closeModal = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    onSearchChange?.("");
    setModalVisible(false);
  };

  const pickerSearch = searchable ? (
    <SearchInput
      accessibilityLabel={searchPlaceholder ?? fieldAccessibilityLabel}
      autoFocus
      clearAccessibilityLabel={clearSearchLabel}
      clearButtonClassName={styles.clearButton}
      clearButtonTestID="clear-search-button"
      clearIcon="circleX"
      clearIconColor={colors.textMuted}
      clearIconSize={18}
      clearIconStrokeWidth={2}
      className={styles.searchContainer}
      iconColor={colors.textMuted}
      iconSize={18}
      iconStrokeWidth={2}
      inputClassName={styles.searchInput}
      onChangeText={(value) => {
        setSearchQuery(value);
        onSearchChange?.(value);
      }}
      onClear={() => {
        setSearchQuery("");
        onSearchChange?.("");
      }}
      placeholder={searchPlaceholder}
      placeholderTextColor={colors.textFaint}
      testID="select-search-input"
      value={searchQuery}
    />
  ) : null;

  const pickerOptions = (
    <FlatList
      data={loading ? [] : filteredOptions}
      keyExtractor={(item) => item.value}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable
          className={styles.optionItem}
          onPress={() => {
            onValueChange(item.value);
            closeModal();
          }}
          accessibilityRole="radio"
          accessibilityLabel={`${fieldAccessibilityLabel}: ${item.label}`}
          accessibilityState={{ selected: item.value === value }}
        >
          <Text
            className={cn(
              styles.optionText,
              item.value === value && styles.optionTextSelected
            )}
          >
            {item.label}
          </Text>
          {item.value === value && (
            <Check color={colors.primary} size={18} strokeWidth={2.5} />
          )}
        </Pressable>
      )}
      ListEmptyComponent={
        <Text className={styles.emptyText}>
          {loading
            ? loadingMessage
            : normalizedQuery
              ? noResultsMessage
              : emptyMessage}
        </Text>
      }
    />
  );

  return (
    <View className={styles.container}>
      <Text className={styles.label}>{label}</Text>
      <Pressable
        ref={ref}
        className={cn(
          styles.selectBox,
          error ? styles.selectBoxError : null,
          success ? styles.selectBoxSuccess : null,
          disabled ? styles.selectBoxDisabled : null
        )}
        onPress={openModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${fieldAccessibilityLabel}: ${selectedOption?.label ?? placeholder ?? "Not selected"}`}
        accessibilityHint={accessibilityHint ?? error}
        accessibilityState={{
          disabled,
          expanded: modalVisible,
          ...(error ? { invalid: true } : {}),
        }}
        testID="select-trigger"
      >
        <Text
          className={cn(
            styles.selectText,
            !selectedOption && styles.placeholderText
          )}
        >
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
        </Text>
        <ChevronDown color={colors.textMuted} size={18} strokeWidth={2} />
      </Pressable>
      {error ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          className={styles.errorText}
        >
          {error}
        </Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaProvider>
          <SafeAreaView className={styles.modalOverlay} edges={["bottom"]}>
            <Pressable className={styles.modalDismissArea} onPress={closeModal}>
              <KeyboardAvoidingView
                className={styles.keyboardAvoidingView}
                behavior="padding"
              >
                <Pressable
                  className={styles.modalContent}
                  onPress={(event) => event.stopPropagation()}
                >
                  <View className={styles.modalHandle} />
                  <View className={styles.modalHeader}>
                    <Text className={styles.modalTitle}>{label}</Text>
                    <Pressable
                      onPress={closeModal}
                      className={styles.closeButton}
                      accessibilityRole="button"
                      accessibilityLabel={closeLabel}
                      testID="close-select-button"
                    >
                      <X
                        color={colors.textSecondary}
                        size={20}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>
                  {pickerSearch}
                  {pickerOptions}
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
});
Select.displayName = "Select";
