import { useEffect, useRef, useState } from "react";
import { cn } from "@/tw/cn";
import {
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { profileMessages } from "../../locales/profileMessages";
import { handleNavigationScroll as handleNavigationScrollEvent } from "@/features/navigation/navigationUiStore";
import styles from "./styles/profileStyles";
import { AboutMe } from "./components/AboutMe";
import { Certificates } from "./components/Certificates";
import { Experience } from "./components/Experience";
import { MyWork } from "./components/MyWork";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileSkeleton } from "./components/ProfileSkeleton";
import { ProfileStats } from "./components/ProfileStats";
import { ProfileTabs } from "./components/ProfileTabs";
import { Reviews } from "./components/Reviews";
import type { ProfileTab } from "./components/profileTypes";
import { useProfileQuery } from "./api/profileQueries";
import {
  getAppChromeMetrics,
  getBottomNavigationInset,
} from "../../theme/layout";
import { getProfileLayoutMetrics } from "../../theme/profileLayout";
import { spacing } from "../../theme/spacing";
import { AuthError } from "../auth/types";
import { useLocale } from "@/features/preferences/localeStore";
import { ProfileTopBar } from "./components/ProfileTopBar";
import { ScreenLayout } from "../../components/layout/ScreenLayout";

export default function Profile() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const layoutMetrics = getProfileLayoutMetrics(width, fontScale);
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const messages = profileMessages[locale];
  const handleNavigationScroll = handleNavigationScrollEvent;
  const {
    data: viewData,
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useProfileQuery(locale);
  const [activeTab, setActiveTab] = useState<ProfileTab>("about");
  const profileScrollOffset = useRef(0);
  const redirectedToRoot = useRef(false);
  const [initialScrollOffset, setInitialScrollOffset] = useState(0);

  const handleProfileScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    profileScrollOffset.current = event.nativeEvent.contentOffset.y;
    handleNavigationScroll(event);
  };

  const handleTabChange = (nextTab: ProfileTab) => {
    if (nextTab === "reviews" || activeTab === "reviews") {
      setInitialScrollOffset(profileScrollOffset.current);
    }
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (
      !isError ||
      !(queryError instanceof AuthError) ||
      queryError.code !== "SESSION_EXPIRED" ||
      redirectedToRoot.current
    )
      return;
    redirectedToRoot.current = true;
    router.replace("/");
  }, [queryError, isError, router]);

  const tabLabels: Record<ProfileTab, string> = {
    about: messages.about,
    experience: messages.experience,
    works: messages.works,
    certificates: messages.certificates,
    reviews: messages.reviews,
  };
  const bottomPadding =
    getBottomNavigationInset(chromeMetrics, insets.bottom) + spacing.lg;
  const profileTopBarHeight = chromeMetrics.headerHeight + insets.top;
  const horizontalPadding = layoutMetrics.pagePadding;
  const openEditProfile = () => router.push("/profile/edit");
  const profileTopBar = <ProfileTopBar />;
  if (isError && !viewData) {
    return (
      <ScreenLayout edges={["left", "right"]} className={styles.safeArea}>
        {profileTopBar}
        <View style={{ flex: 1, paddingTop: profileTopBarHeight }}>
          <View className={styles.errorState}>
            <Text className={styles.statusText}>{messages.error}</Text>
            <Pressable
              accessibilityRole="button"
              className={styles.retryButton}
              onPress={() => void refetch()}
            >
              <Text className={styles.retryButtonText}>{messages.retry}</Text>
            </Pressable>
          </View>
        </View>
      </ScreenLayout>
    );
  }
  if (isPending || !viewData) {
    return (
      <ScreenLayout edges={["left", "right"]} className={styles.safeArea}>
        {profileTopBar}
        <ProfileSkeleton
          activeTab={activeTab}
          bottomPadding={bottomPadding}
          fontScale={fontScale}
          loadingLabel={messages.loading}
          profileTopBarHeight={profileTopBarHeight}
          width={width}
        />
      </ScreenLayout>
    );
  }
  const content = viewData;
  // Unavailable sections have no retry; transient section errors can refetch.
  const sectionNotice = (
    section: keyof typeof content.sectionUnavailable,
    errorText: string
  ) => {
    const unavailable = Boolean(content.sectionUnavailable[section]);
    return {
      errorText:
        unavailable || content.sectionErrors[section] ? errorText : undefined,
      retryLabel: unavailable ? undefined : messages.retry,
      onRetry: unavailable ? undefined : () => void refetch(),
    };
  };
  const reputationNotice = sectionNotice(
    "reputation",
    messages.ratingUnavailable
  );
  const profileChrome = (
    <View className={styles.profileChrome}>
      <ProfileHeader
        data={content}
        editProfileLabel={messages.edit}
        onEditPress={openEditProfile}
        accessibilityLabels={{
          profileImageLabel: messages.profileImageLabel,
          questCategoriesLabel: messages.questCategoriesLabel,
        }}
      />
      <ProfileStats
        stats={content.stats}
        ratingLabel={messages.rating}
        questsLabel={messages.totalQuests}
        reviewsLabel={messages.reviews}
        noRatingLabel={messages.noRating}
        accessibilityLabel={messages.statisticsLabel}
        {...reputationNotice}
      />
      <ProfileTabs
        activeTab={activeTab}
        labels={tabLabels}
        accessibilityLabel={messages.sectionsLabel}
        onChange={handleTabChange}
      />
    </View>
  );

  return (
    <ScreenLayout edges={["left", "right"]} className={styles.safeArea}>
      {profileTopBar}
      {activeTab === "reviews" ? (
        <Reviews
          reviews={content.reviews}
          stats={content.stats}
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
          ratingErrorText={reputationNotice.errorText}
          ratingRetryLabel={reputationNotice.retryLabel}
          onRatingRetry={reputationNotice.onRetry}
          accessibilityLabels={{
            ratingSummaryLabel: messages.ratingSummaryLabel,
            ratingDistributionLabel: messages.ratingDistributionLabel,
            reviewerAvatarLabel: messages.reviewerAvatarLabel,
            reviewFilterLabel: messages.reviewFilterLabel,
            reviewRatingLabel: messages.reviewRatingLabel,
          }}
          locale={locale}
          listHeader={
            <View style={{ paddingTop: profileTopBarHeight }}>
              {profileChrome}
            </View>
          }
          bottomPadding={bottomPadding}
          initialScrollOffset={initialScrollOffset}
          onScroll={handleProfileScroll}
          {...sectionNotice("reviews", messages.sectionUnavailable)}
        />
      ) : (
        <ScrollView
          testID="profile-content-scroll"
          contentContainerClassName={cn(
            styles.content,
            width >= 600 && styles.tabletContent
          )}
          contentContainerStyle={{
            gap: layoutMetrics.sectionGap,
            paddingBottom: bottomPadding,
            paddingLeft: horizontalPadding,
            paddingRight: layoutMetrics.pagePadding,
            paddingTop: profileTopBarHeight + layoutMetrics.sectionGap,
          }}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          onScroll={handleProfileScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {profileChrome}
          {activeTab === "about" ? (
            <AboutMe
              about={content.about}
              sectionTitle={messages.about}
              emptyText={messages.noDescription}
              emptyActionLabel={messages.edit}
              onEditPress={openEditProfile}
            />
          ) : null}
          {activeTab === "experience" ? (
            <Experience
              experiences={content.experiences}
              sectionTitle={messages.experience}
              emptyText={messages.noExperience}
              presentLabel={messages.present}
              locale={locale}
              emptyActionLabel={messages.edit}
              onEditPress={openEditProfile}
              {...sectionNotice("experience", messages.sectionUnavailable)}
            />
          ) : null}
          {activeTab === "works" ? (
            <MyWork
              works={content.works}
              sectionTitle={messages.works}
              emptyText={messages.noWorks}
              noImageText={messages.noImage}
              viewLabel={messages.viewWork}
              closeLabel={messages.closeWork}
              emptyActionLabel={messages.edit}
              onEditPress={openEditProfile}
              accessibilityLabels={{
                workImageLabel: messages.workImageLabel,
              }}
              {...sectionNotice("works", messages.sectionUnavailable)}
            />
          ) : null}
          {activeTab === "certificates" ? (
            <Certificates
              certificates={content.certificates}
              sectionTitle={messages.certificates}
              emptyText={messages.noCertificates}
              previewUnavailableText={messages.previewUnavailable}
              previewLabel={messages.viewCertificate}
              closeLabel={messages.closePreview}
              unavailableText={messages.imageUnavailable}
              emptyActionLabel={messages.edit}
              onEditPress={openEditProfile}
              accessibilityLabels={{
                certificatePreviewLabel: messages.certificatePreviewLabel,
                certificateImageLabel: messages.certificateImageLabel,
              }}
              {...sectionNotice("certificates", messages.sectionUnavailable)}
            />
          ) : null}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}
