# KUQuest Mobile Code Styles

Authoritative coding conventions, architecture patterns, and style rules for KUQuest Mobile. All automated agents, subagents, and human contributors must follow these standards.

---

## 1. Formatting & Tooling

Formatting is enforced via Prettier (`.prettierrc`) and ESLint (`eslint.config.js`). Every commit is verified by Husky pre-commit hooks (`bun run typecheck` + `bun run test`).

- **Indentation**: 2 spaces (no tabs).
- **Quotes**: Double quotes (`"..."`) for strings and JSX attributes; single quotes allowed within double quotes.
- **Semicolons**: Semicolons required at the end of statements.
- **Trailing commas**: ES5 standard (objects, arrays; no trailing comma on single-line declarations).
- **Print width**: 80 characters.
- **TypeScript**: `strict: true` in `tsconfig.json`. No implicit `any`; avoid non-null assertions (`!`) unless narrowed by invariants.
- **Package Manager**: Use `bun` exclusively (`bun run <script>`, `bun add <pkg>`).

---

## 2. Imports & Aliases

Organize imports into 4 distinct groups separated by a single blank line:

1. **Core & Framework**: `react`, `react-native`, `expo-*`, `expo-router`.
2. **Tailwind / UI Primitives**: `@/tw`, `@/tw/cn`, `lucide-react-native`, `@expo/vector-icons`.
3. **Internal Path Aliases (`@/*`)**: Components, feature modules, API clients, theme tokens, locales (`@/components/...`, `@/features/...`, `@/theme/...`, `@/locales/...`).
4. **Relative Imports**: Sibling modules, styles, local components, and types within the same feature folder (`./components/...`, `./styles/...`, `./types`).

```tsx
import React, { useCallback, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { CheckCircle, Clock } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";

import { CandidateReviewSheet } from "./components/CandidateReviewSheet";
import styles from "./styles/questBoardStyles";
import type { QuestViewData } from "./types";
```

### Import Rules

- Use path alias `@/*` (resolving to `./src/*`) for all cross-module imports.
- Use relative imports (`./...`, `../...`) strictly within the same feature folder.
- Use `import type { ... }` for type-only imports to preserve clean bundler tree-shaking.

---

## 3. Directory Layout & Feature Architecture

```
src/
├── app/                  # Expo Router file-based routes (screens, tabs, modals)
├── features/             # Domain feature modules (self-contained vertical slices)
│   └── <feature>/        # e.g., questBoard, profile, auth, chat, myQuests, createQuest
│       ├── <Feature>Screen.tsx   # Top-level screen component
│       ├── <feature>Module.ts    # Service, state machine, or workflow logic
│       ├── types.ts              # Feature-specific TypeScript interfaces/types
│       ├── components/           # Feature-local components
│       ├── styles/               # Feature-local styles / Tailwind class maps
│       └── __tests__/            # Unit and component tests for this feature
├── components/           # Shared, domain-agnostic UI and navigation components
│   ├── ui/               # Button, LoadingSkeleton, TopBar, QuestFundingSummary
│   └── navigation/       # BottomNav, NavigationVisibilityContext
├── api/                  # HTTP client, Better Auth cookie bridge, Zod contracts
├── locales/              # Thai/English localization dictionaries and LocaleProvider
├── theme/                # Design tokens (colors, spacing, typography, layout metrics)
└── tw/                   # NativeWind primitives and cn() utility
```

### Feature Module Rules

- **Self-contained**: Keep feature-local sub-components, types, and styles inside `src/features/<feature>/`.
- **Screen Separation**: `<Feature>Screen.tsx` owns lifecycle hooks, safe-area layout, and screen coordination; extract complex rendering into `components/`.
- **Pure Logic**: Extract state machines, calculations, and data mappings into pure functions (`<feature>Module.ts` or `<feature>Workflow.ts`) covered by fast unit tests.

---

## 4. UI, Styling & NativeWind

KUQuest Mobile uses **Tailwind CSS / NativeWind v5** with unified design tokens.

- **UI Primitives**: Import `View`, `Text`, `Pressable`, `ScrollView`, `SafeAreaView`, and `Image` from `@/tw`.
- **Dynamic Classes**: Combine class names with `cn(...)` from `@/tw/cn`:
  ```tsx
  <View
    className={cn(
      "rounded-xl p-4 border",
      isActive ? "border-primary bg-primary/5" : "border-border bg-card"
    )}
  />
  ```
- **Design Tokens**: For layout metrics that require numeric calculation (e.g. padding scaled by `fontScale` or screen width), read values from `@/theme/`:
  - `colors` (`@/theme/colors`): Semantic palette (brand, primary, background, card, border, text).
  - `spacing` (`@/theme/spacing`): Standard increments (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `2xl: 32`).
  - `typography` (`@/theme/typography`): Font families (`Noto Sans Thai`, `Be Vietnam Pro`), weights, and sizes.
