export type AuthMode = 'signin' | 'signup';

export type OnboardingStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  onboardingStatus: OnboardingStatus;
  onboardingStep?: number;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  createdAt: number;
  expiresAt: number;
}

export type AuthErrorCode =
  | 'INVALID_EMAIL_DOMAIN'
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_ALREADY_EXISTS'
  | 'OAUTH_CANCELLED'
  | 'OAUTH_FAILED'
  | 'API_ERROR'
  | 'SESSION_EXPIRED';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = 'AuthError';
  }
}

export interface AuthAdapter {
  /**
   * Authenticate with Google Credential/Token via Typed Adapter.
   * Does NOT guess unverified REST endpoint names.
   */
  authenticateWithGoogle(credential: string, mode: AuthMode): Promise<AuthSession>;
  /**
   * Retrieve active session from secure storage, returning null if expired or missing.
   */
  getSession(): Promise<AuthSession | null>;
  /**
   * Sign out, always clearing local session even if backend revocation fails.
   */
  signOut(): Promise<void>;
  /**
   * Explicitly clear local session from secure storage.
   */
  clearSession(): Promise<void>;
}

export type RoutingDestination =
  | { type: 'HOME' }
  | { type: 'ONBOARDING'; step: number };
