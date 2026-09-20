import React from "react";
import { Image, Pressable, Text, View } from "@/tw";
import { Image as ImageIcon, Trash2 } from "lucide-react-native";
import * as Reanimated from "react-native-reanimated";

import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import styles from "@/features/onboarding/styles/registrationStyles";
import { colors } from "@/theme/colors";
import type { Work } from "../../profile/types";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { getOnboardingTransition, MotionView } from "./OnboardingMotion";

type Messages = (typeof onboardingMessages)["en"];

export interface WorksSectionProps {
  messages: Messages;
  works: Work[];
  errors: Record<string, string>;
  unavailable: boolean;
  reduceMotion: boolean;
  onUpdate: (index: number, field: keyof Work, value: string) => void;
  onPickImage: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function WorksSection({
  messages: msg,
  works,
  errors,
  unavailable,
  reduceMotion,
  onUpdate,
  onPickImage,
  onRemove,
  onAdd,
}: WorksSectionProps) {
  return (
    <View className={styles.step3Section}>
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>{msg.myWorks}</Text>
      </View>
      <Text className={styles.sectionDesc}>{msg.workDesc}</Text>
      {works.map((work, index) => (
        <MotionView
          key={`work-${work.id ?? index}`}
          entering={getOnboardingTransition("in", reduceMotion)}
          exiting={getOnboardingTransition("out", reduceMotion)}
          layout={reduceMotion ? undefined : Reanimated.LinearTransition}
          className={styles.itemCard}
        >
          <View className={styles.itemCardHeader}>
            <Text className={styles.itemLabel}>{msg.myWorks}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={msg.removeWork(index + 1)}
              onPress={() => onRemove(index)}
              className={styles.removeButton}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={msg.addImage}
            className={styles.imageUploadBox}
            onPress={() => onPickImage(index)}
          >
            {work.imageUri ? (
              <Image
                source={{ uri: work.imageUri }}
                className={styles.uploadedImage}
                accessibilityRole="image"
                accessibilityLabel={msg.workImageLabel(index + 1)}
              />
            ) : (
              <View className={styles.imagePlaceholderContent}>
                <ImageIcon size={24} color={colors.textMuted} strokeWidth={2} />
                <Text className={styles.addImgText}>{msg.addImage}</Text>
              </View>
            )}
          </Pressable>
          <Input
            label={msg.workTitle}
            placeholder={msg.workTitle}
            value={work.title}
            onChangeText={(title) => onUpdate(index, "title", title)}
            error={errors[`work_${index}_title`]}
          />
          <TextArea
            label={msg.workDetailLabel}
            accessibilityLabel={msg.workDetailLabel}
            placeholder={msg.detailProject}
            value={work.detail}
            onChangeText={(detail) => onUpdate(index, "detail", detail)}
            maxLength={1000}
          />
        </MotionView>
      ))}
      {works.length === 0 ? (
        <View className={styles.emptySection}>
          <Text className={styles.emptySectionText}>
            {unavailable ? msg.optionalUnavailable : msg.optionalEmpty}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={msg.addMoreWorks}
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        className={styles.addMoreBtn}
        onPress={onAdd}
      >
        <Text className={styles.addMoreBtnText}>{msg.addMoreWorks}</Text>
      </Pressable>
    </View>
  );
}
