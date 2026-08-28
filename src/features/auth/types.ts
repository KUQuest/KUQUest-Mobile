export type OnboardingStep = 1 | 2 | 3;

export type AuthUser = import('../../api/contracts').AuthUser;

export interface AuthSession {
  user: AuthUser;
}

export type AuthErrorCode =
  | 'INVALID_EMAIL_DOMAIN'
  | 'OAUTH_CANCELLED'
  | 'PLAY_SERVICES_UNAVAILABLE'
  | 'OAUTH_FAILED'
  | 'API_ERROR'
  | 'SESSION_EXPIRED';

export interface AuthErrorOptions {
  cause?: unknown;
}

export class AuthError extends Error {
  readonly cause?: unknown;

  constructor(
    public code: AuthErrorCode,
    message?: string,
    options?: AuthErrorOptions,
  ) {
    super(message || code);
    this.name = 'AuthError';
    if (options && 'cause' in options) this.cause = options.cause;
  }
}

export interface AuthAdapter {
  /** Start the configured Google sign-in flow. */
  authenticate(): Promise<AuthSession>;
  /**
   * Retrieve the active Better Auth session, returning null if expired or missing.
   */
  getSession(): Promise<AuthSession | null>;
  /** Resolve the post-auth destination from the current registration state. */
  getRoutingDestination(): Promise<RoutingDestination>;
  /**
   * Sign out, always clearing local session even if backend revocation fails.
   */
  signOut(): Promise<void>;
}

export type RoutingDestination =
  | { type: 'HOME' }
  | { type: 'ONBOARDING'; step: OnboardingStep };
