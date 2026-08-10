import {
  AuthAdapter,
  AuthError,
  AuthMode,
  AuthSession,
  AuthUser,
  OnboardingStatus,
  RoutingDestination,
} from './types';
import { SecureSessionStorage } from './secureStorage';

// Safely require GoogleSignin to avoid crash in Expo Go where native module is missing
let NativeGoogleSignin: any = null;
try {
  const googleSigninPkg = require('@react-native-google-signin/google-signin');
  NativeGoogleSignin = googleSigninPkg.GoogleSignin;

  NativeGoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });
} catch {
  // RNGoogleSignin native module is not linked in Expo Go
}

export interface MockAccountRecord {
  id: string;
  email: string;
  name: string;
  onboardingStatus: OnboardingStatus;
  onboardingStep?: number;
}

export class AuthService implements AuthAdapter {
  private registeredAccounts: Map<string, MockAccountRecord> = new Map([
    [
      'student.test@ku.th',
      {
        id: 'usr_01',
        email: 'student.test@ku.th',
        name: 'Test Student',
        onboardingStatus: 'COMPLETED',
      },
    ],
    [
      'newcomer.test@ku.th',
      {
        id: 'usr_02',
        email: 'newcomer.test@ku.th',
        name: 'Newcomer Student',
        onboardingStatus: 'IN_PROGRESS',
        onboardingStep: 2,
      },
    ],
  ]);

  /**
   * Registers a mock account for testing scenarios.
   */
  registerMockAccount(account: MockAccountRecord): void {
    this.registeredAccounts.set(account.email.toLowerCase(), account);
  }

  /**
   * Clears mock account registry for testing reset.
   */
  clearMockAccounts(): void {
    this.registeredAccounts.clear();
  }

  /**
   * Validates email domain to ensure it ends with @ku.th.
   */
  private validateKuEmailDomain(email: string): void {
    if (!email.toLowerCase().endsWith('@ku.th')) {
      throw new AuthError('INVALID_EMAIL_DOMAIN');
    }
  }

  /**
   * Authenticate via Typed Auth Adapter without guessing unverified REST endpoints.
   * Adheres strictly to BE-69 pre-integration contract requirements.
   */
  async authenticateWithGoogle(
    credential: string,
    mode: AuthMode,
    overrideEmail?: string
  ): Promise<AuthSession> {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) throw new AuthError('API_ERROR', 'API URL is not configured');

    try {
      console.log("SENDING REQUEST TO", `${apiUrl}/auth/sign-in/social`);
      const response = await fetch(`${apiUrl}/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          idToken: {
            token: credential
          }
        }),
      });

      console.log("RESPONSE:", response.status, await response.clone().text());
      if (!response.ok) {
        if (response.status === 404) {
          throw new AuthError('ACCOUNT_NOT_FOUND');
        }
        if (response.status === 409) {
          throw new AuthError('ACCOUNT_ALREADY_EXISTS');
        }
        throw new AuthError('API_ERROR', await response.text());
      }

      const data = await response.json();
      const session = data as AuthSession;

      await SecureSessionStorage.saveSession(session);
      return session;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('API_ERROR', (error as Error).message);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    return await SecureSessionStorage.getSession();
  }

  async clearSession(): Promise<void> {
    await SecureSessionStorage.clearSession();
  }

  /**
   * Sign out, ALWAYS clearing local session token even if backend revocation fails.
   */
  async signOut(revokeBackendCallback?: () => Promise<void>): Promise<void> {
    try {
      if (revokeBackendCallback) {
        await revokeBackendCallback();
      } else {
        const session = await this.getSession();
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        if (session && apiUrl) {
          try {
            await fetch(`${apiUrl}/auth/sign-out`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
              },
            });
          } catch (e) {
            console.warn('Backend logout failed:', e);
          }
        }
      }

      if (NativeGoogleSignin) {
        try {
          await NativeGoogleSignin.signOut();
        } catch {
          // Ignore native google signout errors in tests/mock
        }
      }
    } finally {
      await SecureSessionStorage.clearSession();
    }
  }

  /**
   * Determine session routing seam destination (HOME vs ONBOARDING step).
   */
  static getRoutingDestination(session: AuthSession): RoutingDestination {
    if (session.user.onboardingStatus === 'COMPLETED') {
      return { type: 'HOME' };
    }
    return {
      type: 'ONBOARDING',
      step: session.user.onboardingStep ?? 1,
    };
  }

  /**
   * Native Google Sign In flow (without WebView).
   */
  async signInWithNativeGoogle(
    mode: AuthMode,
    mockEmailForTesting?: string
  ): Promise<AuthSession> {
    if (mockEmailForTesting) {
      return await this.authenticateWithGoogle(mockEmailForTesting, mode, mockEmailForTesting);
    }

    if (!NativeGoogleSignin) {
      throw new AuthError(
        'OAUTH_FAILED',
        'Native Google Sign-In requires a Development Build (npx expo run:android) and is not supported in standard Expo Go.'
      );
    }

    try {
      await NativeGoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await NativeGoogleSignin.signIn();
      const email = response.data?.user.email || '';
      const idToken = response.data?.idToken || email;

      return await this.authenticateWithGoogle(idToken, mode, email);
    } catch (error: any) {
      if (error?.code === 'INVALID_EMAIL_DOMAIN' || error instanceof AuthError) {
        throw error;
      }
      if (error?.code === '12501' || error?.message?.includes('CANCELLED')) {
        throw new AuthError('OAUTH_CANCELLED');
      }
      throw new AuthError('OAUTH_FAILED', error?.message);
    }
  }
  async completeOnboarding(): Promise<void> {
    const session = await this.getSession();
    if (session) {
      session.user.onboardingStatus = 'COMPLETED';
      const { SecureSessionStorage } = await import('./secureStorage');
      await SecureSessionStorage.saveSession(session);
    }
  }
}

export const authService = new AuthService();
