import React from "react";
import { Platform } from "react-native";
import { Trash2 } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
import type { ExperienceForm } from "../types";
import {
  DateField,
  type ProfileEditMessages,
  SaveBar,
  ScreenHeader,
} from "./ProfileEditFormParts";
import styles from "../profileEditStyles";

export interface ExperienceEditorProps {
  isExisting: boolean;
  form: ExperienceForm;
  messages: ProfileEditMessages;
  employmentTypes: ReadonlyArray<{ label: string; value: string }>;
  errors: Record<string, string>;
  saveError: string | null;
  saving: boolean;
  deleting: boolean;
  onBack: () => void;
  onRemove: () => void;
  onFieldChange: <K extends keyof ExperienceForm>(
    field: K,
    value: ExperienceForm[K]
  ) => void;
  onSave: () => void;
}

export function ExperienceEditor({
  isExisting,
  form,
  messages,
  employmentTypes,
  errors,
  saveError,
  saving,
  deleting,
  onBack,
  onRemove,
  onFieldChange,
  onSave,
}: ExperienceEditorProps) {
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
            title={
              isExisting
                ? messages.experienceEditTitle
                : messages.experienceAddTitle
            }
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
              {messages.experienceSection}
            </Text>
            <Text className={styles.formGroupHint}>
              {messages.experienceFormHint}
            </Text>
            <Input
              label={messages.experienceTitleLabel}
              placeholder={messages.experienceTitlePlaceholder}
              value={form.title}
              onChangeText={(value) => onFieldChange("title", value)}
              error={errors.title}
              maxLength={120}
            />
            <Select
              label={messages.employmentType}
              placeholder={messages.employmentTypePlaceholder}
              options={employmentTypes}
              value={form.employmentType}
              onValueChange={(value) => onFieldChange("employmentType", value)}
              error={errors.employmentType}
              closeLabel={messages.closeEmploymentType}
            />
            <Input
              label={messages.organizationOptional}
              placeholder={messages.organizationPlaceholder}
              value={form.organization}
              onChangeText={(value) => onFieldChange("organization", value)}
              maxLength={120}
            />
            <TextArea
              label={messages.detailOptional}
              placeholder={messages.detailPlaceholder}
              value={form.description}
              onChangeText={(value) => onFieldChange("description", value)}
              maxLength={1000}
            />
            <View className={styles.dateRow}>
              <DateField
                label={messages.startDate}
                placeholder={messages.startDatePlaceholder}
                value={form.startedAt}
                onChange={(value) => onFieldChange("startedAt", value)}
                error={errors.startedAt}
              />
              <DateField
                label={messages.endDateOptional}
                placeholder={messages.ongoingDatePlaceholder}
                value={form.endedAt}
                onChange={(value) => onFieldChange("endedAt", value)}
                onClear={() => onFieldChange("endedAt", "")}
                clearLabel={messages.markOngoing}
                error={errors.endedAt}
              />
            </View>
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
