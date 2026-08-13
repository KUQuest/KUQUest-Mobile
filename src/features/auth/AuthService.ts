import type { SignInResponse } from '@react-native-google-signin/google-signin';
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
import { authClient } from './authClient';
import { loadNativeGoogleSignin, type NativeGoogleSigninApi, type NativeGoogleSigninSuccessResponse } from './nativeGoogleSignin';

export type { NativeGoogleSigninApi } from './nativeGoogleSignin';

interface BetterAuthResponse {
  data?: unknown;
  error?: unknown;
}

export interface BetterAuthClientApi {
  signIn: {
    social(input: {
      provider: 'google';
      idToken: { token: string };
    }): Promise<BetterAuthResponse>;
  };
  getSession(): Promise<BetterAuthResponse>;
  signOut(): Promise<BetterAuthResponse>;
}

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
          getErrorMessage(response.error) ?? 'Unable to load authentication session'
        );
      }
      if (!response.data) return null;
      return { user: getSessionUser(response.data) };
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      authDebug('session lookup failed', { message: getErrorMessage(error) });
      throw new AuthError('API_ERROR', getErrorMessage(error) ?? 'Unable to load authentication session');
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
    try {
      await this.authClient.signOut();
      authDebug('Better Auth sign-out completed');
    } catch {
      authDebug('Better Auth sign-out failed; continuing native sign-out');
      // Native sign-out still runs when the remote Better Auth request fails.
    } finally {
      if (this.nativeGoogleSignin) {
        try {
          await this.nativeGoogleSignin.signOut();
          authDebug('native Google sign-out completed');
        } catch {
          // Local Better Auth cleanup remains authoritative.
        }
      }
    }
  }

  private async signInWithNativeGoogle(): Promise<AuthSession> {
    if (!this.nativeGoogleSignin) {
      throw new AuthError(
        'OAUTH_FAILED',
        'Native Google Sign-In requires a Development Build (npx expo run:android) and is not supported in standard Expo Go.'
      );
    }

    try {
      const hasPlayServices = await this.nativeGoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      authDebug('Google Play Services checked', { available: hasPlayServices });
      if (!hasPlayServices) {
        throw new AuthError('PLAY_SERVICES_UNAVAILABLE');
      }
      const response = await this.nativeGoogleSignin.signIn();
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
}

export const authService = new AuthService();
