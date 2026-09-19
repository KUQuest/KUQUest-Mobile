import React from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Pencil } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "../../../tw";
import { colors } from "../../../theme/colors";
import { ScreenLayout } from "../../../components/layout/ScreenLayout";
import styles from "../profileEditStyles";
import type { BasicsForm } from "../types";
import {
  type ProfileEditMessages,
  SaveBar,
  ScreenHeader,
} from "./ProfileEditFormParts";

export interface BasicsEditorProps {
  form: BasicsForm;
  messages: ProfileEditMessages;
  errors: Record<string, string>;
  saveError: string | null;
  saving: boolean;
  profileName: string;
  profileImageSource?: { uri: string; cacheKey?: string };
  avatarImageFailed: boolean;
  onBack: () => void;
  onFieldChange: <K extends keyof BasicsForm>(
    field: K,
    value: BasicsForm[K]
  ) => void;
  onAvatarImageError: () => void;
  onAvatarChange: (asset: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
  }) => void;
  onAvatarError: (message: string) => void;
  onSave: () => void;
}

export function BasicsEditor({
  form,
  messages,
  errors,
  saveError,
  saving,
  profileName,
  profileImageSource,
  avatarImageFailed,
  onBack,
  onFieldChange,
  onAvatarImageError,
  onAvatarChange,
  onAvatarError,
  onSave,
}: BasicsEditorProps) {
  const chooseAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        onAvatarError(messages.fileTooLarge);
        return;
      }
      onAvatarChange({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
    } catch {
      onAvatarError(messages.filePickerError);
    }
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={messages.basicsSection}
            backLabel={messages.back}
            onBack={onBack}
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>{messages.basics}</Text>
            <View className={styles.avatarPicker}>
              {profileImageSource && !avatarImageFailed ? (
                <Image
                  source={profileImageSource}
                  onError={onAvatarImageError}
                  className={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View className={styles.avatarFallback}>
                  <Text className={styles.avatarInitials}>
                    {profileName
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.changeAvatar}
                className={styles.avatarButton}
                onPress={() => void chooseAvatar()}
              >
                <Pencil color={colors.primary} size={15} />
                <Text className={styles.avatarButtonText}>
                  {messages.changeAvatar}
                </Text>
              </Pressable>
              <Text
                accessibilityRole={avatarImageFailed ? "alert" : undefined}
                className={
                  avatarImageFailed ? styles.avatarError : styles.avatarHelp
                }
              >
                {avatarImageFailed
                  ? messages.avatarPreviewError
                  : messages.avatarHelp}
              </Text>
            </View>
            <Input
              label={messages.name}
              placeholder={messages.namePlaceholder}
              value={form.name}
              onChangeText={(value) => onFieldChange("name", value)}
              error={errors.name}
              maxLength={201}
              autoCapitalize="words"
            />
            <TextArea
              label={messages.bio}
              placeholder={messages.bioPlaceholder}
              value={form.bio}
              onChangeText={(value) => onFieldChange("bio", value)}
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
          disabled={saving}
          onPress={onSave}
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
