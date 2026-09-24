import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import {
  BriefcaseBusiness,
  ChevronLeft,
  Code2,
  GraduationCap,
  MessageSquare,
  UserRound,
} from "lucide-react-native";

import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { ScreenLayout } from "../../components/layout/ScreenLayout";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { formatDisplayMonthYear } from "./profileFormatting";
import { getProfileLayoutMetrics } from "@/theme/profileLayout";
import { spacing } from "@/theme/spacing";
import { useLocale } from "@/features/preferences/localeStore";
import { profileMessages } from "@/locales/profileMessages";
import {
  usePublicProfileQuery,
  usePublicProfileReviewsQuery,
} from "./api/profileQueries";
import { AboutMe } from "./components/AboutMe";
import { Certificates } from "./components/Certificates";
import { Experience } from "./components/Experience";
import { MyWork } from "./components/MyWork";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileSkeleton } from "./components/ProfileSkeleton";
import { ProfileStats } from "./components/ProfileStats";
import { Reviews } from "./components/Reviews";
import type {
  ProfileCertificate,
  ProfileExperience,
  ProfileReview,
  ProfileStatsData,
  ProfileWork,
} from "./components/profileTypes";

type PublicProfileTab =
  "about" | "experience" | "works" | "certificates" | "reviews";

function sortExperiences(
  experiences: ProfileExperience[]
): ProfileExperience[] {
  return experiences
    .map((experience, index) => ({ experience, index }))
    .sort((left, right) => {
      const leftStartedAt = Date.parse(left.experience.startedAt);
      const rightStartedAt = Date.parse(right.experience.startedAt);
      const leftTime = Number.isNaN(leftStartedAt)
        ? Number.NEGATIVE_INFINITY
        : leftStartedAt;
      const rightTime = Number.isNaN(rightStartedAt)
        ? Number.NEGATIVE_INFINITY
        : rightStartedAt;
      return rightTime - leftTime || left.index - right.index;
    })
    .map(({ experience }) => experience);
}

