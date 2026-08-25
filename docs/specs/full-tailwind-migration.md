# Full Tailwind styling migration for KUQuest Mobile

## Problem Statement

As a Student, I should receive the same usable KUQuest Mobile experience across Android, iOS, and web. Today, visual behavior is split across 17 `StyleSheet.create` modules, approximately 2,793 lines of style definitions, and more than 500 production `style` usages. There are no current `className` usages, so contributors must maintain a mixture of style objects, inline values, theme constants, and native component-specific rules.

This makes visual changes harder to review, makes shared patterns harder to discover, and prevents the Tailwind v4/NativeWind setup already installed in the app from being used consistently. The migration must not change the Student journey, route behavior, API contracts, localization, authentication, Quest lifecycle behavior, or approved visual decisions recorded in the ADRs.

## Solution

Migrate static visual styling to Tailwind v4 utilities through the existing NativeWind v5 and `react-native-css` layer. Preserve dynamic runtime values as `style` values where they depend on screen width, font scale, safe-area insets, image dimensions, calculated progress, or platform APIs.

Create a shared Tailwind theme bridge for the existing KUQuest colors, spacing, font families, typography, and any approved radii or shadows. Extend the CSS-enabled component layer for every native primitive needed by the application. Migrate the UI incrementally from shared components to feature screens, deleting obsolete style modules only after their consumers are gone.

The migration is complete when all static visual styling is expressed through Tailwind classes or the shared wrapper/theme layer, while dynamic and native-only styling remains explicit and justified.

## User Stories

1. As a Student, I want the Sign-in screen to retain its current layout and visual hierarchy, so that the styling migration does not change how I authenticate.
2. As a Student, I want Academic Registration to retain its three-step flow and current control states, so that changing the styling system does not affect data entry.
3. As a Student, I want the Quest Board to retain its compact horizontal Quest Card density, so that I can continue comparing Discoverable Quests efficiently.
4. As a Student, I want Quest Board filters and sorting controls to retain their current states and affordances, so that visual migration does not alter discovery behavior.
5. As a Student, I want Quest Detail to retain its requirements, availability explanations, and lifecycle-aware action, so that styling changes do not blur the Quest Application boundary.
6. As a Student, I want the three-step Quest creation flow to retain its progress, validation, and review states, so that styling changes do not affect publishing behavior.
7. As a Student, I want the Student Profile to retain its public background, Portfolio Work, Experience, Certificates, Reviews, and Profile Rating presentation, so that the trust surface remains understandable.
8. As a Student, I want the authenticated five-destination navigation to retain its safe-area behavior, active state, unread indicator, and prominent Create action, so that navigation remains predictable.
9. As a Student, I want Thai and English UI text to retain the same meaning and layout tolerance, so that the system-locale-only language decision remains unchanged.
10. As a Student using a small device, I want content to remain readable and usable without clipping, so that Tailwind conversion does not discard existing responsive metrics.
11. As a Student using a large device or increased font scale, I want labels, controls, and content to remain accessible, so that responsive and accessibility behavior survives the migration.
12. As a Student, I want safe-area, keyboard, modal, image, and date-picker behavior to remain native, so that the styling migration does not introduce platform regressions.
13. As a Student, I want disabled, loading, empty, error, and retry states to retain their visual distinction, so that I can understand what action is available.
14. As a Student, I want image fallbacks and failed network content to retain their existing appearance, so that the API contract boundary is not hidden by styling changes.
15. As a developer, I want shared colors, spacing, typography, and font families available as Tailwind theme utilities, so that new UI does not duplicate design tokens.
16. As a developer, I want variant styling expressed through readable class combinations, so that shared components such as buttons, top bars, and navigation are easier to extend.
17. As a developer, I want CSS-enabled wrappers to provide consistent `className` behavior for native primitives, so that contributors do not need to know implementation details of the CSS runtime for every component.
18. As a developer, I want dynamic dimensions and native-only values to remain explicit, so that Tailwind adoption does not force unsafe approximations of runtime layout calculations.
19. As a developer, I want obsolete style modules removed only after their consumers are migrated, so that the repository does not retain two competing styling sources of truth.
20. As a developer, I want the route structure and domain modules to remain unchanged, so that styling work can be reviewed independently from navigation and data changes.
21. As a tester, I want existing component and screen tests to exercise rendered behavior rather than implementation-specific style objects, so that tests remain valid throughout the migration.
22. As a tester, I want focused tests for responsive metric functions and dynamic layout decisions, so that behavior which cannot be represented by static classes remains protected.
23. As a tester, I want the same full test, typecheck, lint, and web-export commands to remain available, so that each migration slice has a repeatable verification gate.
24. As a tester, I want representative Android, iOS, and web checks for safe areas, font scaling, shadows, images, modals, and keyboard behavior, so that platform-specific styling regressions are found before release.
25. As a maintainer, I want migration slices to be independently reviewable and reversible, so that a styling regression can be isolated without reverting unrelated Quest, Profile, or authentication work.
26. As a maintainer, I want the migration to preserve the existing ADR decisions, so that Tailwind adoption does not become an accidental redesign of Quest discovery, Quest creation, cancellation, authentication, navigation, or public Student Profile behavior.

## Implementation Decisions

