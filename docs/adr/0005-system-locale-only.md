# In-App Locale Selection

KUQuest supports Thai (`th`) and English (`en`) UI text. The active language
is selected in Settings with a TH/EN switch instead of being derived from the
operating system locale.

The locale provider starts with Thai as the default and persists an explicit
selection with `expo-secure-store`. Changing the selection updates localized
content immediately and remains effective across app restarts. OS locale
changes do not alter the app language.

This gives Members control over the language used by KUQuest while keeping the
supported language set intentionally limited to Thai and English.
