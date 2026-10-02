import { createAuthClient } from "better-auth/react";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { AUTH_STORAGE_PREFIX } from "./authStorage";

export interface BetterAuthResponse {
  data?: unknown;
  error?: unknown;
}

export interface BetterAuthClientApi {
  signIn: {
    social(input: {
      provider: "google";
      idToken: { token: string };
    }): Promise<BetterAuthResponse>;
  };
  getSession(): Promise<BetterAuthResponse>;
  signOut(): Promise<BetterAuthResponse>;
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

const expoAuthPlugin = expoClient({
  storagePrefix: AUTH_STORAGE_PREFIX,
  storage: SecureStore,
});

const configuredAuthClient = createAuthClient({
  baseURL: apiBaseUrl ?? "",
  plugins: [expoAuthPlugin as unknown as BetterAuthClientPlugin],
});

const authClientWithCookie =
  configuredAuthClient as typeof configuredAuthClient & {
    getCookie?: () => string;
  };

export const authClient: BetterAuthClientApi & { getCookie(): string } = {
  signIn: {
    social: async (input) => {
      const result = await configuredAuthClient.signIn.social(input);
      return { data: result.data, error: result.error };
    },
  },
  getSession: async () => {
    const result = await configuredAuthClient.getSession();
    return { data: result.data, error: result.error };
  },
  signOut: async () => {
    const result = await configuredAuthClient.signOut();
    return { data: result.data, error: result.error };
  },
  getCookie: () => authClientWithCookie.getCookie?.() ?? "",
};
