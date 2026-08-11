import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../auth/AuthService';
import { onboardingMessages } from '../../locales/registrationOnboarding';
import { useLocale } from '../../locales/LocaleProvider';
import { profileMessages } from '../../locales/profileMessages';
import { AboutMe, Certificates, MyWork, ProfileHeader, type ProfileViewData } from '../profile/components/ProfileComponents';
import { loadProfileViewData } from '../profile/loadProfileViewData';
import styles from './styles/homeStyles';

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = onboardingMessages[locale];
  const profileText = profileMessages[locale];
  const [profile, setProfile] = useState<ProfileViewData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadProfileViewData(locale)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const handleLogout = async () => {
    await authService.signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{messages.homeTitle}</Text>
          <Text style={styles.subtitle}>{messages.homeWelcome}</Text>
        </View>

        {loadError ? <Text style={styles.statusText}>{profileText.error}</Text> : null}
        {!profile && !loadError ? <Text style={styles.statusText}>{profileText.loading}</Text> : null}
        {profile ? <>
          <ProfileHeader
            data={profile}
            editProfileLabel={messages.editProfile}
            onEditPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
          />
          <AboutMe about={profile.about} sectionTitle={profileText.about} emptyText={profileText.noDescription} />
          <MyWork works={profile.works} sectionTitle={profileText.works} emptyText={profileText.noWorks} />
          <Certificates certificates={profile.certificates} sectionTitle={profileText.certificates} emptyText={profileText.noCertificates} />
        </> : null}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{messages.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
