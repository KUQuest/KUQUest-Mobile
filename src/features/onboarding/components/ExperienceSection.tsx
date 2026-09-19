import React from "react";
import { Pressable, Text, View } from "@/tw";
import { CalendarDays, Trash2 } from "lucide-react-native";
import { cn } from "@/tw/cn";
import * as Reanimated from "react-native-reanimated";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import styles from "@/features/onboarding/styles/registrationStyles";
import { colors } from "@/theme/colors";
import type { Experience } from "../../profile/types";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { getOnboardingTransition, MotionView } from "./OnboardingMotion";

type Messages = (typeof onboardingMessages)["en"];

type ExperienceDateField = "startedAt" | "endedAt";

export interface ExperienceSectionProps {
  messages: Messages;
  locale: "en" | "th";
  experiences: Experience[];
  errors: Record<string, string>;
  unavailable: boolean;
  reduceMotion: boolean;
  onUpdate: (index: number, field: keyof Experience, value: string) => void;
  onOpenDatePicker: (
    index: number,
    field: ExperienceDateField,
    value: string
  ) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

function formatMonthYear(value: string, locale: "en" | "th"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
      }).format(date);
}

export function ExperienceSection({
  messages: msg,
  locale,
  experiences,
  errors,
  unavailable,
  reduceMotion,
  onUpdate,
  onOpenDatePicker,
  onRemove,
  onAdd,
}: ExperienceSectionProps) {
  return (
    <View className={styles.step3Section}>
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>{msg.experience}</Text>
      </View>
      <Text className={styles.sectionDesc}>{msg.expDesc}</Text>
      {experiences.map((experience, index) => (
        <MotionView
          key={`experience-${experience.id ?? index}`}
          entering={getOnboardingTransition("in", reduceMotion)}
          exiting={getOnboardingTransition("out", reduceMotion)}
          layout={reduceMotion ? undefined : Reanimated.LinearTransition}
          className={styles.itemCard}
        >
          <View className={styles.itemCardHeader}>
            <Text className={styles.itemLabel}>{msg.experience}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={msg.removeExperience(index + 1)}
              onPress={() => onRemove(index)}
              className={styles.removeButton}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </View>
          <Input
            label={msg.jobTitle}
            placeholder={msg.jobTitle}
            value={experience.title}
            onChangeText={(value) => onUpdate(index, "title", value)}
            error={errors[`experience_${index}_title`]}
          />
          <Select
            label={msg.employmentType}
            placeholder={msg.employmentTypePlaceholder}
            options={msg.employmentTypes}
            value={experience.employmentType}
            onValueChange={(value) => onUpdate(index, "employmentType", value)}
            error={errors[`experience_${index}_employmentType`]}
            closeLabel={msg.closeSelect}
          />
          <Input
            label={msg.organization}
            placeholder={msg.organization}
            value={experience.organization}
            onChangeText={(value) => onUpdate(index, "organization", value)}
          />
          <TextArea
            label={msg.experienceDescriptionLabel}
            placeholder={msg.experienceDescriptionPlaceholder}
            value={experience.description}
            onChangeText={(value) => onUpdate(index, "description", value)}
            maxLength={1000}
          />
          <ExperienceDateFieldInput
            label={msg.startMonthYear}
            value={experience.startedAt}
            displayValue={
              formatMonthYear(experience.startedAt, locale) ||
              msg.startMonthYear
            }
            error={errors[`experience_${index}_startedAt`]}
            onPress={() =>
              onOpenDatePicker(index, "startedAt", experience.startedAt)
            }
          />
          <View className={styles.dateInputWrapper}>
            <Text className={styles.dateInputLabel}>{msg.endMonthYear}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                formatMonthYear(experience.endedAt, locale) || msg.present
              }
              className={cn(
                styles.dateInputBox,
                errors[`experience_${index}_endedAt`]
                  ? styles.dateInputError
                  : null
              )}
              onPress={() =>
                onOpenDatePicker(index, "endedAt", experience.endedAt)
              }
            >
              <Text
                className={
                  experience.endedAt
                    ? styles.dateInputTextActive
                    : styles.dateInputTextPlaceholder
                }
              >
                {formatMonthYear(experience.endedAt, locale) || msg.present}
              </Text>
              <CalendarDays
                size={18}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </Pressable>
            {experience.endedAt ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg.present}
                onPress={() => onUpdate(index, "endedAt", "")}
              >
                <Text className={styles.addImgText}>{msg.present}</Text>
              </Pressable>
            ) : null}
            {errors[`experience_${index}_endedAt`] ? (
              <Text className={styles.fieldErrorText}>
                {errors[`experience_${index}_endedAt`]}
              </Text>
            ) : null}
          </View>
        </MotionView>
      ))}
      {experiences.length === 0 ? (
        <View className={styles.emptySection}>
          <Text className={styles.emptySectionText}>
            {unavailable ? msg.optionalUnavailable : msg.optionalEmpty}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={msg.addMoreExp}
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        className={styles.addMoreBtn}
        onPress={onAdd}
      >
        <Text className={styles.addMoreBtnText}>{msg.addMoreExp}</Text>
      </Pressable>
    </View>
  );
}

function ExperienceDateFieldInput({
  label,
  value,
  displayValue,
  error,
  onPress,
}: {
  label: string;
  value: string;
  displayValue: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View className={styles.dateInputWrapper}>
      <Text className={styles.dateInputLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={displayValue || label}
        className={cn(
          styles.dateInputBox,
          error ? styles.dateInputError : null
        )}
        onPress={onPress}
      >
        <Text
          className={
            value ? styles.dateInputTextActive : styles.dateInputTextPlaceholder
          }
        >
          {displayValue}
        </Text>
        <CalendarDays size={18} color={colors.textMuted} strokeWidth={2} />
      </Pressable>
      {error ? <Text className={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}
