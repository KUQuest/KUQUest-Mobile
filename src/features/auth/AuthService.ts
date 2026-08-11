import {
  AuthAdapter,
  AuthError,
  AuthMode,
  AuthSession,
  isAuthSession,
  OnboardingStatus,
  RoutingDestination,
} from './types';
import { SecureSessionStorage } from './secureStorage';

// Safely require GoogleSignin to avoid crash in Expo Go where native module is missing
interface NativeGoogleSigninApi {
  configure(options: { webClientId?: string }): void;
  hasPlayServices(options: { showPlayServicesUpdateDialog: boolean }): Promise<void>;
  signIn(): Promise<{ data?: { idToken?: string; user?: { email?: string } } }>;
  signOut(): Promise<void>;
}

let NativeGoogleSignin: NativeGoogleSigninApi | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleSigninPkg = require('@react-native-google-signin/google-signin') as {
    GoogleSignin: NativeGoogleSigninApi;
  };
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

  private async authenticateInMemory(email: string, mode: AuthMode): Promise<AuthSession> {
    const normalizedEmail = email.toLowerCase();
    const existing = this.registeredAccounts.get(normalizedEmail);
    if (!existing && mode === 'signin') {
      throw new AuthError('ACCOUNT_NOT_FOUND');
    }

    const account = existing ?? {
      id: `usr_${Date.now()}`,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      onboardingStatus: 'NOT_STARTED' as const,
    };
    this.registeredAccounts.set(normalizedEmail, account);

    const session: AuthSession = {
      token: `tok_secure_${Date.now()}`,
      user: account,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    await SecureSessionStorage.saveSession(session);
    return session;
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
    const email = (overrideEmail ?? credential).trim().toLowerCase();
    this.validateKuEmailDomain(email);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      if (process.env.NODE_ENV === 'test') {
        return this.authenticateInMemory(email, mode);
      }
      throw new AuthError('API_ERROR', 'API URL is not configured');
    }

    try {
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

      if (!response.ok) {
        if (response.status === 404) {
          throw new AuthError('ACCOUNT_NOT_FOUND');
        }
        if (response.status === 409) {
          throw new AuthError('ACCOUNT_ALREADY_EXISTS');
        }
        throw new AuthError('API_ERROR', await response.text());
      }

      const data: unknown = await response.json();
      if (!isAuthSession(data)) {
        throw new AuthError('API_ERROR', 'Authentication response was invalid');
      }
      const session = data;

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
          } catch {
            // Local session cleanup below remains authoritative.
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
      const email = response.data?.user?.email || '';
      const idToken = response.data?.idToken || email;

      return await this.authenticateWithGoogle(idToken, mode, email);
    } catch (error: unknown) {
      const nativeError = error as { code?: string; message?: string };
      if (nativeError.code === 'INVALID_EMAIL_DOMAIN' || error instanceof AuthError) {
        throw error;
      }
      if (nativeError.code === '12501' || nativeError.message?.includes('CANCELLED')) {
        throw new AuthError('OAUTH_CANCELLED');
      }
      throw new AuthError('OAUTH_FAILED', nativeError.message);
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
