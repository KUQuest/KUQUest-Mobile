import { AuthService } from '../auth/AuthService';
import { SecureSessionStorage } from '../auth/secureStorage';
import { AuthError } from '../auth/types';

describe('AuthService & SecureSessionStorage (FE-19 Requirements)', () => {
  let auth: AuthService;

  beforeEach(async () => {
    auth = new AuthService();
    SecureSessionStorage.resetInMemoryStore();
    await SecureSessionStorage.clearSession();
  });

  afterEach(async () => {
    await SecureSessionStorage.clearSession();
  });

  test('1. Rejects email addresses not ending with @ku.th with INVALID_EMAIL_DOMAIN error', async () => {
    await expect(
      auth.authenticateWithGoogle('student@gmail.com', 'signin', 'student@gmail.com')
    ).rejects.toThrow(new AuthError('INVALID_EMAIL_DOMAIN'));

    await expect(
      auth.authenticateWithGoogle('student@ku.ac.th', 'signup', 'student@ku.ac.th')
    ).rejects.toThrow(new AuthError('INVALID_EMAIL_DOMAIN'));
  });

  test('2. Sign-In with unregistered @ku.th email throws ACCOUNT_NOT_FOUND without creating account', async () => {
    await expect(
      auth.authenticateWithGoogle('new.student@ku.th', 'signin', 'new.student@ku.th')
    ).rejects.toThrow(new AuthError('ACCOUNT_NOT_FOUND'));

    const session = await auth.getSession();
    expect(session).toBeNull();
  });

  test('3. Sign-Up with new @ku.th email creates a session and stores in SecureStorage', async () => {
    const session = await auth.authenticateWithGoogle('freshman@ku.th', 'signup', 'freshman@ku.th');

    expect(session.user.email).toBe('freshman@ku.th');
    expect(session.user.onboardingStatus).toBe('NOT_STARTED');
    expect(session.token).toContain('tok_secure_');

    const stored = await auth.getSession();
    expect(stored).toEqual(session);
  });

  test('4. Sign-Up with existing @ku.th account does not duplicate account and returns existing onboarding status', async () => {
    auth.registerMockAccount({
      id: 'usr_existing',
      email: 'senior@ku.th',
      name: 'Senior Student',
      onboardingStatus: 'COMPLETED',
    });

    const session = await auth.authenticateWithGoogle('senior@ku.th', 'signup', 'senior@ku.th');
    expect(session.user.id).toBe('usr_existing');
    expect(session.user.onboardingStatus).toBe('COMPLETED');
  });

  test('5. Routing seam maps COMPLETED to HOME and IN_PROGRESS/NOT_STARTED to ONBOARDING', async () => {
    const homeSession = await auth.authenticateWithGoogle('student.test@ku.th', 'signin', 'student.test@ku.th');
    expect(AuthService.getRoutingDestination(homeSession)).toEqual({ type: 'HOME' });

    const onboardSession = await auth.authenticateWithGoogle('newcomer.test@ku.th', 'signin', 'newcomer.test@ku.th');
    expect(AuthService.getRoutingDestination(onboardSession)).toEqual({ type: 'ONBOARDING', step: 2 });
  });

  test('6. Sign-Out ALWAYS clears session storage even if backend revocation callback fails', async () => {
    await auth.authenticateWithGoogle('student.test@ku.th', 'signin', 'student.test@ku.th');
    expect(await auth.getSession()).not.toBeNull();

    const failingBackendRevocation = jest.fn().mockRejectedValue(new Error('Backend 500 Network Error'));

    await expect(auth.signOut(failingBackendRevocation)).rejects.toThrow('Backend 500 Network Error');

    // Verify session storage is cleared regardless of backend failure
    expect(await auth.getSession()).toBeNull();
  });

  test('7. Expired session is automatically removed when getSession() is called', async () => {
    const expiredSession = {
      token: 'tok_old',
      user: {
        id: 'usr_old',
        email: 'old@ku.th',
        name: 'Old User',
        onboardingStatus: 'COMPLETED' as const,
      },
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1000, // Expired 1 second ago
    };

    await SecureSessionStorage.saveSession(expiredSession);

    const retrieved = await SecureSessionStorage.getSession();
    expect(retrieved).toBeNull();
  });
});
