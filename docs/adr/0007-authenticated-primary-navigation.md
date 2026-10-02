# Authenticated Primary Navigation

The authenticated app uses a persistent five-destination bottom navigation model — Quest Board, My Quests, Create, Chat, and Student Profile — implemented as an Expo Router JavaScript Tabs layout with a custom tab bar. This keeps route state, deep links, localization, safe-area handling, and accessibility under one navigation boundary while preserving the prominent central Create action from the approved design.

The tab bar is rendered only inside the authenticated `(tabs)` route group, so Sign-in and Academic Registration remain outside the main app navigation.
