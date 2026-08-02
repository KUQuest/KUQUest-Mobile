import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';

// ----------------------------------------------------
// Header Component
// ----------------------------------------------------
export const Header = ({ title }: { title: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerLogo}>KUQUEST</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// ----------------------------------------------------
// ProgressBar Component
// ----------------------------------------------------
export const ProgressBar = ({ step, total }: { step: number; total: number }) => (
  <View style={styles.progressContainer}>
    <Text style={styles.progressText}>Step {step} of {total}</Text>
    <View style={styles.progressTrack}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressBarSegment,
            { backgroundColor: i < step ? '#014925' : '#E5E7EB' },
          ]}
        />
      ))}
    </View>
  </View>
);

// ----------------------------------------------------
// Input Component
// ----------------------------------------------------
interface InputProps extends TextInputProps {
  label?: string;
}

export const Input = ({ label, style, ...props }: InputProps) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  </View>
);

// ----------------------------------------------------
// Select Component (Modal Dropdown)
// ----------------------------------------------------
interface Option {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value?: string | number;
  onValueChange?: (value: any) => void;
  placeholder?: string;
}

export const Select = ({
  label,
  options = [],
  value,
  onValueChange,
  placeholder = 'เลือก...',
}: SelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !selectedOption && { color: '#9CA3AF' }]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      {/* Modal Dropdown เลือกตัวเลือก */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    if (onValueChange) onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && { color: '#014925', fontWeight: 'bold' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// ----------------------------------------------------
// Textarea Component
// ----------------------------------------------------
export const Textarea = ({ label, style, ...props }: InputProps) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, styles.textarea, style]}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  </View>
);

// ----------------------------------------------------
// Button Component
// ----------------------------------------------------
interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', children, style, ...props }: ButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, isPrimary ? styles.textWhite : styles.textPrimary]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// ----------------------------------------------------
// Stylesheet (แทนที่ Tailwind CSS)
// ----------------------------------------------------
const styles = StyleSheet.create({
  // Header
  headerContainer: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerLogo: {
    color: '#014925',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    textTransform: 'uppercase',
    maxWidth: 200,
    lineHeight: 30,
  },

  // ProgressBar
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    alignSelf: 'center',
    marginBottom: 32,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 12,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBarSegment: {
    height: 3,
    flex: 1,
    borderRadius: 999,
  },

  // Form Inputs
  inputWrapper: {
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    fontSize: 14,
  },
  textarea: {
    minHeight: 100,
  },

  // Select Modal
  selectButton: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
  },

  // Buttons
  button: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#014925',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#014925',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textPrimary: {
    color: '#014925',
  },
});