import React from "react";
import { Platform } from "react-native";
import { Trash2 } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "../../../tw";
import { colors } from "../../../theme/colors";
import { ScreenLayout } from "../../../components/layout/ScreenLayout";
import type { PortfolioForm } from "../types";
import {
  ImagePickerField,
  type ProfileEditMessages,
  SaveBar,
  ScreenHeader,
} from "./ProfileEditFormParts";
import styles from "../profileEditStyles";

export interface PortfolioEditorProps {
  isExisting: boolean;
  form: PortfolioForm;
  messages: ProfileEditMessages;
  errors: Record<string, string>;
  saveError: string | null;
  saving: boolean;
  deleting: boolean;
  onBack: () => void;
  onRemove: () => void;
  onFieldChange: <K extends keyof PortfolioForm>(
    field: K,
    value: PortfolioForm[K]
  ) => void;
  onImageChange: (uri: string) => void;
  onImageError: (message: string) => void;
  onSave: () => void;
}

export function PortfolioEditor({
  isExisting,
  form,
  messages,
  errors,
  saveError,
  saving,
  deleting,
  onBack,
  onRemove,
  onFieldChange,
  onImageChange,
  onImageError,
  onSave,
}: PortfolioEditorProps) {
  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={isExisting ? messages.edit : messages.add}
            backLabel={messages.back}
            onBack={onBack}
            action={
              isExisting ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.remove}
                  accessibilityState={{ disabled: saving || deleting }}
                  disabled={saving || deleting}
                  className={styles.headerAction}
                  onPress={onRemove}
                >
                  <Trash2 color={colors.danger} size={20} />
                </Pressable>
              ) : undefined
            }
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>
              {messages.portfolioSection}
            </Text>
            <ImagePickerField
              label={messages.image}
              uri={form.imageUri}
              placeholder={messages.addImage}
              removeLabel={messages.removeImage}
              onChange={onImageChange}
              onError={onImageError}
            />
            <Input
              label={messages.titleLabel}
              placeholder={messages.titlePlaceholder}
              value={form.title}
              onChangeText={(value) => onFieldChange("title", value)}
              error={errors.title}
              maxLength={120}
            />
            <TextArea
              label={messages.detail}
              placeholder={messages.detailPlaceholder}
              value={form.description}
              onChangeText={(value) => onFieldChange("description", value)}
              maxLength={1000}
            />
          </View>
          {saveError ? (
            <View className={styles.errorCard} accessibilityRole="alert">
              <Text className={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
        <SaveBar
          label={saving ? messages.saving : messages.save}
          disabled={saving || deleting}
          onPress={onSave}
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
