import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/tw/cn';
import { useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSkeleton, SkeletonBlock } from '../../components/ui/LoadingSkeleton';
import { profileMessages } from '../../locales/profileMessages';
import { useLocale } from '../../locales/LocaleProvider';
import styles from './styles/profileStyles';
import componentStyles from './styles/profileComponentStyles';
import { AboutMe, Certificates, Experience, MyWork, ProfileHeader, ProfileStats, ProfileTabs, Reviews, type ProfileTab, type ProfileViewData } from './components/ProfileComponents';
import { loadProfileViewData } from './loadProfileViewData';
import { getAppChromeMetrics } from '../../theme/layout';
import { getProfileLayoutMetrics } from '../../theme/profileLayout';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';
import { useNavigationVisibility } from '../../components/navigation/NavigationVisibilityContext';
import { usePrototypeMenuState } from '../../components/ui/prototypeMenuState';
import { ProfileTopBar } from './components/ProfileTopBar';

function ProfileSkeleton({ activeTab, loadingLabel, width, fontScale, profileTopBarHeight, bottomPadding }: { activeTab: ProfileTab; loadingLabel: string; width: number; fontScale: number; profileTopBarHeight: number; bottomPadding: number }) {
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const section = (key: string, lines = 3) => <View key={key} className={componentStyles.section} style={{ gap: spacing.sm, padding: metrics.cardPadding }}><SkeletonBlock height={24} width="42%" borderRadius={5} /><SkeletonBlock height={1} borderRadius={0} style={{ marginVertical: spacing.xs }} />{Array.from({ length: lines }, (_, index) => <SkeletonBlock key={index} height={16} width={index === lines - 1 ? '62%' : index === 1 ? '88%' : '96%'} borderRadius={4} />)}</View>;

  return (
    <LoadingSkeleton loadingLabel={loadingLabel} style={{ flex: 1 }} contentStyle={{ flex: 1 }} testID="profile-loading-skeleton">
      <ScrollView
        contentContainerClassName={cn(styles.content, width >= 600 && styles.tabletContent)}
        contentContainerStyle={{ gap: metrics.sectionGap, paddingBottom: bottomPadding, paddingLeft: metrics.pagePadding, paddingRight: metrics.pagePadding, paddingTop: profileTopBarHeight + metrics.sectionGap }}
        showsVerticalScrollIndicator={false}
      >
        <View className={componentStyles.heroCard} style={{ gap: spacing.md, padding: metrics.cardPadding }}>
          <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md }}>
            <SkeletonBlock variant="image" height={metrics.photoSize} width={metrics.photoSize} borderRadius={metrics.photoSize / 2} testID="profile-skeleton-avatar" />
            <View style={{ flex: 1, gap: spacing.sm, paddingTop: spacing.xs }}><SkeletonBlock height={28} width="76%" borderRadius={5} /><SkeletonBlock height={16} width="58%" borderRadius={4} /><SkeletonBlock height={16} width="72%" borderRadius={4} /><SkeletonBlock height={16} width="64%" borderRadius={4} /></View>
          </View>
          <View style={{ gap: spacing.sm }}><SkeletonBlock height={14} width="54%" borderRadius={4} /><View style={{ flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock height={28} width={82} borderRadius={15} /><SkeletonBlock height={28} width={96} borderRadius={15} /><SkeletonBlock height={28} width={72} borderRadius={15} /></View></View>
        </View>
        <View className={componentStyles.statsCard} style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} /><SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} /><SkeletonBlock height={42} borderRadius={6} style={{ flex: 1 }} /></View>
        </View>
        <View className={componentStyles.tabList} style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle, borderRadius: 16, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs }}>
          {[1, 2, 3].map((item) => <SkeletonBlock key={item} height={64} borderRadius={10} style={{ flex: 1 }} testID={`profile-skeleton-tab-${item}`} />)}
        </View>
        {activeTab === 'about' ? section('about', 5) : activeTab === 'portfolio' ? <>{section('experience', 4)}{section('portfolio', 3)}{section('certificates', 3)}</> : <>{section('reviews-summary', 4)}{[1, 2, 3].map((item) => <View key={item} className={componentStyles.reviewCard} style={{ gap: spacing.sm }}><View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock variant="image" height={36} width={36} borderRadius={18} /><SkeletonBlock height={18} width="38%" borderRadius={4} /></View><SkeletonBlock height={14} width="32%" borderRadius={4} /><SkeletonBlock height={16} width="92%" borderRadius={4} /><SkeletonBlock height={16} width="68%" borderRadius={4} /></View>)}</>}
      </ScrollView>
    </LoadingSkeleton>
  );
}

export default function Profile() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const { activePersonaId } = usePrototypeMenuState();
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
        const data = await loadProfileViewData(locale, activePersonaId);
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
  }, [activePersonaId, locale, loadAttempt, router]));

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
  if (loadError && !content) {
    return <SafeAreaView edges={['left', 'right']} className={styles.safeArea}>{profileTopBar}<View style={{ flex: 1, paddingTop: profileTopBarHeight }}><View className={styles.errorState}><Text className={styles.statusText}>{messages.error}</Text><Pressable accessibilityRole="button" className={styles.retryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}><Text className={styles.retryButtonText}>{messages.retry}</Text></Pressable></View></View></SafeAreaView>;
  }
  if (!content) {
    return <SafeAreaView edges={['left', 'right']} className={styles.safeArea}>{profileTopBar}<ProfileSkeleton activeTab={activeTab} bottomPadding={bottomPadding} fontScale={fontScale} loadingLabel={messages.loading} profileTopBarHeight={profileTopBarHeight} width={width} /></SafeAreaView>;
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
