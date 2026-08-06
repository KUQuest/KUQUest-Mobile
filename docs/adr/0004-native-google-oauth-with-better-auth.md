# Native Google OAuth Integration with Better Auth

To provide a seamless mobile experience (no embedded WebViews or external browser bounces), we decided to use the Native Google Sign-In SDK (`@react-native-google-signin/google-signin`) on the Android app, rather than the default browser-based OAuth redirect flow provided by Better Auth's `/api/auth/sign-in/social` endpoint.

By using the native SDK, the mobile client receives a Google `idToken` directly from the OS. This requires the backend (via ticket BE-69) to expose a specific endpoint capable of accepting and verifying this `idToken` (or access token) to issue a database-backed session, instead of relying on the standard Better Auth web callback flow. This decision creates a deviation from standard web-centric authentication but guarantees the native UX required by FE-19.
