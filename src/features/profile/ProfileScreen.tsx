import React, { useEffect, useState } from 'react';
import { ScrollView, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '../../components/ui/TopBar';
import { profileMessages } from '../../locales/profileMessages';
import { useLocale } from '../../locales/LocaleProvider';
import styles from './styles/profileStyles';
import { AboutMe, Certificates, MyWork, ProfileHeader, ProfileViewData } from './components/ProfileComponents';
import { loadProfileViewData } from './loadProfileViewData';
import { getProfileLayoutMetrics } from '../../theme/profileLayout';

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { locale } = useLocale();
  const layoutMetrics = getProfileLayoutMetrics(width);
  const messages = profileMessages[locale];
  const [viewData, setViewData] = useState<ProfileViewData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const data = await loadProfileViewData(locale);
        if (active) setViewData(data);
      } catch {
        if (active) setLoadError(true);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [locale]);

  const content = viewData;

  if (loadError) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}><TopBar onBackPress={() => router.back()} /><Text style={styles.statusText}>{messages.error}</Text></SafeAreaView>;
  }
  if (!content) {
    return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}><TopBar onBackPress={() => router.back()} /><Text style={styles.statusText}>{messages.loading}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar onBackPress={() => router.back()} />
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
