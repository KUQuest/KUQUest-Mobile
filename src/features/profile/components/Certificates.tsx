import React, { useState } from "react";
import {
  Modal,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { X } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import type {
  ProfileAccessibilityLabels,
  ProfileCertificate,
} from "./profileTypes";
import styles from "../styles/profileComponentStyles";
import {
  GridRows,
  defaultAccessibilityLabels,
  imageSource,
  useReducedMotionPreference,
} from "./profileShared";
import { EmptyState, Section, type SectionNoticeProps } from "./ProfileSection";

function CertificateThumbnail({
  certificate,
  unavailableText,
  imageLabel,
  failed,
  onFailed,
}: {
  certificate: ProfileCertificate;
  unavailableText: string;
  imageLabel: string;
  failed: boolean;
  onFailed: () => void;
}) {
  const source = imageSource(certificate.link, certificate.imageSource);
  if (!source || failed)
    return <Text className={styles.imageFallbackText}>{unavailableText}</Text>;
  return (
    <Image
      accessibilityLabel={imageLabel}
      source={source}
      onError={onFailed}
      className={styles.certificateImage}
      contentFit="cover"
    />
  );
}

function CertificateImage({
  uri,
  source,
  unavailableText,
  imageLabel,
  previewHeight,
  onFailed,
}: {
  uri: string;
  source?: ImageSourcePropType;
  unavailableText: string;
  imageLabel: string;
  previewHeight: number;
  onFailed: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSource = imageSource(uri, source);
  if (!resolvedSource || failed)
    return <Text className={styles.emptyText}>{unavailableText}</Text>;
  return (
    <Image
      testID="certificate-preview-image"
      accessibilityLabel={imageLabel}
      source={resolvedSource}
      onError={() => {
        setFailed(true);
        onFailed();
      }}
      className={styles.previewImage}
      style={{ height: previewHeight, width: "100%" }}
      contentFit="contain"
    />
  );
}

export function Certificates({
  certificates,
  sectionTitle,
  emptyText,
  previewUnavailableText,
  closeLabel,
  unavailableText,
  previewLabel = "View certificate preview",
  emptyActionLabel,
  onEditPress,
  accessibilityLabels,
  errorText,
  retryLabel,
  onRetry,
}: {
  certificates: ProfileCertificate[];
  sectionTitle: string;
  emptyText: string;
  previewUnavailableText: string;
  closeLabel: string;
  unavailableText: string;
  previewLabel?: string;
  emptyActionLabel?: string;
  onEditPress?: () => void;
  accessibilityLabels?: Pick<
    ProfileAccessibilityLabels,
    "certificatePreviewLabel" | "certificateImageLabel"
  >;
} & SectionNoticeProps) {
  const { height } = useWindowDimensions();
  const [preview, setPreview] = useState<ProfileCertificate | null>(null);
  const [failedCertificateIds, setFailedCertificateIds] = useState<Set<string>>(
    () => new Set()
  );
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const reduceMotion = useReducedMotionPreference();
  const previewHeight = Math.min(520, Math.max(280, Math.round(height * 0.58)));

  return (
    <>
      <Section
        title={sectionTitle}
        errorText={errorText}
        retryLabel={retryLabel}
        onRetry={onRetry}
      >
        {() =>
          certificates.length > 0 ? (
            <GridRows
              items={certificates}
              renderItem={(certificate) => {
                const certificateKey =
                  certificate.id ?? `${certificate.title}-${certificate.link}`;
                const hasPreview =
                  Boolean(
                    imageSource(certificate.link, certificate.imageSource)
                  ) && !failedCertificateIds.has(certificateKey);
                return (
                  <Pressable
                    key={certificateKey}
                    accessibilityRole="button"
                    accessibilityLabel={
                      hasPreview
                        ? labels.certificatePreviewLabel(certificate.title)
                        : `${certificate.title} ${previewUnavailableText}`
                    }
                    disabled={!hasPreview}
                    onPress={() => setPreview(certificate)}
                    className={styles.certificateCard}
                  >
                    <View
                      className={styles.certificateImageFrame}
                      style={{ aspectRatio: 4 / 3 }}
                    >
                      <CertificateThumbnail
                        certificate={certificate}
                        unavailableText={previewUnavailableText}
                        imageLabel={labels.certificateImageLabel(
                          certificate.title
                        )}
                        failed={failedCertificateIds.has(certificateKey)}
                        onFailed={() =>
                          setFailedCertificateIds((current) =>
                            new Set(current).add(certificateKey)
                          )
                        }
                      />
                    </View>
                    <Text className={styles.itemTitle} numberOfLines={2}>
                      {certificate.title}
                    </Text>
                    {hasPreview ? (
                      <Text className={styles.previewHint}>{previewLabel}</Text>
                    ) : null}
                    <Text className={styles.certificateIssuer}>
                      {certificate.issuer}
                    </Text>
                    <Text className={styles.itemMeta}>
                      {certificate.issuedYear}
                    </Text>
                  </Pressable>
                );
              }}
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
        visible={Boolean(preview)}
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setPreview(null)}
      >
        <Pressable
          accessible={false}
          className={styles.previewOverlay}
          onPress={() => setPreview(null)}
        >
          <Pressable
            accessible={false}
            accessibilityViewIsModal
            className={styles.previewCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              className={styles.previewClose}
              onPress={() => setPreview(null)}
            >
              <X color={colors.text} size={24} />
            </Pressable>
            {preview ? (
              <ScrollView
                className={styles.previewScroll}
                style={{ height: previewHeight, width: "100%" }}
                showsVerticalScrollIndicator={false}
              >
                <CertificateImage
                  uri={preview.link}
                  source={preview.imageSource}
                  unavailableText={unavailableText}
                  imageLabel={labels.certificateImageLabel(preview.title)}
                  previewHeight={previewHeight}
                  onFailed={() => {
                    const certificateKey =
                      preview.id ?? `${preview.title}-${preview.link}`;
                    setFailedCertificateIds((current) =>
                      new Set(current).add(certificateKey)
                    );
                  }}
                />
              </ScrollView>
            ) : null}
            <Text className={styles.previewTitle}>{preview?.title}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
