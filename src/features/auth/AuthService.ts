import type { SignInResponse } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import { ApiClient, ApiError } from '../../api/ApiClient';
import { authUserSchema } from '../../api/contracts';
import { ProfileApi } from '../../api/ProfileApi';
import { StudentApi } from '../../api/StudentApi';
import {
  AuthAdapter,
  AuthError,
  AuthSession,
  RoutingDestination,
} from './types';
import { authClient, type BetterAuthClientApi } from './authClient';
import { AUTH_COOKIE_STORAGE_KEY, AUTH_SESSION_CACHE_STORAGE_KEY } from './authStorage';
import { loadNativeGoogleSignin, type NativeGoogleSigninApi, type NativeGoogleSigninSuccessResponse } from './nativeGoogleSignin';

export type { BetterAuthClientApi } from './authClient';
export type { NativeGoogleSigninApi } from './nativeGoogleSignin';

export interface AuthServiceOptions {
  apiBaseUrl?: string;
  apiClient?: ApiClient;
  fetchImpl?: typeof fetch;
  studentApi?: StudentApi;
  profileApi?: ProfileApi;
  googleSignin?: NativeGoogleSigninApi | null;
  authClient?: BetterAuthClientApi;
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

function getErrorCode(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  return (error as { code?: unknown }).code;
}

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  for (const key of ['status', 'statusCode', 'httpStatus'] as const) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

const NETWORK_ERROR_CODES = new Set([
  'NETWORK_ERROR',
  'FETCH_ERROR',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'ETIMEDOUT',
]);
const NETWORK_ERROR_MESSAGE = /network request failed|network error|failed to fetch|fetch failed|connection (?:refused|reset|timed out)|econnrefused|econnreset|enetunreach|etimedout|offline|unreachable|unable to (?:connect|reach)|service unavailable|backend unavailable|timed out|timeout/i;

/**
 * A session lookup may use the offline prototype only for transport failures.
 * HTTP responses (including authenticated 401/403/5xx responses) remain real
 * auth errors and must continue through the normal retry/error surface.
 */
export function isAuthNetworkError(error: unknown): boolean {
  const source = error instanceof AuthError && error.cause !== undefined ? error.cause : error;
  const candidates = source === error ? [error] : [source, error];

  for (const candidate of candidates) {
    const status = getHttpStatus(candidate);
    if (status !== undefined && status > 0) return false;

    const code = getErrorCode(candidate);
    if (typeof code === 'string' && NETWORK_ERROR_CODES.has(code.toUpperCase())) return true;

    const message = getErrorMessage(candidate);
    if (message && NETWORK_ERROR_MESSAGE.test(message)) return true;
  }

  return false;
}

const SIGN_OUT_TIMEOUT_MS = 2000;

async function settleWithin<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<undefined>((resolve) => {
        timeout = setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
  } catch {
    return undefined;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function authDebug(message: string, details?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[auth] ${message}`, details ?? '');
  }
}

function getSessionUser(data: unknown) {
  const user = data && typeof data === 'object' && 'user' in data
    ? (data as { user?: unknown }).user
    : undefined;
  return authUserSchema.parse(user);
}

export class AuthService implements AuthAdapter {
  private readonly studentApi: StudentApi;
  private readonly profileApi: ProfileApi;
  private readonly nativeGoogleSignin: NativeGoogleSigninApi | null;
  private readonly isSuccessResponse: (response: SignInResponse) => response is NativeGoogleSigninSuccessResponse;
  private readonly authClient: BetterAuthClientApi;

  constructor(options: AuthServiceOptions = {}) {
    const apiClient = options.apiClient ?? new ApiClient({
      baseUrl: options.apiBaseUrl,
      fetchImpl: options.fetchImpl,
    });
    this.studentApi = options.studentApi ?? new StudentApi(apiClient);
    this.profileApi = options.profileApi ?? new ProfileApi(this.studentApi);
    const nativeGoogleSigninModule = options.googleSignin === undefined
      ? loadNativeGoogleSignin()
      : null;
    this.nativeGoogleSignin = options.googleSignin === undefined
      ? nativeGoogleSigninModule?.GoogleSignin ?? null
      : options.googleSignin;
    this.isSuccessResponse = nativeGoogleSigninModule?.isSuccessResponse ?? ((response): response is NativeGoogleSigninSuccessResponse => response.type === 'success');
    this.authClient = options.authClient ?? authClient;

    if (this.nativeGoogleSignin) {
      this.nativeGoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      });
    }
  }

  async authenticate(): Promise<AuthSession> {
    authDebug('authenticate started');
    return await this.signInWithNativeGoogle();
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const response = await this.authClient.getSession();
      authDebug('session lookup completed', {
        hasSession: Boolean(response.data),
        hasError: Boolean(response.error),
      });
      if (response.error) {
        const code = getErrorCode(response.error);
        if (code === 'UNAUTHORIZED' || code === 'SESSION_EXPIRED') return null;
        throw new AuthError(
          'API_ERROR',
          getErrorMessage(response.error) ?? 'Unable to load authentication session',
          { cause: response.error },
        );
      }
      if (!response.data) return null;
      return { user: getSessionUser(response.data) };
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      authDebug('session lookup failed', { message: getErrorMessage(error) });
      throw new AuthError(
        'API_ERROR',
        getErrorMessage(error) ?? 'Unable to load authentication session',
        { cause: error },
      );
    }
  }

  async getRoutingDestination(): Promise<RoutingDestination> {
    try {
      const status = await this.studentApi.getAcademicRegistrationStatus();
      authDebug('registration status loaded', { completed: status.completed });
      return status.completed
        ? { type: 'HOME' }
        : { type: 'ONBOARDING', step: 1 };
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        authDebug('registration status rejected session', { status: error.status });
        await this.authClient.signOut().catch(() => undefined);
        throw new AuthError('SESSION_EXPIRED');
      }
      authDebug('registration status failed', { message: getErrorMessage(error) });
      throw new AuthError('API_ERROR', getErrorMessage(error) ?? 'Unable to load registration status');
    }
  }

  async getStudentApi(): Promise<StudentApi> {
    const session = await this.getSession();
    if (!session) throw new AuthError('SESSION_EXPIRED', 'No active session');
    return this.studentApi;
  }

  async getProfileApi(): Promise<ProfileApi> {
    const session = await this.getSession();
    if (!session) throw new AuthError('SESSION_EXPIRED', 'No active session');
    return this.profileApi;
  }

  async signOut(): Promise<void> {
    authDebug('sign-out started');
    const remoteSignOut = settleWithin(this.authClient.signOut(), SIGN_OUT_TIMEOUT_MS);
    const nativeSignOut = this.clearNativeGoogleAccount();

    await Promise.all([remoteSignOut, nativeSignOut]);
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_COOKIE_STORAGE_KEY),
      SecureStore.deleteItemAsync(AUTH_SESSION_CACHE_STORAGE_KEY),
    ]);
    authDebug('sign-out cleanup finished');
  }

  private async clearNativeGoogleAccount(): Promise<void> {
    const nativeGoogleSignin = this.nativeGoogleSignin;
    if (!nativeGoogleSignin) return;

    await settleWithin(
      Promise.resolve().then(() => nativeGoogleSignin.signOut()),
      SIGN_OUT_TIMEOUT_MS,
    );
  }

  private async signInWithNativeGoogle(): Promise<AuthSession> {
    if (!this.nativeGoogleSignin) {
      throw new AuthError(
        'OAUTH_FAILED',
        'Native Google Sign-In requires a Development Build (npx expo run:android) and is not supported in standard Expo Go.'
      );
    }

    let googleAccountChosen = false;

    try {
      const hasPlayServices = await this.nativeGoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      authDebug('Google Play Services checked', { available: hasPlayServices });
      if (!hasPlayServices) {
        throw new AuthError('PLAY_SERVICES_UNAVAILABLE');
      }
      const response = await this.nativeGoogleSignin.signIn();
      googleAccountChosen = this.isSuccessResponse(response);
      authDebug('native Google response received', {
        type: response.type,
        hasIdToken: response.type === 'success' && Boolean(response.data.idToken),
      });

      if (!this.isSuccessResponse(response)) {
        throw new AuthError('OAUTH_CANCELLED');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new AuthError('OAUTH_FAILED', 'Google Sign-In did not return an ID token');
      }

      const email = response.data.user.email.trim().toLowerCase();
      authDebug('Google account received', { domain: email.split('@')[1] ?? '' });
      if (!email.endsWith('@ku.th')) {
        await this.clearNativeGoogleAccount();
        throw new AuthError('INVALID_EMAIL_DOMAIN');
      }

      authDebug('Better Auth sign-in started');
      const result = await this.authClient.signIn.social({
        provider: 'google',
        idToken: { token: idToken },
      });
      authDebug('Better Auth sign-in completed', {
        hasSession: Boolean(result.data),
        hasError: Boolean(result.error),
        errorCode: getErrorCode(result.error),
      });
      if (result.error) throw result.error;

      return { user: getSessionUser(result.data) };
    } catch (error: unknown) {
      // Google keeps the chosen account signed in to this app, so a failure
      // after the account picker leaves it cached and silently reused on the
      // next attempt. Clear it so the picker comes back.
      if (googleAccountChosen) await this.clearGoogleAccount(this.nativeGoogleSignin);

      if (error instanceof AuthError) throw error;

      const message = getErrorMessage(error);
      const code = getErrorCode(error);
      authDebug('authentication failed', { code, message });
      if (code === '12501' || code === 'SIGN_IN_CANCELLED' || message?.includes('CANCEL')) {
        throw new AuthError('OAUTH_CANCELLED');
      }
      if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new AuthError('PLAY_SERVICES_UNAVAILABLE');
      }
      if (error instanceof ApiError && error.status === 401) {
        throw new AuthError('OAUTH_FAILED', 'Google authentication was rejected');
      }
      throw new AuthError('OAUTH_FAILED', message);
    }
  }

  private async clearGoogleAccount(googleSignin: NativeGoogleSigninApi): Promise<void> {
    authDebug('clearing the chosen Google account');
    await settleWithin(googleSignin.signOut(), SIGN_OUT_TIMEOUT_MS);
  }
}

export const authService = new AuthService();
