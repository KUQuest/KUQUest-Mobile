import { fetch as expoFetch } from "expo/fetch";
import * as SecureStore from "expo-secure-store";

import { authClient } from "./authClient";
import {
  AUTH_COOKIE_STORAGE_KEY,
  parseSessionCookieHeader,
} from "./authStorage";

export type StagingTestAccount = "default" | "account-1" | "account-2";

export const STAGING_TEST_ACCOUNTS: readonly StagingTestAccount[] = [
  "default",
  "account-1",
  "account-2",
];

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
      headers: { Cookie: cookie },
    });
  } catch {
    // Best-effort: proceed to sign in with the next account regardless.
  }
}

/**
 * Debug-build-only Login screen action. Calls the Staging API's test-auth
 * sign-in route for `accountId`
 * (`POST /api/staging/test-auth/sign-in/<default|account-1|account-2>`,
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
  if (!__DEV__) {
    throw new Error("Staging test sign-in is only available in debug builds.");
  }

  const baseUrl = resolveBaseUrl(options.apiBaseUrl);
  const fetchImpl = options.fetchImpl ?? expoFetch;

  await signOutOfStagingTestAccount(baseUrl, fetchImpl);

  const response = await fetchImpl(
    `${baseUrl}/api/staging/test-auth/sign-in/${accountId}`,
    {
      method: "POST",
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
