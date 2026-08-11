# Mobile UI sizing best practices for KUQuest Mobile

**Research date:** 2026-08-12
**Scope:** Expo SDK 57 / React Native 0.86 mobile UI sizing, responsive layout, safe areas, typography, and bottom navigation.
**Source policy:** First-party sources only: Expo SDK 57 documentation, React Native documentation, Android Developers, and Apple Human Interface Guidelines.

## How to read this report

- **Sourced fact** means the cited platform or framework documentation states it.
- **Repo observation** means a read-only observation of the current repository.
- **Inference** means a project-specific conclusion derived from those facts and observations.
- **Recommendation** means the proposed direction for a later implementation; this report does not change app source code.

## Executive recommendation

Treat the real phone as a compact **logical window**, not as a miniature version of the reference image. Keep touch targets large enough for reliable interaction, but make the visual chrome and content composition responsive.

For this repo, the later implementation should:

1. Use React Native logical layout dimensions from `useWindowDimensions()` and classify the available window width, with Android's compact-width boundary of `<600dp` as the broad phone class. Keep any narrower `<400` tuning as a repo-specific visual variant, not as a device-density rule.
2. Separate **visual size**, **layout reservation**, and **touch target**. A 24–30 logical-pixel icon can sit inside a 48dp/44pt-or-larger pressable area; shrinking the hit area to make the UI look smaller would be the wrong fix.
3. Make the header and profile content content-driven where possible. Avoid scaling every dimension by one global factor. Constrain large images and text by available width, allow text to wrap, and use flex/percentage/max-width layout for cards and sections.
4. Establish one owner for each safe-area edge. Either a screen/container applies the top/bottom inset or a component applies it—not both. The bottom navigation's measured outer height should be used only when content can actually pass behind an overlaid bar.
5. Preserve font scaling. Do not disable `Text` font scaling to make the screenshot fit. Verify the header, tab labels, profile name, and buttons at large Android font settings and with iOS larger text.
6. Treat **Create** as an action rather than a selected tab if the product keeps the reference design. Apple’s guidance says tab bars are for navigation, not actions; a visually centered floating action can remain, but it should not behave or announce itself as a selected navigation tab.
7. Verify on a compact Android phone, a larger phone, landscape, split-screen/resized windows where available, and at large text settings before choosing final numbers.

The likely fix is therefore a layout audit and ownership correction, followed by modest visual reductions—not a PixelRatio-based global downscale.

## Current repository context (read-only)

- **Repo observation:** [`package.json`](../../package.json) uses Expo `~57.0.9`, React Native `0.86.2`, Expo Router `~57.0.9`, and `react-native-safe-area-context` `~5.7.0`. Expo’s SDK 57 reference associates SDK 57 with React Native 0.86 and React 19.2.3 ([Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)).
- **Repo observation:** [`src/theme/layout.ts`](../../src/theme/layout.ts) uses a `<400` width branch with a `68` logical-unit header, `112×56` logo, `72` minimum navigation height, `60` navigation-item height, `56` Create circle, and `11/14` tab label font/line height. The default branch uses larger values.
- **Repo observation:** [`TopBar.tsx`](../../src/components/ui/TopBar.tsx) consumes those fixed dimensions. It is rendered inside screens whose `SafeAreaView` uses the default edges, so the screen safe-area padding and the header’s fixed height are separate layout contributions.
- **Repo observation:** [`BottomNav.tsx`](../../src/components/navigation/BottomNav.tsx) adds `insets.bottom` as `paddingBottom`, measures the resulting outer view with `onLayout`, and writes that height to [`BottomNavHeightContext.tsx`](../../src/components/navigation/BottomNavHeightContext.tsx). The context starts with a fallback height of `72`.
- **Repo observation:** [`HomeScreen.tsx`](../../src/features/home/HomeScreen.tsx) and [`ProfileScreen.tsx`](../../src/features/profile/ProfileScreen.tsx) add `bottomNavHeight + spacing.md` to `ScrollView` content padding. The navigator’s custom bar is not absolutely positioned in [`src/app/(tabs)/_layout.tsx`](../../src/app/(tabs)/_layout.tsx).
- **Repo observation:** The profile visual system contains several fixed values: a `128×128` photo frame, `28` name text, `24` section headings, `16` body text with `28` line height, `24` card padding, and `32`-unit top/gap spacing ([profile component styles](../../src/features/profile/styles/profileComponentStyles.ts), [profile styles](../../src/features/profile/styles/profileStyles.ts)).
- **Inference:** The screenshot’s “everything is big” appearance is plausibly cumulative. The header and bottom bar are only part of the occupied space; the profile card, avatar, typography, card padding, content gaps, safe-area padding, and possible bottom reservation also materially affect the result. The repository alone does not establish the final runtime bounds, so this should be confirmed with layout measurements on the device before changing numbers.

## 1. Density-independent units versus physical pixels

### Sourced facts

