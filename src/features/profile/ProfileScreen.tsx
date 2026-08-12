import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '../../components/ui/TopBar';
import { profileMessages } from '../../locales/profileMessages';
import { useLocale } from '../../locales/LocaleProvider';
import styles from './styles/profileStyles';
import { AboutMe, Certificates, MyWork, ProfileHeader, ProfileViewData } from './components/ProfileComponents';
import { loadProfileViewData } from './loadProfileViewData';
import { getProfileLayoutMetrics } from '../../theme/profileLayout';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { locale } = useLocale();
  const layoutMetrics = getProfileLayoutMetrics(width);
  const messages = profileMessages[locale];
  const [viewData, setViewData] = useState<ProfileViewData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
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
    void loadProfile();
    return () => { active = false; };
  }, [locale, loadAttempt, router]);

  const content = viewData;

  if (loadError) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}><TopBar /><View style={styles.errorState}><Text style={styles.statusText}>{messages.error}</Text><Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}><Text style={styles.retryButtonText}>{messages.retry}</Text></Pressable></View></SafeAreaView>;
  }
  if (!content) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}><TopBar /><Text style={styles.statusText}>{messages.loading}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: layoutMetrics.sectionGap,
            paddingBottom: 16,
            paddingHorizontal: layoutMetrics.pagePadding,
            paddingTop: layoutMetrics.pagePadding,
          },
          width >= 600 && styles.tabletContent,
        ]}
      >
        <ProfileHeader data={content} editProfileLabel={messages.edit} onEditPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })} />
        <AboutMe about={content.about} sectionTitle={messages.about} emptyText={messages.noDescription} />
        <MyWork works={content.works} sectionTitle={messages.works} emptyText={messages.noWorks} />
        <Certificates certificates={content.certificates} sectionTitle={messages.certificates} emptyText={messages.noCertificates} />
      </ScrollView>
    </SafeAreaView>
  );
}
