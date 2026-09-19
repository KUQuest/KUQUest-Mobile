import React, { useState } from "react";
import {
  Modal,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { X } from "lucide-react-native";
import { cn } from "@/tw/cn";
import { colors } from "../../../theme/colors";
import styles from "../styles/profileComponentStyles";
import type { ProfileAccessibilityLabels, ProfileWork } from "./profileTypes";
import {
  GridRows,
  defaultAccessibilityLabels,
  imageSource,
  useReducedMotionPreference,
} from "./profileShared";
import { EmptyState, Section, type SectionNoticeProps } from "./ProfileSection";

function WorkImage({
  title,
  uri,
  source,
  noImageText,
  imageLabel,
}: {
  title: string;
  uri: string;
  source?: ImageSourcePropType;
  noImageText: string;
  imageLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!imageSource(uri, source) || failed)
    return (
      <View
        className={cn(styles.workImage, styles.imageFallback)}
        style={{ aspectRatio: 4 / 3 }}
      >
        <Text className={styles.imageFallbackText}>{noImageText}</Text>
      </View>
    );
  return (
    <Image
      accessibilityLabel={imageLabel}
      source={imageSource(uri, source)}
      onError={() => setFailed(true)}
      className={styles.workImage}
      style={{ aspectRatio: 4 / 3 }}
      contentFit="cover"
    />
  );
}

export function MyWork({
  works,
  sectionTitle,
  emptyText,
  noImageText,
  viewLabel,
  closeLabel,
  emptyActionLabel,
  onEditPress,
  accessibilityLabels,
  sectionBottomMargin,
  errorText,
  retryLabel,
  onRetry,
}: {
  works: ProfileWork[];
  sectionTitle: string;
  emptyText: string;
  noImageText: string;
  viewLabel: string;
  closeLabel: string;
  emptyActionLabel?: string;
  onEditPress?: () => void;
  accessibilityLabels?: Pick<ProfileAccessibilityLabels, "workImageLabel">;
  sectionBottomMargin?: number;
} & SectionNoticeProps) {
  const { width, height } = useWindowDimensions();
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const [selectedWork, setSelectedWork] = useState<ProfileWork | null>(null);
  const reduceMotion = useReducedMotionPreference();
  const galleryImageWidth = Math.min(width - 40, 360);
  const galleryImageHeight = Math.min(
    320,
    Math.max(220, Math.round(height * 0.4))
  );
  const workImages = selectedWork
    ? selectedWork.imageUris?.length
      ? selectedWork.imageUris
      : selectedWork.imageUri
        ? [selectedWork.imageUri]
        : selectedWork.imageSource
          ? [selectedWork.imageSource]
          : []
    : [];

  return (
    <>
      <Section
        title={sectionTitle}
        bottomMargin={sectionBottomMargin}
        errorText={errorText}
        retryLabel={retryLabel}
        onRetry={onRetry}
      >
        {() =>
          works.length > 0 ? (
            <GridRows
              items={works}
              renderItem={(work) => (
                <Pressable
                  key={work.id ?? `${work.title}-${work.imageUri}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${work.title}: ${viewLabel}`}
                  onPress={() => setSelectedWork(work)}
                  className={styles.workCard}
                >
                  <WorkImage
                    title={work.title}
                    uri={work.imageUri}
                    source={work.imageSource}
                    noImageText={noImageText}
                    imageLabel={labels.workImageLabel(work.title)}
                  />
                  <Text
                    className={styles.itemTitle}
                    numberOfLines={2}
                    maxFontSizeMultiplier={2}
                  >
                    {work.title}
                  </Text>
                  {work.detail ? (
                    <Text
                      className={styles.itemDescription}
                      numberOfLines={3}
                      maxFontSizeMultiplier={2}
                    >
                      {work.detail}
                    </Text>
                  ) : null}
                  <Text className={styles.previewHint}>{viewLabel}</Text>
                </Pressable>
              )}
            />
          ) : (
            <EmptyState
              message={emptyText}
              actionLabel={emptyActionLabel}
              onAction={onEditPress}
            />
          )
        }
      </Section>
      <Modal
        visible={Boolean(selectedWork)}
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setSelectedWork(null)}
      >
        <Pressable
          accessible={false}
          className={styles.previewOverlay}
          onPress={() => setSelectedWork(null)}
        >
          <Pressable
            accessible={false}
            accessibilityViewIsModal
            className={styles.workDetailSheet}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              className={styles.previewClose}
              onPress={() => setSelectedWork(null)}
            >
              <X color={colors.text} size={24} />
            </Pressable>
            <ScrollView
              showsVerticalScrollIndicator={false}
              className={styles.workDetailScroll}
              contentContainerClassName={styles.workDetailContent}
            >
              <Text
                accessibilityRole="header"
                className={styles.workDetailTitle}
              >
                {selectedWork?.title}
              </Text>
              {workImages.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  className={styles.workGallery}
                >
                  {workImages.map((image, index) => (
                    <Image
                      key={index}
                      accessibilityLabel={`${labels.workImageLabel(selectedWork?.title ?? "")} ${index + 1}`}
                      source={imageSource(image)}
                      className={styles.workGalleryImage}
                      style={{
                        height: galleryImageHeight,
                        width: galleryImageWidth,
                      }}
                      contentFit="contain"
                    />
                  ))}
                </ScrollView>
              ) : (
                <View
                  className={cn(styles.workGalleryImage, styles.imageFallback)}
                  style={{
                    height: galleryImageHeight,
                    width: galleryImageWidth,
                  }}
                >
                  <Text className={styles.imageFallbackText}>
                    {noImageText}
                  </Text>
                </View>
              )}
              {selectedWork?.detail ? (
                <Text className={styles.workDetailDescription}>
                  {selectedWork.detail}
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
