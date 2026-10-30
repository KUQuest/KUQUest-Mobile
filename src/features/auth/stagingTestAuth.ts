import Constants from "expo-constants";
import { fetch as expoFetch } from "expo/fetch";
import * as SecureStore from "expo-secure-store";

import { authClient } from "./authClient";
import {
  AUTH_COOKIE_STORAGE_KEY,
  parseSessionCookieHeader,
} from "./authStorage";

export const STAGING_TEST_ACCOUNTS = [
  {
    id: "account-1",
    name: "Nattapong Srisawat",
  },
  {
    id: "account-2",
    name: "Warisara Boonmee",
  },
  {
    id: "account-3",
    name: "Thanakrit Chaiyasit",
  },
  {
    id: "account-4",
    name: "Supitcha Wongsakul",
  },
  {
    id: "account-5",
    name: "Kritchapon Phromma",
  },
  {
    id: "account-6",
    name: "Aphinya Sukjai",
  },
  {
    id: "account-7",
    name: "Pattarapon Ruangrit",
  },
  {
    id: "account-8",
    name: "Chutimon Thepsuriya",
  },
  {
    id: "account-9",
    name: "Ekkapop Wattana",
  },
  {
    id: "account-10",
    name: "Nichakan Kaewmanee",
  },
] as const;

export type StagingTestAccount =
  "default" | (typeof STAGING_TEST_ACCOUNTS)[number]["id"];

export function isStagingTestAuthAvailable(): boolean {
  return Constants.expoConfig?.extra?.appVariant === "staging";
}

export interface StagingTestAuthOptions {
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

function resolveBaseUrl(apiBaseUrl?: string): string {
  const resolved = (apiBaseUrl ?? process.env.EXPO_PUBLIC_API_URL)?.replace(
    /\/+$/,
    ""
  );
  if (!resolved) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }
  return resolved;
}

/**
 * Signs out of any staging test session stored on the device before
 * switching to another staging test account, per the staging test-auth
 * contract. Best-effort: a failed or already-expired sign-out never blocks
 * the caller's subsequent sign-in.
 */
async function signOutOfStagingTestAccount(
  baseUrl: string,
  fetchImpl: typeof fetch
): Promise<void> {
  const cookie = authClient.getCookie();
  if (!cookie) return;

  try {
    await fetchImpl(`${baseUrl}/api/staging/test-auth/sign-out`, {
      method: "POST",
      credentials: "omit",
      headers: { Cookie: cookie },
    });
  } catch {
    // Best-effort: proceed to sign in with the next account regardless.
  }
}

/**
 * Staging-build Login screen action. Calls the Staging API's test-auth
 * sign-in route for `accountId`
 * (`POST /api/staging/test-auth/sign-in/<account-1|...|account-10>`,
 * only enabled when the API has `STAGING_TEST_AUTH_ENABLED=true`), signing
 * out of any previously stored staging test session first, then stores the
 * returned session cookie in the same SecureStore slot Better Auth's Expo
 * client reads (`kuquest_cookie`) so the existing session/routing flow picks
 * it up exactly as it would after a real Google sign-in.
 */
export async function signInWithStagingTestAccount(
  accountId: StagingTestAccount,
  options: StagingTestAuthOptions = {}
): Promise<void> {
  if (!isStagingTestAuthAvailable()) {
    throw new Error(
      "Staging test sign-in is only available in staging builds."
    );
  }

  const baseUrl = resolveBaseUrl(options.apiBaseUrl);
  const fetchImpl = options.fetchImpl ?? expoFetch;

  await signOutOfStagingTestAccount(baseUrl, fetchImpl);

  const response = await fetchImpl(
    `${baseUrl}/api/staging/test-auth/sign-in/${accountId}`,
    {
      method: "POST",
      // Keep the session out of the native cookie jar: React Native sends that
      // jar's cookie ahead of openServerSocket's Cookie header, so a stale jar
      // session authenticates chat and Quest sockets as another Member.
      credentials: "omit",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
    }
  );

  const setCookie = response.headers.get("set-cookie");
  if (!response.ok || !setCookie) {
    throw new Error(
      `Staging test sign-in failed (HTTP ${response.status}). Confirm STAGING_TEST_AUTH_ENABLED=true on the staging API.`
    );
  }

  const cookies = parseSessionCookieHeader(setCookie);
  await SecureStore.setItemAsync(
    AUTH_COOKIE_STORAGE_KEY,
    JSON.stringify(cookies)
  );
}
