import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { useRouter } from 'expo-router';
import { authService } from '../auth/AuthService';
import { navigationMessages } from '@/locales/navigationMessages';
import { useLocale } from '@/locales/LocaleProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = navigationMessages[locale];

  const handleSignOut = async () => {
    await authService.signOut();
    router.replace('/');
  };

  return <FeaturePlaceholder titleKey="boardTitle" actionLabel={messages.logout} onAction={() => void handleSignOut()} />;
}
