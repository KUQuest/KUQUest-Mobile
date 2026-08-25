import type { SignInResponse } from '@react-native-google-signin/google-signin';

export interface NativeGoogleSigninApi {
  configure(options: { webClientId?: string }): void;
  hasPlayServices(options: { showPlayServicesUpdateDialog: boolean }): Promise<boolean>;
  signIn(): Promise<SignInResponse>;
  signOut(): Promise<null>;
}

export type NativeGoogleSigninSuccessResponse = Extract<SignInResponse, { type: 'success' }>;

export interface NativeGoogleSigninModule {
  GoogleSignin: NativeGoogleSigninApi;
  isSuccessResponse(response: SignInResponse): response is NativeGoogleSigninSuccessResponse;
}

/**
 * Loads the native Google module only when the app is running in a binary that
 * contains it. Expo Go and stale development builds do not register RNGoogleSignin.
 */
export function loadNativeGoogleSignin(): NativeGoogleSigninModule | null {
  try {
    // The module registry lookup must be caught for Expo Go and stale builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('@react-native-google-signin/google-signin') as Partial<NativeGoogleSigninModule>;
    if (!loaded.GoogleSignin || typeof loaded.isSuccessResponse !== 'function') return null;
    return loaded as NativeGoogleSigninModule;
  } catch {
    return null;
  }
}
