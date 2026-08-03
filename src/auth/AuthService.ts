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
    // In pre-integration UI/Mock mode, email is extracted from credential or overrideEmail
    const email = (overrideEmail || credential).trim().toLowerCase();
    this.validateKuEmailDomain(email);

    const existingAccount = this.registeredAccounts.get(email);

    if (mode === 'signin') {
      // Must not create new account on sign-in
      if (!existingAccount) {
        throw new AuthError('ACCOUNT_NOT_FOUND');
      }
    }

    let user: AuthUser;
    if (existingAccount) {
      // Must not duplicate account on sign-up for existing account
      user = {
        id: existingAccount.id,
        email: existingAccount.email,
        name: existingAccount.name,
        onboardingStatus: existingAccount.onboardingStatus,
        onboardingStep: existingAccount.onboardingStep,
      };
    } else {
      // Sign up new @ku.th user
      const newRecord: MockAccountRecord = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        onboardingStatus: 'NOT_STARTED',
        onboardingStep: 1,
      };
      this.registeredAccounts.set(email, newRecord);
      user = { ...newRecord };
    }

    const now = Date.now();
    const session: AuthSession = {
      token: `tok_secure_${user.id}_${now}`,
      user,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days default expiration
    };

    await SecureSessionStorage.saveSession(session);
    return session;
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
}

export const authService = new AuthService();
