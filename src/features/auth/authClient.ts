import { createAuthClient } from 'better-auth/react';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

const expoAuthPlugin = expoClient({
  scheme: 'kuquestmobile',
  storagePrefix: 'kuquest',
  storage: SecureStore,
});

export const authClient = createAuthClient({
  baseURL: apiBaseUrl ?? '',
  plugins: [
    // @better-auth/expo 1.6.26's plugin declaration is not compatible with
    // better-auth 1.6.26's generic client declaration, although the runtime
    // plugin is the supported integration.
    expoAuthPlugin as unknown as BetterAuthClientPlugin,
  ],
}) as unknown as ReturnType<typeof createAuthClient> & { getCookie(): string };
