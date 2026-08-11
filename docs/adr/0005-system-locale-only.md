# System Locale Only for UI Language

The mobile application is required to support both Thai (`th`) and English (`en`) UI texts. However, instead of providing an in-app toggle to switch the language, we have decided to derive the language exclusively from the OS-level locale settings (using `expo-localization`).

By strictly tying the UI language to the system locale:
- We enforce consistency across the OS and the app.
- We simplify the application state (removing manual toggle overrides and persistence).
- If the system locale is anything other than Thai (`th`), the app defaults to English (`en`).

This introduces a minor UX friction for users who might prefer to use the app in a language different from their OS, but it aligns with the strict requirements established during development to prevent manual user overrides.
