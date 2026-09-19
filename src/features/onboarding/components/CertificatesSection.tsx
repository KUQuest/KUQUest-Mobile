import React from "react";
import { Image, Pressable, Text, View } from "@/tw";
import { CalendarDays, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { cn } from "@/tw/cn";
import * as Reanimated from "react-native-reanimated";

import { Input } from "@/components/ui/Input";
import styles from "@/features/onboarding/styles/registrationStyles";
import { colors } from "@/theme/colors";
import type { Certificate } from "../../profile/types";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { getOnboardingTransition, MotionView } from "./OnboardingMotion";

type Messages = (typeof onboardingMessages)["en"];

export interface CertificatesSectionProps {
  messages: Messages;
  locale: "en" | "th";
  certificates: Certificate[];
  errors: Record<string, string>;
  unavailable: boolean;
  reduceMotion: boolean;
  datePickerIndex: number | null;
  onUpdate: (index: number, field: keyof Certificate, value: string) => void;
  onPickImage: (index: number) => void;
  onOpenDatePicker: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

function formatDate(value: string, locale: "en" | "th"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
}

export function CertificatesSection({
  messages: msg,
  locale,
  certificates,
  errors,
  unavailable,
  reduceMotion,
  datePickerIndex,
  onUpdate,
  onPickImage,
  onOpenDatePicker,
  onRemove,
  onAdd,
}: CertificatesSectionProps) {
  return (
    <View className={styles.step3Section}>
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>{msg.certification}</Text>
      </View>
      <Text className={styles.sectionDesc}>{msg.certDesc}</Text>
      {certificates.map((cert, index) => (
        <MotionView
          key={`cert-${cert.id ?? index}`}
          entering={getOnboardingTransition("in", reduceMotion)}
          exiting={getOnboardingTransition("out", reduceMotion)}
          layout={reduceMotion ? undefined : Reanimated.LinearTransition}
          className={styles.itemCard}
        >
          <View className={styles.itemCardHeader}>
            <Text className={styles.itemLabel}>{msg.certification}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={msg.removeCertificate(index + 1)}
              onPress={() => onRemove(index)}
              className={styles.removeButton}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={msg.addImage}
            className={cn(styles.imageUploadBox, styles.certificateImageBox)}
            onPress={() => onPickImage(index)}
          >
            {cert.imageUri ? (
              <Image
                source={{ uri: cert.imageUri }}
                className={styles.uploadedImage}
                accessibilityRole="image"
                accessibilityLabel={msg.certificateImageLabel(index + 1)}
              />
            ) : (
              <View className={styles.imagePlaceholderContent}>
                <ImageIcon size={24} color={colors.textMuted} strokeWidth={2} />
                <Text className={styles.addImgText}>{msg.addImage}</Text>
              </View>
            )}
          </Pressable>
          <Input
            label={msg.certName}
            placeholder={msg.certName}
            value={cert.name}
            onChangeText={(value) => onUpdate(index, "name", value)}
            error={errors[`cert_${index}_name`]}
          />
          <Input
            label={msg.certIssuer}
            placeholder={msg.certIssuer}
            value={cert.issuer}
            onChangeText={(value) => onUpdate(index, "issuer", value)}
            error={errors[`cert_${index}_issuer`]}
          />
          <View className={styles.dateInputWrapper}>
            <Text className={styles.dateInputLabel}>{msg.certIssuedAt}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${msg.certIssuedAt}: ${formatDate(cert.issuedAt, locale) || msg.selectDate}`}
              accessibilityState={{ expanded: datePickerIndex === index }}
              className={cn(
                styles.dateInputBox,
                errors[`cert_${index}_issuedAt`] ? styles.dateInputError : null
              )}
              onPress={() => onOpenDatePicker(index, cert.issuedAt)}
            >
              <Text
                className={
                  cert.issuedAt
                    ? styles.dateInputTextActive
                    : styles.dateInputTextPlaceholder
                }
              >
                {formatDate(cert.issuedAt, locale) || msg.selectDate}
              </Text>
              <CalendarDays
                size={18}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </Pressable>
            {errors[`cert_${index}_issuedAt`] ? (
              <Text className={styles.fieldErrorText}>
                {errors[`cert_${index}_issuedAt`]}
              </Text>
            ) : null}
          </View>
        </MotionView>
      ))}
      {certificates.length === 0 ? (
        <View className={styles.emptySection}>
          <Text className={styles.emptySectionText}>
            {unavailable ? msg.optionalUnavailable : msg.optionalEmpty}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={msg.addMoreCert}
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        className={styles.addMoreBtn}
        onPress={onAdd}
      >
        <Text className={styles.addMoreBtnText}>{msg.addMoreCert}</Text>
      </Pressable>
    </View>
  );
}
