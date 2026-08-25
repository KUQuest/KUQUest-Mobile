import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from '@/tw';
import { colors } from '@/theme/colors';
import { importDemoSessionFile } from '@/features/auth/authClient';

export default function ImportDemoSession() {
  const { file } = useLocalSearchParams<{ file?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function importSession() {
      if (!__DEV__) {
        if (active) setError('Demo session import is unavailable');
        return;
      }
      if (!file || Array.isArray(file)) {
        if (active) setError('No demo session handoff was provided');
        return;
      }

      try {
        await importDemoSessionFile(file);
        if (active) router.replace('/');
      } catch (importError: unknown) {
        if (active) {
          setError(importError instanceof Error ? importError.message : 'Unable to import demo session');
        }
      }
    }

    void importSession();
    return () => {
      active = false;
    };
  }, [file, router]);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-[24px] bg-ku-background">
        <Text className="text-ku-danger text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-ku-background">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-ku-text-secondary mt-[12px]">กำลังเปลี่ยน account…</Text>
    </View>
  );
}