- React Native style dimensions are unitless and represent density-independent pixels. React Native warns that fixed dimensions do not have a universal mapping to physical measurement across devices ([Height and Width](https://reactnative.dev/docs/height-and-width)).
- `PixelRatio` exposes device density and font scale. `getPixelSizeForLayoutSize()` converts a layout size in dp to physical px; it is intended for choosing an appropriately resolved image, not for shrinking ordinary UI layout ([PixelRatio](https://reactnative.dev/docs/pixelratio)).
- Android recommends specifying layout in dp and text in sp rather than raw pixels. Android explains that high-density displays have more physical pixels but should not receive larger pixel-valued UI declarations ([Grids and units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units)).

### Inference for this repo

The physical screenshot resolution, Android density, or `PixelRatio.get()` should not be used to explain or correct ordinary React Native view sizes. A value such as `68` in a React Native style is already a logical layout value. The important measurements are the app window’s logical width/height, safe-area insets, font scale, and the actual bounds of the composed views.

### Recommendation

Do not add a global `scale = width / baselineWidth` transform and do not multiply or divide all styles by `PixelRatio`. Keep spacing and control geometry in logical units; use `PixelRatio` only for density-sensitive assets or pixel-grid details.

## 2. Window dimensions and responsive breakpoints

### Sourced facts

- React Native’s `useWindowDimensions()` updates when the window size or font scale changes and exposes `width`, `height`, `scale`, and `fontScale` ([useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)).
- React Native identifies `useWindowDimensions()` as the preferred API for React components because it updates with window changes. It also warns that dimensions can change with rotation and foldable/resizable windows ([Dimensions](https://reactnative.dev/docs/dimensions)).
- Android window size classes describe the space available to the app, not a device category. Compact width is `<600dp`, medium is `600–839dp`, and expanded is `840–1199dp`; the class can change during rotation, multitasking, folding, or window resizing ([Use window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes)).
- Android recommends adaptive layouts that respond to available display space, rather than merely stretching or shrinking the same UI. For navigation, Android’s responsive guidance maps compact width to a bottom navigation bar and medium/expanded widths to a rail or drawer, depending on item count ([Get started with adaptive apps](https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps), [Build responsive navigation](https://developer.android.com/develop/ui/views/layout/build-responsive-navigation)).

### Inference for this repo

The current `<400` branch is a useful local tuning point, but it is not a platform-standard breakpoint and should not be treated as a density breakpoint. It also currently bases chrome decisions on width alone. A later pass should use width for broad navigation/layout decisions and consider height for unusually short windows such as landscape.

### Recommendation

Create a small, named responsive policy rather than scattering width comparisons:

- **Compact phone:** bottom navigation, single-column content, constrained visual chrome.
- **Medium/expanded window:** consider a rail or wider content composition, rather than making the bottom bar and every card larger.
- **Any width:** let cards use available width with horizontal margins/max-width; let text determine its own height.

Use breakpoints to change composition and spacing tiers, not to scale the entire app uniformly.

## 3. Safe-area handling

### Sourced facts

- Expo SDK 57 documents `react-native-safe-area-context` as the mechanism for positioning content around notches, status bars, home indicators, and other system UI. Its `SafeAreaView` applies safe-area edges as padding, and any padding supplied by the app is added to that safe-area padding ([Expo SDK 57 safe-area-context reference](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/)).
- The same reference says `useSafeAreaInsets()` provides direct inset values for custom layout, while `SafeAreaProvider` must be present at the root; it also notes that the hook is a more advanced option and may perform worse than `SafeAreaView` during rotation ([Expo SDK 57 safe-area-context reference](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/)).
- Expo Router is the project’s SDK 57 navigation layer and exposes `Tabs` as its tab navigator ([Expo SDK 57 Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/)).

### Inference for this repo

The top edge appears to have a clear ownership model: a screen `SafeAreaView` owns the top inset and `TopBar` owns its visual height. The bottom edge is less certain: the custom nav adds bottom inset padding, while screens separately add measured nav height to scroll content and also sit inside `SafeAreaView` with default bottom edges. Depending on how the navigator lays out its custom bar, that can be correct, redundant, or produce excess blank space. It cannot be decided safely from source inspection alone.

### Recommendation

Make edge ownership explicit before tuning sizes:

- Header: choose either screen-level top safe-area ownership or header-level ownership.
- Bottom bar: choose whether the bar is in normal navigator flow or overlays content. If it is in flow, do not reserve its height again in screen content. If it overlays content, reserve the bar’s measured **outer** height once.
- If a screen uses `SafeAreaView` with the bottom edge and the bottom bar also owns the bottom inset, verify that the inset is not counted twice.
- Measure the bar with `onLayout` after its safe-area padding is applied. React Native states that `onLayout` runs on mount and layout changes, which makes it suitable for responding to rotation, font-scale changes, and inset changes ([View `onLayout`](https://reactnative.dev/docs/view.html)).

## 4. Typography and font scaling

### Sourced facts

- React Native `Text` has `allowFontScaling`, and its default is `true`; this allows text to respect accessibility text-size settings. `maxFontSizeMultiplier` can cap growth for a particular text node, but the documentation does not make disabling scaling the default recommendation ([Text](https://reactnative.dev/docs/text)).
- React Native’s `useWindowDimensions().fontScale` reports the active font scale and updates with the hook ([useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)).
- Android recommends sp for text so the user’s preferred text size is preserved, and says body text should not be smaller than 12sp in its mobile accessibility guidance ([Grids and units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units), [Accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)).
- Android 14 supports font scaling up to 200% and explicitly recommends testing at the maximum setting. It warns against using sp for padding or hard-coding view heights around assumed text metrics ([Android 14 non-linear font scaling](https://developer.android.com/about/versions/14/features)).

### Inference for this repo

The current `11` logical-unit tab label is below Android’s cited 12sp body-text floor, although it may be a navigation-label exception and should be evaluated for legibility rather than changed mechanically. The larger profile name and headings may be visually oversized at the default scale, but reducing them without testing larger font scales could create a separate accessibility failure.

### Recommendation

Keep font scaling enabled. Use named typography roles with flexible line height and wrapping. Avoid fixed-height text containers, `adjustsFontSizeToFit` as a blanket fix, and `maxFontSizeMultiplier` unless a specific control has a documented reason. Test the full profile and tab bar at Android 200% font size and with iOS larger text; make containers grow or reflow instead of clipping.

## 5. Bottom navigation, touch targets, and composition

### Sourced facts

- Android recommends at least `48dp × 48dp` for interactive touch targets, even when the visible icon is smaller ([Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views)).
- Apple’s HIG gives a general minimum hit region of `44×44pt` for buttons and emphasizes enough space around controls ([Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).
- Apple says a tab bar supports navigation between top-level sections, should include labels, and should not be used to provide actions. It also recommends keeping the default list to five or fewer tabs when adapting between compact and regular views ([Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)).
- Expo Router’s SDK 57 navigation model provides `Tabs`; the project’s custom tab-bar rendering is a repository implementation layered onto that navigator ([Expo SDK 57 Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/)).
- React Native exposes accessibility labels, roles, and selected state for custom controls; those properties communicate the control’s purpose and state to screen readers ([Accessibility](https://reactnative.dev/docs/accessibility), [Text accessibility props](https://reactnative.dev/docs/text)).

### Inference for this repo

The current compact nav’s `56` Create circle and `60` item minimum are compatible with the Android 48dp floor, but the visible label/icon arrangement, safe-area padding, and active pill all contribute to the bar’s total visual height. Shrinking the circle below 48 logical units would not be justified merely to recover space. The active profile pill should be checked for spacing and hit-target overlap rather than reduced blindly.

The reference’s centered Create control is a strong visual action pattern, but the current implementation exposes it inside the tab route list and gives every item tab semantics. That is a product/accessibility modeling concern independent of sizing.

### Recommendation

Use a bottom bar for the four or five top-level destinations, with each destination retaining a clear label and an accessible, at-least-48dp touch area. Model Create as a separate floating action or toolbar action if it launches creation immediately; do not give it selected-tab semantics. Keep the visible icon smaller than its pressable frame, and verify spacing between neighboring targets.

On larger windows, follow Android’s adaptive navigation guidance and consider a rail/drawer instead of making five bottom items wider and taller. On iOS, preserve a labeled tab bar for top-level destinations and keep the action visually distinct.

## Later implementation and verification plan

1. Instrument or inspect actual `onLayout` bounds for the root window, safe-area insets, `TopBar`, bottom bar, profile card, and scroll content. Record the first render and after rotation/font-scale changes.
2. Resolve safe-area ownership and whether the custom tab bar is flow-based or overlay-based. Remove only duplicate reservations.
3. Replace scattered fixed dimensions with named compact/regular metrics, preserving minimum touch targets and font scaling.
4. Make profile media/cards/text width- and content-driven; use max-widths for large windows rather than larger phone typography.
5. Decide whether Create is a tab destination or an action, then align route structure, accessibility role/state, and visual treatment.
6. Test at compact phone width, large phone width, landscape, resized/split windows, Android 200% font size, and iOS larger text. Validate that the last scrollable content is reachable above the bar and that no control overlaps the status bar/home indicator.

## Sources

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo SDK 57 `react-native-safe-area-context` reference](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/)
- [Expo SDK 57 Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [React Native Height and Width](https://reactnative.dev/docs/height-and-width)
- [React Native `useWindowDimensions`](https://reactnative.dev/docs/usewindowdimensions)
- [React Native Dimensions](https://reactnative.dev/docs/dimensions)
- [React Native PixelRatio](https://reactnative.dev/docs/pixelratio)
- [React Native View `onLayout`](https://reactnative.dev/docs/view.html)
- [React Native Text](https://reactnative.dev/docs/text)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [Android Developers: Grids and units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units)
- [Android Developers: Use window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes)
- [Android Developers: Build responsive navigation](https://developer.android.com/develop/ui/views/layout/build-responsive-navigation)
- [Android Developers: Accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
- [Android Developers: Android 14 non-linear font scaling](https://developer.android.com/about/versions/14/features)
- [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple HIG: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
