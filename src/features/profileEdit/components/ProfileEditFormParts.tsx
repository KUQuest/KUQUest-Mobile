import React, { useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  CalendarDays,
  Image as ImageIcon,
} from "lucide-react-native";
import { useLocale } from "@/features/preferences/localeStore";
import { Image, Pressable, Text, View } from "../../../tw";
import { colors } from "../../../theme/colors";
import styles from "../profileEditStyles";
import {
  profileEditMessages,
  type ProfileEditMessages,
} from "../../../locales/profileEditMessages";
import { formatDateForApi } from "../validation";

export function ScreenHeader({
  title,
  backLabel,
  onBack,
  action,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View className={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        className={styles.backButton}
        onPress={onBack}
      >
        <ArrowLeft color={colors.primaryDeep} size={24} strokeWidth={2.2} />
      </Pressable>
      <Text accessibilityRole="header" className={styles.headerTitle}>
        {title}
      </Text>
      {action ?? <View className={styles.headerAction} />}
    </View>
  );
}

export function SaveBar({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View className={styles.saveBar}>
      <View className={styles.saveBarInner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          disabled={disabled}
          className="min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-primary"
          onPress={onPress}
        >
          <Text className="font-ku-semibold text-ku-body text-ku-on-primary">
            {label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ImagePickerField({
  label,
  uri,
  placeholder,
  removeLabel,
  onChange,
  onError,
}: {
  label: string;
  uri: string;
  placeholder: string;
  removeLabel: string;
  onChange: (uri: string) => void;
  onError: (message: string) => void;
}) {
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const chooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        onError(messages.fileTooLarge);
        return;
      }
      onChange(asset.uri);
    } catch {
      onError(messages.filePickerError);
    }
  };

  return (
    <View className="gap-ku-sm">
      <Text className="font-ku-semibold text-ku-label text-ku-text-secondary">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uri ? label : placeholder}
        className={styles.imagePicker}
        style={{ aspectRatio: 4 / 3 }}
        onPress={() => void chooseImage()}
      >
        {uri && failedUri !== uri ? (
          <Image
            source={{ uri }}
            onError={() => setFailedUri(uri)}
            className={styles.imagePreview}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-[4px]">
            <ImageIcon color={colors.textMuted} size={24} />
            <Text className={styles.imagePickerText}>{placeholder}</Text>
          </View>
        )}
      </Pressable>
      {uri ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          className="min-h-[48px] justify-center self-start"
          onPress={() => onChange("")}
        >
          <Text className="font-ku-semibold text-ku-meta text-ku-primary">
            {removeLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  placeholder,
  onChange,
  error,
  clearLabel,
  onClear,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  clearLabel?: string;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed" || !selectedDate) {
      setOpen(false);
      return;
    }
    onChange(formatDateForApi(selectedDate));
    setOpen(false);
  };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date();
  return (
    <View className={styles.dateField}>
      <Text className="mb-[6px] font-ku-semibold text-ku-label text-ku-text-secondary">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ expanded: open }}
        className={styles.dateButton}
        onPress={() => setOpen(true)}
      >
        <Text className={value ? styles.dateText : styles.datePlaceholder}>
          {value || placeholder}
        </Text>
        <CalendarDays color={colors.textMuted} size={18} />
      </Pressable>
      {error ? (
        <Text
          accessibilityRole="alert"
          className="mt-[4px] font-ku-regular text-ku-label text-ku-danger"
        >
          {error}
        </Text>
      ) : null}
      {value && onClear && clearLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          className={styles.clearDate}
          onPress={onClear}
        >
          <Text className={styles.clearDateText}>{clearLabel}</Text>
        </Pressable>
      ) : null}
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

export type { ProfileEditMessages };
