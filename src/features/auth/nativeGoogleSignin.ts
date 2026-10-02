import { Platform } from "react-native";
import type { SignInResponse } from "@react-native-google-signin/google-signin";

export interface NativeGoogleSigninApi {
  configure(options: { webClientId?: string }): void;
  hasPlayServices(options: {
    showPlayServicesUpdateDialog: boolean;
  }): Promise<boolean>;
  signIn(): Promise<SignInResponse>;
  signOut(): Promise<null>;
}

export type NativeGoogleSigninSuccessResponse = Extract<
  SignInResponse,
  { type: "success" }
>;

export interface NativeGoogleSigninModule {
  GoogleSignin: NativeGoogleSigninApi;
  isSuccessResponse(
    response: SignInResponse
  ): response is NativeGoogleSigninSuccessResponse;
}

/**
 * Loads the native Google module only on native platforms and in a binary that
 * contains it. Web, Expo Go and stale development builds must not invoke it.
 */
export function loadNativeGoogleSignin(): NativeGoogleSigninModule | null {
  if (Platform.OS === "web") return null;

  try {
    // The module registry lookup must be caught for Expo Go and stale builds.
    const loaded =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@react-native-google-signin/google-signin") as Partial<NativeGoogleSigninModule>;
    if (!loaded.GoogleSignin || typeof loaded.isSuccessResponse !== "function")
      return null;
    return loaded as NativeGoogleSigninModule;
  } catch {
    return null;
  }
}
