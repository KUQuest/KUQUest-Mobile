import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/tw/cn';
import { useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { profileMessages } from '../../locales/profileMessages';
import { useLocale } from '../../locales/LocaleProvider';
import styles from './styles/profileStyles';
import { AboutMe, Certificates, Experience, MyWork, ProfileHeader, ProfileStats, ProfileTabs, Reviews, type ProfileTab, type ProfileViewData } from './components/ProfileComponents';
import { loadProfileViewData } from './loadProfileViewData';
import { getAppChromeMetrics } from '../../theme/layout';
import { getProfileLayoutMetrics } from '../../theme/profileLayout';
import { spacing } from '../../theme/spacing';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';
import { colors } from '../../theme/colors';
import { useNavigationVisibility } from '../../components/navigation/NavigationVisibilityContext';
import { ProfileTopBar } from './components/ProfileTopBar';

export default function Profile() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const layoutMetrics = getProfileLayoutMetrics(width);
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const messages = profileMessages[locale];
  const { handleScroll: handleNavigationScroll } = useNavigationVisibility();
  const [viewData, setViewData] = useState<ProfileViewData | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const profileScrollOffset = useRef(0);
  const [initialScrollOffset, setInitialScrollOffset] = useState(0);

  const handleProfileScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    profileScrollOffset.current = event.nativeEvent.contentOffset.y;
    handleNavigationScroll(event);
  };

  const handleTabChange = (nextTab: ProfileTab) => {
    if (nextTab === 'reviews' || activeTab === 'reviews') {
      setInitialScrollOffset(profileScrollOffset.current);
    }
    setActiveTab(nextTab);
  };

  useFocusEffect(useCallback(() => {
    let active = true;
    async function loadProfile(_attempt: number) {
      setLoadError(false);
      try {
        const data = await loadProfileViewData(locale);
        if (active) setViewData(data);
      } catch (error) {
        if (error instanceof AuthError && error.code === 'SESSION_EXPIRED') {
          await authService.signOut().catch(() => undefined);
          if (active) router.replace('/');
          return;
        }
        if (active) setLoadError(true);
      }
    }
    void loadProfile(loadAttempt);
    return () => { active = false; };
  }, [locale, loadAttempt, router]));

  const content = viewData;
  const tabLabels: Record<ProfileTab, string> = {
    about: messages.about,
    portfolio: messages.portfolio,
    reviews: messages.reviews,
  };
  const bottomPadding = (chromeMetrics.isTablet ? 0 : chromeMetrics.navHeight + insets.bottom) + spacing.lg;
  const profileTopBarHeight = chromeMetrics.headerHeight + insets.top;
  const horizontalPadding = layoutMetrics.pagePadding;
  const portfolioSectionMargin = layoutMetrics.portfolioSectionGap - layoutMetrics.sectionGap;
  const openSettings = () => router.push('/settings');
  const profileTopBar = <ProfileTopBar />;
  if (loadError) {
    return <SafeAreaView edges={['left', 'right']} className={styles.safeArea}>{profileTopBar}<View style={{ flex: 1, paddingTop: profileTopBarHeight }}><View className={styles.errorState}><Text className={styles.statusText}>{messages.error}</Text><Pressable accessibilityRole="button" className={styles.retryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}><Text className={styles.retryButtonText}>{messages.retry}</Text></Pressable></View></View></SafeAreaView>;
  }
  if (!content) {
    return <SafeAreaView edges={['left', 'right']} className={styles.safeArea}>{profileTopBar}<View style={{ flex: 1, paddingTop: profileTopBarHeight }}><View className={styles.loadingState}><ActivityIndicator color={colors.primary} /><Text className={styles.statusText}>{messages.loading}</Text></View></View></SafeAreaView>;
  }

  const profileStats = <ProfileStats
    stats={content.stats}
    ratingLabel={messages.rating}
    questsLabel={messages.totalQuests}
    reviewsLabel={messages.reviews}
    noRatingLabel={messages.noRating}
    accessibilityLabel={messages.statisticsLabel}
    errorText={content.sectionErrors.reputation ? messages.ratingUnavailable : undefined}
    retryLabel={messages.retry}
    onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
  />;
  const profileTabs = <ProfileTabs activeTab={activeTab} labels={tabLabels} accessibilityLabel={messages.sectionsLabel} onChange={handleTabChange} />;
  const profileChrome = <View className={styles.profileChrome} style={{ paddingTop: profileTopBarHeight }}>
    <ProfileHeader data={content} accessibilityLabels={{ profileImageLabel: messages.profileImageLabel, questCategoriesLabel: messages.questCategoriesLabel }} />
    {profileStats}
    {profileTabs}
  </View>;

  return (
    <SafeAreaView edges={['left', 'right']} className={styles.safeArea}>
      {profileTopBar}
      {activeTab === 'reviews' ? (
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
          ratingErrorText={content.sectionErrors.reputation ? messages.ratingUnavailable : undefined}
          accessibilityLabels={{ ratingSummaryLabel: messages.ratingSummaryLabel, ratingDistributionLabel: messages.ratingDistributionLabel, reviewerAvatarLabel: messages.reviewerAvatarLabel, reviewFilterLabel: messages.reviewFilterLabel, reviewRatingLabel: messages.reviewRatingLabel }}
          locale={locale}
          listHeader={profileChrome}
          bottomPadding={bottomPadding}
          initialScrollOffset={initialScrollOffset}
          onScroll={handleProfileScroll}
          errorText={content.sectionErrors.reviews ? messages.sectionUnavailable : undefined}
          retryLabel={messages.retry}
          onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
        />
      ) : (
        <ScrollView
          testID="profile-content-scroll"
          contentContainerClassName={cn(styles.content, width >= 600 && styles.tabletContent)}
          contentContainerStyle={{ gap: layoutMetrics.sectionGap, paddingBottom: bottomPadding, paddingLeft: horizontalPadding, paddingRight: layoutMetrics.pagePadding, paddingTop: profileTopBarHeight + layoutMetrics.sectionGap }}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          onScroll={handleProfileScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader data={content} accessibilityLabels={{ profileImageLabel: messages.profileImageLabel, questCategoriesLabel: messages.questCategoriesLabel }} />
          {profileStats}
          {profileTabs}
          {activeTab === 'about' ? <AboutMe about={content.about} sectionTitle={messages.about} emptyText={messages.noDescription} emptyActionLabel={messages.manageInSettings} onEditPress={openSettings} /> : null}
          {activeTab === 'portfolio' ? <><Experience experiences={content.experiences} sectionTitle={messages.experience} emptyText={messages.noExperience} presentLabel={messages.present} locale={locale} sectionBottomMargin={portfolioSectionMargin} emptyActionLabel={messages.manageInSettings} onEditPress={openSettings} errorText={content.sectionErrors.experience ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /><MyWork works={content.works} sectionTitle={messages.portfolioWork} emptyText={messages.noWorks} noImageText={messages.noImage} viewLabel={messages.viewWork} closeLabel={messages.closeWork} sectionBottomMargin={portfolioSectionMargin} emptyActionLabel={messages.manageInSettings} onEditPress={openSettings} accessibilityLabels={{ workImageLabel: messages.workImageLabel }} errorText={content.sectionErrors.works ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /><Certificates certificates={content.certificates} sectionTitle={messages.certificates} emptyText={messages.noCertificates} previewUnavailableText={messages.previewUnavailable} previewLabel={messages.viewCertificate} closeLabel={messages.closePreview} unavailableText={messages.imageUnavailable} emptyActionLabel={messages.manageInSettings} onEditPress={openSettings} accessibilityLabels={{ certificatePreviewLabel: messages.certificatePreviewLabel, certificateImageLabel: messages.certificateImageLabel }} errorText={content.sectionErrors.certificates ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /></> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
