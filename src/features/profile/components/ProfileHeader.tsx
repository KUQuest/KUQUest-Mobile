import React from "react";
import { cn } from "@/tw/cn";
import { Text, View } from "@/tw";
import { defaultAccessibilityLabels, imageSource } from "./profileShared";
import { useWindowDimensions } from "react-native";
import { Building2, Code2, GraduationCap, Pencil } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Chip } from "../../../components/ui/Chip";
import { Button } from "../../../components/ui/Button";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import {
  localizeDepartmentName,
  localizeFacultyName,
} from "@/locales/academicUnits";
import { localizeOccupationName } from "@/locales/registrationOnboarding";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import styles from "../styles/profileComponentStyles";
import type {
  ProfileAccessibilityLabels,
  ProfileViewData,
} from "./profileTypes";

interface ProfileHeaderProps {
  data: Pick<
    ProfileViewData,
    "name" | "faculty" | "occupation" | "department" | "profileImage"
  > &
    Partial<Pick<ProfileViewData, "tags">>;
  presentation?: "default" | "public";
  editProfileLabel?: string;
  onEditPress?: () => void;
  accessibilityLabels?: Pick<
    ProfileAccessibilityLabels,
    "profileImageLabel" | "questCategoriesLabel"
  >;
}

function ProfileMeta({
  icon: Icon,
  children,
}: {
  icon: typeof GraduationCap;
  children: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View className={styles.metaRow}>
      <Icon
        accessible={false}
        color={colors.textSecondary}
        size={16}
        strokeWidth={2}
      />
      <Text className={styles.meta} maxFontSizeMultiplier={2}>
        {children}
      </Text>
    </View>
  );
}

export function ProfileHeader({
  data,
  presentation = "default",
  editProfileLabel,
  onEditPress,
  accessibilityLabels,
}: ProfileHeaderProps) {
  const { width, fontScale } = useWindowDimensions();
  const { colors } = useAppTheme();
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const { locale } = useLocale();
  const facultyName = data.faculty
    ? localizeFacultyName(data.faculty, locale)
    : "";
  const departmentName = data.department
    ? localizeDepartmentName(data.department, locale)
    : "";
  const occupationName = data.occupation
    ? localizeOccupationName(data.occupation, locale)
    : "";
  const profileImage = imageSource(data.profileImage);
  const profileImageUri =
    profileImage &&
    typeof profileImage === "object" &&
    "uri" in profileImage &&
    typeof profileImage.uri === "string"
      ? profileImage.uri
      : undefined;
  const profileImageCacheKey =
    profileImage &&
    typeof profileImage === "object" &&
    "cacheKey" in profileImage &&
    typeof profileImage.cacheKey === "string"
      ? profileImage.cacheKey
      : undefined;

  return (
    <View
      testID="profile-header"
      className={styles.heroCard}
      style={{ padding: metrics.cardPadding }}
    >
      <View
        className={cn(
          styles.identityRow,
          (width < 360 || fontScale >= 1.3) && "flex-col items-start"
        )}
      >
        <Avatar
          accessibilityLabel={labels.profileImageLabel(data.name)}
          cacheKey={profileImageCacheKey}
          className={styles.photoFrame}
          name={data.name}
          size={presentation === "public" ? metrics.photoSize : 72}
          textClassName={styles.initials}
          uri={profileImageUri}
        />
        <View className={styles.identityContent}>
          <Text
            accessibilityRole="header"
            className={styles.name}
            maxFontSizeMultiplier={2}
            style={{
              fontSize: metrics.nameFontSize,
              lineHeight: Math.round(metrics.nameFontSize * 1.25),
            }}
          >
            {data.name}
          </Text>
          {occupationName ? (
            <ProfileMeta icon={GraduationCap}>{occupationName}</ProfileMeta>
          ) : null}
        </View>
      </View>
      {facultyName || departmentName ? (
        <View className={styles.metaList}>
          {facultyName ? (
            <ProfileMeta icon={Building2}>{facultyName}</ProfileMeta>
          ) : null}
          {departmentName ? (
            <ProfileMeta icon={Code2}>{departmentName}</ProfileMeta>
          ) : null}
        </View>
      ) : null}
      {(data.tags ?? []).length > 0 ? (
        <View className={styles.tagGroup}>
          <Text
            accessibilityRole="header"
            className={styles.tagGroupLabel}
            maxFontSizeMultiplier={2}
          >
            {labels.questCategoriesLabel}
          </Text>
          <View className={styles.tagList}>
            {(data.tags ?? []).map((tag) => (
              <Chip
                className="px-ku-10 py-ku-xs"
                key={tag.id ?? tag.name}
                label={tag.name}
                textClassName="font-ku-semibold text-ku-label"
                tone="tag"
              />
            ))}
          </View>
        </View>
      ) : null}
      {editProfileLabel && onEditPress ? (
        <Button
          onPress={onEditPress}
          variant="primary"
          accessibilityLabel={editProfileLabel}
        >
          <Pencil
            accessible={false}
            color={colors.onPrimary}
            size={16}
            strokeWidth={2}
          />
          <Text className={styles.editButtonText}>{editProfileLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}