- Use the already-installed Tailwind v4, NativeWind v5 preview, and `react-native-css` integration rather than introducing another styling framework.
- Keep explicit CSS-enabled wrappers as the styling boundary. Do not enable a global class-name polyfill for every native component unless a later decision shows that the explicit wrapper boundary is insufficient.
- Extend the wrapper layer for the native primitives used by the product, including safe-area containers, touchable controls, list containers, keyboard-aware containers, text inputs, scroll containers, images, and animated containers.
- Register the existing design tokens as Tailwind theme variables. The migration must preserve the current color values, spacing scale, font families, typography intent, and approved visual hierarchy unless a separate design decision is made.
- Add a small class-composition helper based on the already-installed `clsx` and `tailwind-merge` packages for component variants and conditional states.
- Convert static layout and visual declarations to Tailwind utilities. This includes flex layout, spacing, sizing, borders, colors, typography, opacity, alignment, positioning, and supported shadows.
- Retain a `style` prop for values that are calculated at runtime, including responsive metrics, font-scale adjustments, safe-area insets, image dimensions, percentage progress, dynamic card widths, and native component APIs that do not accept class names.
- Retain native-specific behavior for `@expo/ui` controls, date pickers, image pickers, icons, modals, safe-area providers, and other platform APIs. Add adapters only where styling must cross the native component boundary.
- Preserve the existing Expo Router route-only boundary. No styling helper, test, fixture, or non-route file will be added under the route directory.
- Preserve the authenticated primary navigation boundary and all domain flows described by the ADRs. Tailwind conversion is a presentation refactor, not a navigation or domain-model change.
- Migrate in independently reviewable slices: theme and wrapper foundation, shared UI, Sign-in and lightweight placeholders, Academic Registration, Student Profile, Quest creation, and Quest Board/Quest Detail.
- Remove a legacy style module only when no production consumer imports it and the replacement is covered by the relevant rendered behavior tests.
- Keep current responsive metric functions as domain-independent layout seams. They may continue returning numeric values consumed by inline styles.
- Keep the existing test-folder convention: feature-owned tests stay in feature `__tests__` directories, cross-feature tests stay in the central test directory, and no tests move into route directories.

## Testing Decisions

- The highest test seam is the rendered component or screen boundary. Tests should assert observable behavior, accessibility semantics, content, interaction, state transitions, and layout-critical outcomes—not the presence of a particular Tailwind class or the existence of a `StyleSheet` object.
- Existing React Native Testing Library tests are the primary prior art. They already cover Sign-in, Academic Registration, Student Profile, Quest Board, Quest Detail, Quest Application, navigation, API boundaries, and layout metrics.
- Pure responsive metric functions remain unit-tested with explicit width and font-scale inputs. These tests protect the dynamic values that Tailwind cannot safely replace with static utilities.
- Shared component tests should cover button variants, disabled state, top-bar variants, navigation active/unread/create states, and placeholder actions through accessibility roles, labels, and visible text.
- Feature screen tests should continue covering loading, empty, error, retry, disabled, and success states. Styling migration must not weaken existing state coverage.
- Add or update Jest CSS-runtime setup only as required for rendered class-based components. Tests must not rely on snapshots of generated CSS or internal CSS runtime structures.
- After each migration slice, run the existing typecheck, lint, and Jest suite. Run an Expo web export to verify CSS compilation and static route bundling.
- Perform representative device checks on Android and iOS development builds for safe-area padding, increased font scale, keyboard avoidance, modal layering, images, shadows/elevation, date pickers, and touch targets.
- Use the existing Maestro/EAS direction for future critical E2E journeys, but do not create a new E2E framework solely for this presentation refactor.
- A good migration test proves that a Student can still complete the same journey and observe the same result after the styling implementation changes. It should fail when user-visible behavior regresses and remain stable when only class composition is reorganized.

## Out of Scope

- Redesigning the KUQuest Mobile visual language or changing approved colors, spacing decisions, Quest Card density, navigation structure, or screen hierarchy.
- Changing Expo SDK, React Native, Expo Router, NativeWind, or Tailwind versions as part of this migration.
- Replacing `@expo/ui`, `expo-image`, `expo-image-picker`, native Google Sign-in, Better Auth, or the existing native date-picker integration.
- Changing the API contract, cookie-based Better Auth session boundary, Quest Application behavior, Academic Registration data model, Student Profile data model, or localization rules.
- Moving or redesigning route files, changing deep links, or changing authenticated navigation.
- Adding a new design-token source that competes with the existing theme modules.
- Converting every dynamic `style` value into an arbitrary Tailwind class when the value depends on runtime dimensions, insets, font scale, or native APIs.
- Adding snapshot tests as the primary validation strategy.
- Adding Maestro flows, EAS Workflows, visual-regression infrastructure, or a new testing framework solely for this migration.
- Removing `react-test-renderer` as part of the styling migration; that cleanup may be handled separately based on the Expo testing guidance.

## Further Notes

- The current installation is a foundation, not a completed migration: production code has no `className` usage yet.
- The first tracer-bullet slice should migrate the shared Button component and its variants because it is small, reused, and exercises theme colors, typography, spacing, disabled state, and conditional classes.
- The migration should preserve the compact Quest Card and three-step Quest creation decisions from ADR-0001 and ADR-0002, the native authentication boundary from ADR-0004, system-locale-only behavior from ADR-0005, the API boundary from ADR-0006, authenticated navigation from ADR-0007, public Student Profile scope from ADR-0008, and Quest Board/Application boundaries from ADR-0009.
- The assumed seam is the existing rendered UI test boundary. If implementation reveals that the CSS runtime cannot be tested reliably through that seam, the smallest additional seam should be a shared wrapper-level test utility rather than tests coupled to individual generated class rules.
- This is a multi-slice implementation effort. Each slice should include a before/after visual check and should leave the application buildable and testable.
