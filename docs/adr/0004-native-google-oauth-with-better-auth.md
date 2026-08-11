# Native Google Sign-In with Better Auth Expo sessions

The mobile app uses `@react-native-google-signin/google-signin` to obtain a Google ID token without opening a browser. It passes that token to `authClient.signIn.social({ provider: 'google', idToken: { token } })`, allowing Better Auth to verify the token and create the session.

The Expo client is configured with `expoClient()` and `expo-secure-store`. Better Auth owns session and cookie persistence; the mobile app does not persist a separate session token. Custom Student API requests read `authClient.getCookie()` and send the result in the `Cookie` header with `credentials: 'omit'`.

This deliberately avoids Expo AuthSession, browser OAuth redirects, and a mobile Bearer-token authentication layer. Backend Bearer support, if required by other clients, remains a separate backend compatibility decision.
