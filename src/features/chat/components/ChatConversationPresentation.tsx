import { ChevronLeft } from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Pressable, ScrollView, View } from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import styles from "../chatStyles";
import { cn } from "@/tw/cn";

export function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

export function ChatAvatar({
  initials: _initials,
  color,
  name,
  profileId,
  avatarUrl,
  avatarFileId,
  onPress,
  small = false,
}: {
  initials: string;
  color: string;
  name: string;
  profileId?: string;
  avatarUrl?: string;
  avatarFileId?: string;
  onPress?: () => void;
  small?: boolean;
}) {
  return (
    <Avatar
      accessibilityLabel={onPress ? `View profile of ${name}` : undefined}
      cacheKey={avatarFileId}
      className={cn(styles.avatar, small && styles.avatarSmall)}
      imageTestID={`chat-avatar-image-${profileId ?? name}`}
      name={name}
      onPress={onPress}
      size={small ? "small" : "medium"}
      style={{ backgroundColor: color }}
      testID={`chat-avatar-${profileId ?? name}`}
      textClassName={small ? styles.avatarSmallText : styles.avatarText}
      uri={avatarUrl}
    />
  );
}

export function ChatConversationSkeleton({
  loadingLabel,
  backLabel,
  onBack,
}: {
  loadingLabel: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <View className={styles.detailHeader}>
        <View className={styles.brandRow}>
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            className={styles.backButton}
            onPress={onBack}
            testID="chat-loading-back-button"
          >
            <ChevronLeft
              color={colors.primaryDeep}
              size={24}
              strokeWidth={2.5}
            />
          </Pressable>
          <SkeletonBlock
            variant="image"
            height={48}
            width={48}
            borderRadius={24}
          />
          <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.sm }}>
            <SkeletonBlock height={18} width="78%" borderRadius={4} />
            <SkeletonBlock height={15} width="56%" borderRadius={4} />
          </View>
        </View>
      </View>
      <LoadingSkeleton
        loadingLabel={loadingLabel}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID="chat-conversation-loading-skeleton"
      >
        <View style={{ flex: 1 }}>
          <View className={styles.contextCard}>
            <SkeletonBlock
              variant="image"
              height={40}
              width={40}
              borderRadius={12}
            />
            <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.sm }}>
              <SkeletonBlock height={14} width="42%" borderRadius={4} />
              <SkeletonBlock height={17} width="74%" borderRadius={4} />
            </View>
            <SkeletonBlock
              height={16}
              width={74}
              borderRadius={4}
              style={{ marginLeft: spacing.sm }}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.lg,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <SkeletonBlock height={22} width={58} borderRadius={12} />
            </View>
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                style={{
                  alignItems: item % 2 === 0 ? "flex-end" : "flex-start",
                  flexDirection: "row",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                {item % 2 === 1 ? (
                  <SkeletonBlock
                    variant="image"
                    height={36}
                    width={36}
                    borderRadius={18}
                  />
                ) : null}
                <View style={{ gap: spacing.xs, maxWidth: "78%" }}>
                  <SkeletonBlock
                    height={item % 2 === 0 ? 42 : 34}
                    width={item % 2 === 0 ? 178 : 142}
                    borderRadius={18}
                  />
                  <SkeletonBlock
                    height={13}
                    width={42}
                    borderRadius={4}
                    style={{
                      alignSelf: item % 2 === 0 ? "flex-end" : "flex-start",
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <View className={styles.composerWrap}>
            <SkeletonBlock height={56} borderRadius={28} />
          </View>
        </View>
      </LoadingSkeleton>
    </ScreenLayout>
  );
}