- **Icons**: Use `lucide-react-native` with semantic colors:
  ```tsx
  <Clock size={16} color={colors.textMuted} />
  ```
- **Accessibility**: Provide `accessibilityRole` and `accessibilityLabel` for interactive elements (`Pressable`, icon buttons, tabs).

---

## 5. Mobile & Expo SDK 57 Patterns

- **Navigation**: Use Expo Router (`useRouter()`, `useLocalSearchParams()`, `useFocusEffect()`). Never import React Navigation core navigators directly.
- **Safe Areas**: Always respect notches and home indicators with `useSafeAreaInsets()` from `react-native-safe-area-context`.
- **Authentication**: Native Google Sign-In requires development build (`bun run dev:android` or `bun run dev:ios`). Better Auth session tokens and cookies are managed through SecureStore (`@better-auth/expo`).
- **Responsive Layouts**: Use `useWindowDimensions()` and theme metric helpers (`getAppChromeMetrics`, `getProfileLayoutMetrics`) for font-scale and screen-width responsiveness.

---

## 6. Domain & Data Invariants

- **Ubiquitous Language**: Follow `CONTEXT.md` rigorously. Use `Member`, `Hirer`, `Worker`, `Candidate`, `Prospective Worker`, `Accepted Participant`, `FIRST_COME_FIRST_SERVED`, `Academic Registration`.
  - Prohibited: `KU Account Holder`, `NO_CANDIDATE`, `Giver`, `Hunter`, `QUEST_DISPUTED`, `UNFILLED`.
- **Currency & Escrow**:
  - Always calculate and store money in **Integer Satang** (฿1.00 = 100 Satang).
  - `questFundingTotal` = net `questReward` + `platformFee` (`ceil(reward × feeRate)`).
- **Canonical Quest States**:
  - Use the exact 7 states: `QUEST_DRAFT`, `QUEST_OPEN`, `QUEST_ASSIGNED`, `QUEST_IN_PROGRESS`, `QUEST_COMPLETED`, `QUEST_CANCELLED`, `QUEST_FAILED`.
  - Sub-state flows (10m Quest Edits, 10m Underfilled FCFS consent) occur within `QUEST_ASSIGNED` without altering the Quest state enum.
- **Localization**: Wrap user-visible labels in localized dictionaries (`src/locales/*`) consumed via `useLocale()`.

---

## 7. Naming Conventions

| Entity               | Pattern                                   | Example                                                          |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| React Components     | `PascalCase`                              | `QuestCard.tsx`, `ProfileHeader.tsx`                             |
| Screen Files         | `PascalCaseScreen.tsx`                    | `QuestBoardScreen.tsx`, `ChatInboxScreen.tsx`                    |
| Route Files          | File-based `kebab-case.tsx` or `[id].tsx` | `app/(tabs)/index.tsx`, `app/quest/[id].tsx`                     |
| Hooks                | `camelCase` with `use` prefix             | `useLocale.ts`, `useAuthEnvironment.ts`                          |
| Modules / Utilities  | `camelCase.ts`                            | `profileModule.ts`, `questWorkflow.ts`, `cn.ts`                  |
| Types & Interfaces   | `PascalCase`                              | `QuestViewData`, `ProfileResponse`, `AcademicRegistrationStatus` |
| Enums / State Values | `UPPER_SNAKE_CASE` with entity prefix     | `QUEST_ASSIGNED`, `ASSIGNMENT_ACTIVE`, `PROOF_APPROVED`          |
| Style Files          | `camelCaseStyles.ts`                      | `questBoardStyles.ts`, `profileComponentStyles.ts`               |
| Test Files           | `<Target>.test.ts` or `<Target>.test.tsx` | `profileModule.test.ts`, `QuestBoardScreen.test.tsx`             |

---

## 8. Testing Standards

- **Location**: Test files live in a `__tests__/` folder adjacent to the tested code.
- **Framework**: Jest (`jest-expo`) + React Native Testing Library (`@testing-library/react-native`).
- **Focus on Behavior**: Test observable user interactions, visible text, accessibility roles, loading skeletons, error fallbacks, and state changes. Avoid asserting private component structure or Tailwind class strings.
- **Mocking**: Mock native modules and API boundaries cleanly in `jest.setup.js` or local test mocks.
- **Verification Commands**:
  ```bash
  bun run typecheck   # Type-check TypeScript definitions
  bun run lint        # Lint files with Expo ESLint
  bun run test        # Run full Jest test suite
  ```
