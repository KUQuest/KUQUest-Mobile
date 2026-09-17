import React, { useEffect, useMemo, useState } from "react";
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
import { ScreenLayout } from "../../components/layout/ScreenLayout";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { getProfileLayoutMetrics } from "@/theme/profileLayout";
import { useLocale, type SupportedLocale } from "@/locales/LocaleProvider";
import { profileMessages } from "@/locales/profileMessages";
import { authService } from "@/features/auth/AuthService";
import type {
  PublicProfileResponse,
  PublicProfileReviewsData,
} from "@/api/contracts";
import {
  AboutMe,
  Certificates,
  Experience,
  MyWork,
  ProfileHeader,
  ProfileSkeleton,
  ProfileStats,
  Reviews,
  type ProfileCertificate,
  type ProfileExperience,
  type ProfileReview,
  type ProfileStatsData,
  type ProfileWork,
} from "./components/ProfileComponents";

type PublicProfileTab =
  "about" | "experience" | "works" | "certificates" | "reviews";

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [reviewsData, setReviewsData] =
    useState<PublicProfileReviewsData | null>(null);
  const [reviewsUnavailable, setReviewsUnavailable] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadPublicData() {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setReviewsUnavailable(false);
      try {
        const api = await authService.getStudentApi();
        const [profileRes, reviewsRes] = await Promise.allSettled([
          api.getPublicProfile(userId),
          api.listPublicReviews(userId),
        ]);

        if (!active) return;

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value);
          if (reviewsRes.status === "fulfilled") {
            setReviewsData(reviewsRes.value);
          } else {
            setReviewsData(null);
            setReviewsUnavailable(true);
          }
        } else {
          const err = profileRes.reason;
          setError(err instanceof Error ? err.message : messages.error);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : messages.error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPublicData();
    return () => {
      active = false;
    };
  }, [userId, loadAttempt, messages.error]);

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
        formatDate(cert.issuedAt, locale).split(" ").pop() ?? cert.issuedAt,
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
    <View className="flex-row items-center justify-between px-4 py-2 border-b border-ku-border-subtle bg-ku-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messages.back ?? "Back"}
        testID="public-profile-back-button"
        hitSlop={8}
        onPress={() => router.back()}
        className="items-center justify-center rounded-ku-pill h-[44px] w-[44px] active:bg-ku-surface-muted"
      >
        <ChevronLeft color={colors.primaryDeep} size={24} strokeWidth={2.5} />
      </Pressable>
      <View className="flex-1 items-center justify-center px-2">
        <Image
          accessibilityLabel="KUQuest"
          contentFit="contain"
          source={require("../../../topbar-logo.svg")}
          style={{ height: 24, width: 70 }}
        />
        <Text
          numberOfLines={1}
          className="text-ku-text-strong font-ku-semibold text-ku-caption mt-0.5"
          testID="public-profile-header-name"
        >
          {displayName || messages.title}
        </Text>
      </View>
      <View className="w-[44px]" />
    </View>
  );

  const stickyProfileTabs = (
    <View
      className="bg-ku-surface py-2 border-b border-ku-border-subtle"
      testID="public-profile-tabs"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-2 px-4"
        accessibilityRole="tablist"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isSelected = activeTab === key;
          return (
            <Pressable
              key={key}
              testID={`public-profile-tab-${key}`}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => setActiveTab(key)}
              className={cn(
                "flex-row items-center gap-1.5 px-4 py-2 rounded-ku-pill border min-h-[40px]",
                isSelected
                  ? "bg-ku-primary border-ku-primary"
                  : "bg-ku-surface-muted border-ku-border-subtle"
              )}
            >
              <Icon
                size={16}
                color={isSelected ? colors.white : colors.textSecondary}
                strokeWidth={2}
              />
              <Text
                className={cn(
                  "text-xs font-ku-semibold",
                  isSelected ? "text-ku-white" : "text-ku-text-secondary"
                )}
                maxFontSizeMultiplier={2}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const profileHeader = (
    <View>
      <ProfileHeader
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
        <View className="bg-ku-surface border border-ku-border-subtle rounded-ku-card p-3 mt-3">
          <Text className="text-ku-text-secondary font-ku-regular text-ku-body-small">
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
    <View className="gap-3">
      {profileHeader}
      {profileStats}
      {stickyProfileTabs}
    </View>
  );

  if (loading) {
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

  if (error && !profile) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="flex-1 bg-ku-surface"
      >
        {topBar}
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-ku-text-secondary text-center mb-4">
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLoadAttempt((prev) => prev + 1)}
            className="min-h-[48px] min-w-[140px] items-center justify-center rounded-ku-pill bg-ku-primary px-6 active:opacity-90"
          >
            <Text className="text-ku-white font-ku-semibold">
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
            paddingBottom: 48,
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