export default function PublicProfileScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const userId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const { width, fontScale } = useWindowDimensions();
  const { locale } = useLocale();
  const messages = profileMessages[locale];
  const layoutMetrics = getProfileLayoutMetrics(width, fontScale);

  const [activeTab, setActiveTab] = useState<PublicProfileTab>("about");
  const profileQuery = usePublicProfileQuery(userId);
  const reviewsQuery = usePublicProfileReviewsQuery(userId);
  const profile = profileQuery.data;
  const reviewsData = reviewsQuery.isError ? undefined : reviewsQuery.data;
  const profileErrorMessage = !userId
    ? "User ID is required"
    : profileQuery.isError
      ? profileQuery.error instanceof Error
        ? profileQuery.error.message
        : messages.error
      : null;
  const reviewsUnavailable = Boolean(profile) && reviewsQuery.isError;

  const displayName = useMemo(() => {
    if (!profile) return "";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  }, [profile]);

  const facultyName = profile?.department?.faculty?.name ?? "";
  const departmentName = profile?.department?.name ?? "";
  const occupationName = profile?.occupation?.name ?? "";
  const avatarUrl = profile?.avatar?.url ?? "";
  const avatarFileId = profile?.avatar?.fileId;
  const bio = profile?.bio ?? "";

  const experiences = useMemo<ProfileExperience[]>(() => {
    if (!profile?.experience?.length) return [];
    const mapped = profile.experience.map((entry) => ({
      id: entry.id,
      title: entry.title,
      employmentType: entry.employmentType,
      organization: entry.organization ?? "",
      description: entry.description ?? "",
      startedAt: entry.startedAt,
      endedAt: entry.endedAt ?? null,
    }));
    return sortExperiences(mapped);
  }, [profile]);

  const works = useMemo<ProfileWork[]>(() => {
    if (!profile?.portfolio?.length) return [];
    return profile.portfolio.map((entry) => ({
      id: entry.id,
      title: entry.title,
      detail: entry.description ?? "",
      imageUri: entry.images[0]?.url ?? "",
      imageUris: entry.images
        .slice()
        .sort(
          (left, right) =>
            Number(left.position ?? 0) - Number(right.position ?? 0)
        )
        .map((image) => image.url),
    }));
  }, [profile]);

  const certificates = useMemo<ProfileCertificate[]>(() => {
    if (!profile?.certificates?.length) return [];
    return profile.certificates.map((cert) => ({
      id: cert.id,
      title: cert.name,
      issuer: cert.issuer,
      issuedYear:
        formatDisplayMonthYear(cert.issuedAt, locale).split(" ").pop() ??
        cert.issuedAt,
      link: cert.image?.url ?? "",
    }));
  }, [profile, locale]);

  const reviews = useMemo<ProfileReview[]>(() => {
    if (!reviewsData?.items?.length) return [];
    return reviewsData.items.map((rev) => ({
      id: rev.id,
      reviewerName: rev.reviewer.displayName,
      reviewerAvatar: rev.reviewer.avatar?.url ?? "",
      rating: typeof rev.rating === "number" ? rev.rating : Number(rev.rating),
      comment: rev.comment ?? "",
      createdAt: rev.createdAt,
      questTitle: rev.quest?.title ?? "",
    }));
  }, [reviewsData]);

  const statsData = useMemo<ProfileStatsData>(
    () => ({
      totalQuests: null,
      ratingAverage: null,
      ratingCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }),
    []
  );

  const tabs: {
    key: PublicProfileTab;
    label: string;
    icon: typeof UserRound;
  }[] = useMemo(
    () => [
      { key: "about", label: messages.about, icon: UserRound },
      {
        key: "experience",
        label: messages.experience,
        icon: BriefcaseBusiness,
      },
      {
        key: "works",
        label: messages.works || messages.portfolioWork,
        icon: Code2,
      },
      {
        key: "certificates",
        label: messages.certificates,
        icon: GraduationCap,
      },
      { key: "reviews", label: messages.reviews, icon: MessageSquare },
    ],
    [messages]
  );

  const topBar = (
    <View className="flex-row items-center justify-between border-b border-ku-border-subtle bg-ku-surface px-ku-md py-ku-sm">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messages.back ?? "Back"}
        testID="public-profile-back-button"
        hitSlop={8}
        onPress={() => router.back()}
        className="h-[48px] w-[48px] items-center justify-center rounded-ku-pill active:bg-ku-surface-muted"
      >
        <ChevronLeft color={colors.primaryDeep} size={24} strokeWidth={2.5} />
      </Pressable>
      <View className="flex-1 items-center justify-center px-ku-sm">
        <Image
          accessibilityLabel="KUQuest"
          contentFit="contain"
          source={require("../../../topbar-logo.svg")}
          style={{ height: 24, width: 70 }}
        />
        <Text
          numberOfLines={1}
          className="mt-ku-2 font-ku-semibold text-ku-caption text-ku-text-strong"
          testID="public-profile-header-name"
        >
          {displayName || messages.title}
        </Text>
      </View>
      <View className="w-[48px]" />
    </View>
  );

  const stickyProfileTabs = (
    <View
      className="border-b border-ku-border-subtle bg-ku-surface py-ku-sm"
      testID="public-profile-tabs"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-ku-sm px-ku-md"
        accessibilityRole="tablist"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isSelected = activeTab === key;
          return (
            <Chip
              accessibilityLabel={label}
              className="min-h-[48px] gap-ku-6 px-ku-md py-ku-sm"
              key={key}
              label={label}
              leadingIcon={
                <Icon
                  size={16}
                  color={isSelected ? colors.onPrimary : colors.textSecondary}
                  strokeWidth={2}
                />
              }
              onPress={() => setActiveTab(key)}
              selected={isSelected}
              testID={`public-profile-tab-${key}`}
              textClassName="font-ku-semibold text-xs"
              tone="tab"
            />
          );
        })}
      </ScrollView>
    </View>
  );

  const profileHeader = (
    <View>
      <ProfileHeader
        presentation="public"
        data={{
          name: displayName,
          faculty: facultyName,
          department: departmentName,
          occupation: occupationName,
          profileImage: avatarUrl
            ? { uri: avatarUrl, cacheKey: avatarFileId }
            : "",
        }}
        unavailableTagsText={`${messages.questCategoriesLabel}: ${messages.sectionUnavailable}`}
        accessibilityLabels={{
          profileImageLabel: messages.profileImageLabel,
          questCategoriesLabel: messages.questCategoriesLabel,
        }}
      />
      {bio ? (
        <View className="mt-ku-12 rounded-ku-card border border-ku-border-subtle bg-ku-surface p-ku-12">
          <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
            {bio}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const profileStats = (
    <ProfileStats
      stats={statsData}
      ratingLabel={messages.rating}
      questsLabel={messages.totalQuests}
      reviewsLabel={messages.reviews}
      noRatingLabel={messages.noRating}
      accessibilityLabel={messages.statisticsLabel}
      errorText={`${messages.rating}: ${messages.ratingUnavailable} ${messages.totalQuests}: ${messages.sectionUnavailable}`}
    />
  );

  const profileChrome = (
    <View className="gap-ku-12">
      {profileHeader}
      {profileStats}
      {stickyProfileTabs}
    </View>
  );

  if (profileQuery.isPending) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="flex-1 bg-ku-surface"
      >
        {topBar}
        <ProfileSkeleton
          activeTab={activeTab}
          loadingLabel={messages.loading}
          width={width}
          fontScale={fontScale}
        />
      </ScreenLayout>
    );
  }

  if (profileErrorMessage && !profile) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="flex-1 bg-ku-surface"
      >
        {topBar}
        <View className="flex-1 items-center justify-center p-ku-lg">
          <Text className="mb-ku-md text-center text-ku-text-secondary">
            {profileErrorMessage}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void profileQuery.refetch()}
            className="min-h-[48px] min-w-[140px] items-center justify-center rounded-ku-pill bg-ku-primary px-ku-lg active:opacity-90"
          >
            <Text className="font-ku-semibold text-ku-on-primary">
              {messages.retry}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className="flex-1 bg-ku-surface"
    >
      {topBar}
      {activeTab === "reviews" ? (
        <Reviews
          reviews={reviews}
          stats={statsData}
          sectionTitle={messages.reviews}
          emptyText={messages.noReviews}
          allLabel={messages.allReviews}
          eligibleReviewsLabel={messages.eligibleQuestReviews}
          filteredReviewsLabel={messages.filteredReviews}
          reviewCountLabel={messages.reviewsCount}
          totalQuestsLabel={messages.totalQuests}
          noRatingLabel={messages.noRating}
          noMatchingReviewsText={messages.noMatchingReviews}
          showAllLabel={messages.showAllReviews}
          ratingErrorText={`${messages.rating}: ${messages.ratingUnavailable}`}
          errorText={
            reviewsUnavailable ? messages.sectionUnavailable : undefined
          }
          accessibilityLabels={{
            ratingSummaryLabel: messages.ratingSummaryLabel,
            ratingDistributionLabel: messages.ratingDistributionLabel,
            reviewerAvatarLabel: messages.reviewerAvatarLabel,
            reviewFilterLabel: messages.reviewFilterLabel,
            reviewRatingLabel: messages.reviewRatingLabel,
          }}
          locale={locale}
          listHeader={profileChrome}
        />
      ) : (
        <ScrollView
          stickyHeaderIndices={[2]}
          contentContainerStyle={{
            paddingBottom: spacing.px48,
            gap: layoutMetrics.sectionGap,
            paddingHorizontal: layoutMetrics.pagePadding,
            paddingTop: layoutMetrics.sectionGap,
          }}
          showsVerticalScrollIndicator={false}
        >
          {profileHeader}
          {profileStats}
          <View
            style={{
              backgroundColor: colors.surface,
              marginHorizontal: -layoutMetrics.pagePadding,
            }}
          >
            {stickyProfileTabs}
          </View>
          <View>
            {activeTab === "about" ? (
              <AboutMe
                about={bio}
                sectionTitle={messages.about}
                emptyText={messages.noDescription}
              />
            ) : null}
            {activeTab === "experience" ? (
              <Experience
                experiences={experiences}
                sectionTitle={messages.experience}
                emptyText={messages.noExperience}
                presentLabel={messages.present}
                locale={locale}
              />
            ) : null}
            {activeTab === "works" ? (
              <MyWork
                works={works}
                sectionTitle={messages.works}
                emptyText={messages.noWorks}
                noImageText={messages.noImage}
                viewLabel={messages.viewWork}
                closeLabel={messages.closeWork}
                accessibilityLabels={{
                  workImageLabel: messages.workImageLabel,
                }}
              />
            ) : null}
            {activeTab === "certificates" ? (
              <Certificates
                certificates={certificates}
                sectionTitle={messages.certificates}
                emptyText={messages.noCertificates}
                previewUnavailableText={messages.previewUnavailable}
                previewLabel={messages.viewCertificate}
                closeLabel={messages.closePreview}
                unavailableText={messages.imageUnavailable}
                accessibilityLabels={{
                  certificatePreviewLabel: messages.certificatePreviewLabel,
                  certificateImageLabel: messages.certificateImageLabel,
                }}
              />
            ) : null}
          </View>
        </ScrollView>
      )}
    </ScreenLayout>
  );
}
