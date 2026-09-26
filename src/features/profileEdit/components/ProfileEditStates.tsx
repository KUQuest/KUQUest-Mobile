import { Pressable, ScrollView, Text, View } from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/theme/spacing";
import type { ProfileEditMessages } from "@/locales/profileEditMessages";
import { ScreenHeader } from "./ProfileEditFormParts";
import styles from "../profileEditStyles";

export function UnavailableState({ message }: { message: string }) {
  return (
    <View className={styles.statusCard} accessibilityRole="alert">
      <Text className={styles.statusText}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  retry,
  retryLabel,
}: {
  message: string;
  retry: () => void;
  retryLabel: string;
}) {
  return (
    <View className={styles.statusCard} accessibilityRole="alert">
      <Text className={styles.statusText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        className={styles.retryButton}
        onPress={retry}
      >
        <Text className={styles.retryButtonText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

export type ProfileEditLoadingVariant =
  | "hub"
  | "basics-editor"
  | "experience-list"
  | "experience-editor"
  | "portfolio-list"
  | "portfolio-editor"
  | "certificates-list"
  | "certificates-editor";

function SkeletonFormField({
  width = "46%",
  height = 48,
  testID,
}: {
  width?: `${number}%`;
  height?: number;
  testID?: string;
}) {
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <SkeletonBlock height={14} width={width} borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );
}

export function ProfileEditLoadingState({
  variant,
  messages,
  onBack,
}: {
  variant: ProfileEditLoadingVariant;
  messages: ProfileEditMessages;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isEditor = variant.endsWith("-editor");
  const title =
    variant === "hub"
      ? messages.title
      : variant === "basics-editor"
        ? messages.basicsSection
        : variant.startsWith("experience")
          ? messages.experienceSection
          : variant.startsWith("portfolio")
            ? messages.portfolioSection
            : messages.certificatesSection;
  const listSection = variant !== "hub" && !isEditor;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <ScreenHeader title={title} backLabel={messages.back} onBack={onBack} />
      </View>
      <LoadingSkeleton
        loadingLabel={messages.loading}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID={`profile-edit-loading-skeleton-${variant}`}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerClassName={
              listSection || variant === "hub"
                ? styles.scrollContent
                : styles.formContent
            }
            contentContainerStyle={{ paddingTop: spacing.px0 }}
            showsVerticalScrollIndicator={false}
          >
            {variant === "hub" ? (
              <>
                <SkeletonBlock height={18} width="88%" borderRadius={4} />
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  {[1, 2, 3, 4].map((item) => (
                    <View
                      key={item}
                      className={styles.sectionRow}
                      style={{ gap: spacing.px12 }}
                    >
                      <View style={{ flex: 1, gap: spacing.px6 }}>
                        <SkeletonBlock
                          height={20}
                          width="48%"
                          borderRadius={4}
                        />
                        <SkeletonBlock
                          height={14}
                          width={item === 1 ? "84%" : "42%"}
                          borderRadius={4}
                        />
                      </View>
                      <SkeletonBlock height={22} width={22} borderRadius={11} />
                    </View>
                  ))}
                </View>
              </>
            ) : listSection ? (
              <View style={{ gap: spacing.sm }}>
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    className={styles.itemRow}
                    style={{ gap: spacing.px12 }}
                  >
                    {variant === "portfolio-list" ||
                    variant === "certificates-list" ? (
                      <SkeletonBlock
                        variant="image"
                        height={64}
                        width={64}
                        borderRadius={10}
                      />
                    ) : null}
                    <View style={{ flex: 1, gap: spacing.px6 }}>
                      <SkeletonBlock height={20} width="64%" borderRadius={4} />
                      <SkeletonBlock height={15} width="48%" borderRadius={4} />
                      <SkeletonBlock height={14} width="78%" borderRadius={4} />
                    </View>
                    <SkeletonBlock height={18} width={18} borderRadius={9} />
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.formGroup} style={{ gap: spacing.px12 }}>
                <SkeletonBlock height={22} width="46%" borderRadius={5} />
                {variant === "basics-editor" ? (
                  <>
                    <SkeletonBlock
                      variant="image"
                      height={96}
                      width={96}
                      borderRadius={48}
                      testID="profile-edit-skeleton-avatar"
                    />
                    <SkeletonBlock height={48} width={132} borderRadius={24} />
                    <SkeletonFormField width="38%" />
                    <SkeletonFormField width="44%" height={132} />
                  </>
                ) : variant === "experience-editor" ? (
                  <>
                    <SkeletonBlock height={18} width="82%" borderRadius={4} />
                    <SkeletonFormField width="58%" />
                    <SkeletonFormField width="54%" />
                    <SkeletonFormField width="44%" height={120} />
                    <View style={{ flexDirection: "row", gap: spacing.md }}>
                      <SkeletonFormField width="64%" />
                      <SkeletonFormField width="64%" />
                    </View>
                  </>
                ) : variant === "certificates-editor" ? (
                  <>
                    <SkeletonBlock
                      variant="image"
                      height={128}
                      borderRadius={12}
                      testID="profile-edit-skeleton-certificate-image"
                    />
                    <View
                      style={{ gap: spacing.px12 }}
                      testID="profile-edit-skeleton-certificate-fields"
                    >
                      <SkeletonFormField
                        width="72%"
                        testID="profile-edit-skeleton-certificate-name"
                      />
                      <SkeletonFormField
                        width="58%"
                        testID="profile-edit-skeleton-certificate-issuer"
                      />
                      <SkeletonFormField
                        width="42%"
                        testID="profile-edit-skeleton-certificate-issued-at"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <SkeletonFormField width="32%" height={120} />
                    <SkeletonFormField width="52%" />
                    <SkeletonFormField width="44%" height={132} />
                  </>
                )}
              </View>
            )}
          </ScrollView>
          {isEditor ? (
            <View
              className={styles.saveBar}
              style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
            >
              <View className={styles.saveBarInner}>
                <SkeletonBlock
                  height={48}
                  borderRadius={24}
                  testID="profile-edit-loading-save"
                />
              </View>
            </View>
          ) : null}
        </View>
      </LoadingSkeleton>
    </ScreenLayout>
  );
}
