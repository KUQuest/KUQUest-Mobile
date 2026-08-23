# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Anyone eligible to sign in with a verified `@ku.th` Google account. They use the product to discover available job opportunities and to post opportunities for other eligible people.

## Product Purpose

KUQuest is a KU-only job board where people with `@ku.th` accounts can discover, compare, and create Quest-based work opportunities. Success means eligible people can find relevant opportunities and understand enough about them to decide whether to apply.

## Positioning

A job board restricted to the `@ku.th` community, using structured Quests with clear requirements, timing, participation, and per-person rewards.

## Operating Context

- Sign-in uses Google authentication and is restricted to the `@ku.th` email domain.
- A first successful sign-in leads to Academic Registration before the main app can be used.
- Authenticated navigation includes Quest Board, My Quests, Create, Chat, and Student Profile.
- The Quest Board supports discovery through search, filters, sorting, and Quest Detail before applying.
- Creating a Quest uses a three-step flow covering details, schedule/location, and participants/reward.
- The app supports Thai and English locales and uses Thai baht for rewards.
- The product targets native Android and iOS development builds.

## Capabilities and Constraints

- A Quest is a structured job opportunity with requirements, schedule, location, participation mode, candidate-selection mode, capacity, and reward per person.
- The Quest Board shows discoverable Quests; Quest Detail owns full requirements and lifecycle-aware application actions.
- First-come Quests can produce an accepted participation outcome when capacity remains. Reviewed-candidate Quests produce an Application Pending outcome.
- Public Student Profile information includes reputation and background such as Profile Rating, completed Quest count, Experience, Portfolio Work, Certificates, and eligible Reviews.
- Private contact details and Student ID are excluded from public Student Profiles.
- Google Sign-In requires an installed native development build; Expo Go is insufficient for native authentication validation.
- The current implementation contains local Quest fixtures and placeholder surfaces while some API-backed functionality is still incomplete.

## Brand Commitments

- The existing product name is KUQuest and the current implementation includes KUQuest logo assets at `logo.svg` and `topbar-logo.svg`.
- The existing user-facing domain language uses Quest, Quest Board, My Quests, Student Profile, Academic Registration, and Review.
- The binding status of the existing visual identity and logo assets has not been separately confirmed.

## Evidence on Hand

- Domain vocabulary and product boundaries: `CONTEXT.md`.
- Navigation and product decisions: `docs/adr/0007-authenticated-primary-navigation.md`, `docs/adr/0008-public-student-profile-reputation.md`, and `docs/adr/0009-quest-board-discovery-and-application-boundary.md`.
- Quest Board implementation and deterministic local states: `src/features/questBoard/QuestBoardScreen.tsx` and `src/features/questBoard/questBoardHarness.ts`.
- Quest creation implementation: `src/features/createQuest/CreateQuestScreen.tsx`.
- Existing native app configuration and development-build guidance: `package.json`, `app.config.ts`, and `README.md`.
- No production evidence, testimonials, customer claims, or live Quest creation proof is currently established; future work must not fabricate them.

## Product Principles

- Keep eligibility within the trusted `@ku.th` community.
- Make opportunities structured and comparable before someone applies.
- Separate low-risk discovery from lifecycle-changing participation.
- Use public profile reputation to build trust without exposing private identity details.
- Support the bilingual, native mobile context of the KU community.
