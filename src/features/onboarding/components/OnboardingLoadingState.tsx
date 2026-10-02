import type { OnboardingStep } from "@/features/auth/types";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { KeyboardAvoidingView, ScrollView, View } from "@/tw";
import { spacing } from "@/theme/spacing";
import styles from "../styles/registrationStyles";

export interface OnboardingLoadingStateProps {
  currentStep: OnboardingStep;
  loadingLabel: string;
}

export function OnboardingLoadingState({
  currentStep,
  loadingLabel,
}: OnboardingLoadingStateProps) {
  const { colors } = useAppTheme();
  const field = (key: string, height = 52) => (
    <View key={key} style={{ gap: spacing.xs }}>
      <SkeletonBlock height={14} width="42%" borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <LoadingSkeleton
        loadingLabel={loadingLabel}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID="onboarding-loading-skeleton"
      >
        <KeyboardAvoidingView className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View className={styles.headerSection} style={{ gap: spacing.xs }}>
              <SkeletonBlock height={34} width="48%" borderRadius={6} />
              <SkeletonBlock height={28} width="66%" borderRadius={6} />
              <SkeletonBlock height={20} width="34%" borderRadius={4} />
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.px6,
                  marginTop: spacing.sm,
                  width: "100%",
                }}
              >
                {[1, 2, 3].map((item) => (
                  <SkeletonBlock
                    key={item}
                    height={6}
                    borderRadius={4}
                    style={{ flex: 1 }}
                    testID={`onboarding-skeleton-progress-${item}`}
                  />
                ))}
              </View>
              {currentStep === 1 ? (
                <SkeletonBlock
                  variant="image"
                  height={80}
                  width={80}
                  borderRadius={40}
                  style={{ marginTop: spacing.sm }}
                  testID="onboarding-skeleton-avatar"
                />
              ) : null}
            </View>
            <View className={styles.formSection} style={{ gap: spacing.md }}>
              {currentStep === 1 ? (
                <>
                  {[
                    "name",
                    "telephone",
                    "occupation",
                    "faculty",
                    "department",
                  ].map((key) => field(key))}
                  <View style={{ gap: spacing.xs }}>
                    <SkeletonBlock height={14} width="48%" borderRadius={4} />
                    <SkeletonBlock height={84} borderRadius={12} />
                  </View>
                  <SkeletonBlock height={48} borderRadius={10} />
                </>
              ) : currentStep === 2 ? (
                <>
                  <View style={{ gap: spacing.xs }}>
                    <SkeletonBlock height={24} width="54%" borderRadius={5} />
                    <SkeletonBlock height={18} width="82%" borderRadius={4} />
                  </View>
                  {field("description", 168)}
                </>
              ) : (
                <>
                  <SkeletonBlock height={20} width="76%" borderRadius={5} />
                  {[1, 2].map((item) => (
                    <View
                      key={item}
                      style={{
                        gap: spacing.md,
                        paddingBottom: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                      }}
                    >
                      <SkeletonBlock height={16} width="38%" borderRadius={4} />
                      <SkeletonBlock
                        variant="image"
                        height={104}
                        borderRadius={12}
                      />
                      {["title", "issuer", "date"].map((key) =>
                        field(`${item}-${key}`, 48)
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>
          </ScrollView>
          <View className={styles.actionBar}>
            <View className={styles.actionButtons}>
              <SkeletonBlock
                height={48}
                borderRadius={24}
                style={{ flex: 1 }}
                testID="onboarding-skeleton-back"
              />
              <SkeletonBlock
                height={48}
                borderRadius={24}
                style={{ flex: 1 }}
                testID="onboarding-skeleton-next"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </LoadingSkeleton>
    </ScreenLayout>
  );
}
