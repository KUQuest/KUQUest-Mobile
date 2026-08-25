# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Native authentication configuration

The app does not create local mock accounts. A development build needs these runtime variables:

- `EXPO_PUBLIC_API_URL` — API origin, for example `http://localhost:5000`.
- `EXPO_PUBLIC_TERMS_VERSION` — version recorded when the user accepts the terms.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — Google web client ID used by native sign-in.
- `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` — iOS URL scheme; when set, the native Google Sign-In config plugin is enabled.

Native Google Sign-In passes its verified ID token to `authClient.signIn.social`. The Better Auth Expo client persists the Better Auth session and cookies in SecureStore. Protected Student API calls read `authClient.getCookie()` and send it as the `Cookie` header with `credentials: omit`.

The native Google module requires a development build; Expo Go cannot provide the native sign-in implementation.

To rebuild and install a development client with the native Google module included, run:

```bash
npm run dev:android
# or
npm run dev:ios

# start Metro for the installed development client
npm run dev:start
```

After the native dependency or app config changes, restart Metro and open the installed development client—not Expo Go.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
