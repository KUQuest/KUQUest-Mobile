import React, { useCallback, useState } from 'react';
import { cn } from '@/tw/cn';
import { useWindowDimensions } from 'react-native';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useFocusEffect, useRouter } from 'expo-router';

import { profileMessages } from '../../locales/profileMessages';
import { useLocale } from '../../locales/LocaleProvider';
import styles from './styles/profileStyles';
import { AboutMe, Certificates, Experience, MyWork, ProfileBrand, ProfileHeader, ProfileStats, ProfileTabs, Reviews, type ProfileTab, type ProfileViewData } from './components/ProfileComponents';
import { loadProfileViewData } from './loadProfileViewData';
import { getProfileLayoutMetrics } from '../../theme/profileLayout';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';

const tabOrder: ProfileTab[] = ['about', 'experience', 'works', 'certificates', 'reviews'];

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { locale } = useLocale();
  const layoutMetrics = getProfileLayoutMetrics(width);
  const messages = profileMessages[locale];
  const [viewData, setViewData] = useState<ProfileViewData | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

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
    experience: messages.experience,
    works: messages.works,
    certificates: messages.certificates,
    reviews: messages.reviews,
  };

  if (loadError) {
    return <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}><ProfileBrand /><View className={styles.errorState}><Text className={styles.statusText}>{messages.error}</Text><Pressable accessibilityRole="button" className={styles.retryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}><Text className={styles.retryButtonText}>{messages.retry}</Text></Pressable></View></SafeAreaView>;
  }
  if (!content) {
    return <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}><ProfileBrand /><Text className={styles.statusText}>{messages.loading}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <ProfileBrand />
      <ScrollView
        stickyHeaderIndices={[2]}
        contentContainerClassName={cn(styles.content, width >= 600 && styles.tabletContent)}
        contentContainerStyle={{ gap: layoutMetrics.sectionGap, paddingBottom: 96, paddingHorizontal: layoutMetrics.pagePadding, paddingTop: layoutMetrics.sectionGap }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader data={content} editProfileLabel={messages.edit} onEditPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })} />
        <ProfileStats stats={content.stats} ratingLabel={messages.rating} questsLabel={messages.totalQuests} reviewsLabel={messages.reviews} errorText={content.sectionErrors.reputation ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
        <ProfileTabs activeTab={activeTab} labels={tabLabels} onChange={setActiveTab} />
        {activeTab === tabOrder[0] ? <AboutMe about={content.about} sectionTitle={messages.about} emptyText={messages.noDescription} /> : null}
        {activeTab === tabOrder[1] ? <Experience experiences={content.experiences} sectionTitle={messages.experience} emptyText={messages.noExperience} presentLabel={messages.present} locale={locale} errorText={content.sectionErrors.experience ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /> : null}
        {activeTab === tabOrder[2] ? <MyWork works={content.works} sectionTitle={messages.works} emptyText={messages.noWorks} noImageText={messages.noImage} errorText={content.sectionErrors.works ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /> : null}
        {activeTab === tabOrder[3] ? <Certificates certificates={content.certificates} sectionTitle={messages.certificates} emptyText={messages.noCertificates} previewUnavailableText={messages.previewUnavailable} closeLabel={messages.closePreview} unavailableText={messages.imageUnavailable} errorText={content.sectionErrors.certificates ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /> : null}
        {activeTab === tabOrder[4] ? <Reviews reviews={content.reviews} stats={content.stats} sectionTitle={messages.reviews} emptyText={messages.noReviews} allLabel={messages.allReviews} reviewCountLabel={messages.reviewsCount} locale={locale} errorText={content.sectionErrors.reviews ? messages.sectionUnavailable : undefined} retryLabel={messages.retry} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
