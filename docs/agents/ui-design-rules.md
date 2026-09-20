# Mobile UI design rules

Read this file for any change or review of a native screen, route shell, component, form, sheet, navigation surface, layout metric, animation, color token, or accessibility prop. It is the repository authority for platform UI behavior and accessibility. `DESIGN.md` remains the authority for KUQuest visual identity, tokens, typography roles, and component appearance; `CODE_STYLES.md` remains the authority for code composition and NativeWind mechanics.

WCAG 2.2 is written for web content. This repository uses the cited success criteria as a native-mobile engineering baseline, not as a claim of WCAG conformance. Every React Native mapping below is an `[INFERENCE]` unless the cited platform source states the mapping.

## Runbook

Complete these steps before delivery. A step is complete only when its criterion is true.

1. **Route the surface.** Read `CONTEXT.md`, the owning feature specification or ADR, `DESIGN.md`, and this file. Identify the actor, canonical Quest state, participation, selection mode, `proofRequired`, and `dueAt` branch when the surface is domain-specific. Completion: the screen's owner, domain branch, visual authority, and platform rules are written down or obvious from the change.
2. **Model the states.** Account for loading, empty, error, unavailable, pending, success, disabled, keyboard-visible, large-text, light/dark, and reduced-motion states that the surface can enter. Completion: every state either has a visible/announced treatment or is explicitly impossible for the component.
3. **Set the semantic contract.** Give every interactive element a stable visible label or `accessibilityLabel`, the correct `accessibilityRole`, and current `accessibilityState`. Keep the programmatic name aligned with visible text. Completion: a screen-reader or voice-control user can identify, operate, and understand every control without color, position, or gesture memory.
4. **Compose responsively.** Use safe-area ownership, content-driven height, wrapping, and available-window dimensions. Completion: the changed surface remains operable in compact and larger windows, landscape, keyboard-visible layouts, and the repository's large-text checks without clipping or two-axis reading scroll.
5. **Prove the native surface.** Run the focused repository check and the connected development-build flow required by `docs/agents/mobile-validation.md`. Completion: the actual Android/iOS surface has been exercised for the changed states, and the exact device/build and limitations are recorded.

## Platform contract

### Targets and spacing

- **Use a 48 × 48 logical-unit interactive frame for new or changed controls.** Android's minimum is 48 × 48 dp; Apple's HIG baseline is 44 × 44 pt. A React Native layout unit is the native logical unit on the target platform. Keep the visual icon smaller inside the frame rather than shrinking the frame. Sources: [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [DESIGN.md](../../DESIGN.md).
- **Treat 44 dp in `check-android-navigation-targets` as a regression floor, not the design target.** A changed navigation target should be brought to 48 logical units even when the existing checker accepts 44. `hitSlop` may supplement a small visual icon, but it must not create overlap with a neighboring target and must be verified in the native accessibility tree. Sources: [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), `scripts/check-android-navigation-targets.js`.
- **Do not use WCAG's 24 × 24 CSS-pixel AA minimum as the product target.** SC 2.5.8 permits undersized targets only under its Spacing, Equivalent, Inline, User Agent Control, or Essential exceptions. Those web exceptions do not waive the stricter native 48-unit policy. Source: [WCAG SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

### Names, roles, states, and focus

- **Give every control a programmatic name, role, and state.** Use `accessibilityLabel`, `accessibilityRole`, and `accessibilityState`; update them declaratively with the visible state. A visible label must appear in the accessible name so voice-control users can speak what they see. Sources: [WCAG SC 4.1.2](https://www.w3.org/TR/WCAG22/), [WCAG SC 2.5.3](https://www.w3.org/TR/WCAG22/), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility).
- **Expose structure, not implementation.** Mark headings with `accessibilityRole="header"` where a screen-reader user needs section navigation; group a compound row only when its children form one meaningful unit; keep independent actions independently focusable. Put JSX and accessibility order in task order. Sources: [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [WCAG SC 2.4.3](https://www.w3.org/TR/WCAG22/).
- **Hide decoration, not information.** Decorative images and purely visual separators must not add noise to VoiceOver/TalkBack. Meaningful images need a concise label or adjacent text. Never communicate role, state, validation, or workspace only by color. Sources: [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [WCAG SC 1.4.1](https://www.w3.org/TR/WCAG22/), `docs/agents/nativewind.md`.
- **Keep focus visible and unobscured.** Fixed navigation, banners, sheets, toasts, and headers must not fully cover the focused control. Sources: [WCAG SC 2.4.7](https://www.w3.org/TR/WCAG22/), [WCAG SC 2.4.11](https://www.w3.org/TR/WCAG22/), [Android layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics).
- **Provide a non-drag path.** Any author-created drag, reorder, slider, or gesture action must also work through a single-pointer tap/button/menu path unless the drag is essential or supplied by the user agent. Do not make a swipe the only way to delete, reorder, reveal, or complete a task. Source: [WCAG SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility).

### Text, contrast, and motion

- **Preserve user text scaling.** Keep React Native `Text` font scaling enabled; do not set `allowFontScaling={false}` to make a screenshot fit. Layout must survive at least a 200% text-size equivalent without clipped controls, lost labels, or overlapping content. Android's guidance keeps body text at or above 12 sp. Sources: [WCAG SC 1.4.4](https://www.w3.org/TR/WCAG22/), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [React Native Text](https://reactnative.dev/docs/text).
- **Let text reflow.** Use content-driven heights, wrapping, and flexible widths. The WCAG web baseline is no loss of content/functionality or two-dimensional scrolling at 320 CSS px vertical-scroll width or 256 CSS px horizontal-scroll height, except genuinely two-dimensional content. If text spacing is overridden, preserve content and functionality at line height 1.5× font size, paragraph spacing 2× font size, letter spacing 0.12× font size, and word spacing 0.16× font size where the language uses those properties. Do not map CSS pixels directly to native units; the native mapping is an `[INFERENCE]`. Source: [WCAG SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [SC 1.4.12](https://www.w3.org/TR/WCAG22/).
- **Meet contrast thresholds.** Use at least 4.5:1 for ordinary text and 3:1 for large text (at least 18pt regular or 14pt bold in the WCAG baseline), and 3:1 between meaningful controls/state indicators or meaningful graphics and adjacent colors. Verify both light and dark appearances, including disabled/selected/focused states that remain meaningful. Sources: [WCAG SC 1.4.3 and 1.4.11](https://www.w3.org/TR/WCAG22/), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility).
- **Use the semantic palette.** Choose `ku-*` tokens and `ku-on-primary` for foregrounds on role-accent surfaces. The current `#89928C` muted token and self-colored success hue are documented contrast gaps; do not use them for body, placeholder, control, focus, or stand-alone status text. Use a compliant text token and let hue support, never replace, the textual/icon state. Source: [DESIGN.md](../../DESIGN.md), [NativeWind rules](nativewind.md), [WCAG SC 1.4.3](https://www.w3.org/TR/WCAG22/).
- **Respect motion and transparency preferences.** Make state changes understandable without animation, avoid motion that is required to complete a task, and use `AccessibilityInfo`/the platform preference APIs when animation or transparency needs a reduced alternative. The React Native bridge is `[INFERENCE]`. Source: [Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## Layout and adaptation

- **Own each safe-area edge once.** Put `SafeAreaProvider` at the app root; add a provider at a separate native modal/navigation root only when the library requires it. Choose whether the screen/container or a chrome component owns each inset; do not count the same top or bottom inset twice. When a bar overlays content, reserve its measured outer height once; when it is in flow, do not reserve it again. Sources: [Android layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics), [Apple HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Expo safe-area-context](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/).
- **Keep focused inputs visible above the keyboard.** Scroll or shift the focused field into view; never let the keyboard hide the field, its label, or its correction message. Source: [Android layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics).
- **Adapt to the window, not the device name.** Use `useWindowDimensions()` and treat Android width classes as Compact `<600dp`, Medium `600–839dp`, and Expanded `840–1199dp`. Width drives the composition first; height and orientation refine it. The width-class mapping in React Native is an `[INFERENCE]`. Sources: [Android adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout), [Android window size classes](https://developer.android.com/develop/ui/views/layout/use-window-size-classes), [React Native dimensions](https://reactnative.dev/docs/usewindowdimensions).
- **Change composition instead of stretching.** Compact windows use a focused one-pane layout; medium windows may use one or two panes; larger windows may reveal supporting panes or list-detail composition. Constrain content with max widths and let cards, labels, and inputs grow or wrap. Do not lock the app to portrait-only or stretch every control to fill a tablet. Sources: [Android adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout), [WCAG SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Keep two-dimensional scroll local to meaningfully two-dimensional content.** Text, forms, headings, and ordinary cards should be readable with one-axis scrolling. A map, diagram, game, video, or genuinely two-dimensional data surface may retain its own two-axis region, but surrounding content must still reflow. Source: [WCAG SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Use the Apple principles as a visual test.** Apply **Clarity** (legible and unambiguous), **Deference** (content remains primary), and **Depth** (layers and motion explain hierarchy). These principles do not override the target, contrast, text-scaling, or semantic rules above. Source: [Apple HIG design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles).

## Navigation, actions, forms, and sheets

- **Keep primary navigation visible and small.** A bottom navigation bar holds 3–5 same-level destinations; on larger Android windows it translates to a navigation rail. A drawer can hold more than five destinations but has higher reach cost and weaker discoverability, so reserve it for secondary or infrequent destinations. Sources: [Android navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns), [NN/g mobile navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/).
- **Give one action primary emphasis.** A screen has at most one highest-importance floating action; place secondary or infrequent actions in the top bar, nearby content, or an overflow/menu. If a control creates something immediately, model and announce it as an action rather than a selected navigation destination unless the product contract explicitly makes it a destination. Sources: [Android navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns), [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [DESIGN.md](../../DESIGN.md).
- **Make back predictable.** Preserve platform back behavior; intercept it only for a necessary unsaved-change confirmation or equivalent safety boundary. Do not block predictive back by default `[INFERENCE]`; validate the actual development build. Source: [Android navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns).
- **Prefer recognition to recall.** Show choices, valid values, current selections, defaults, recent entries, and contextual help. Use the existing `Input`, `SearchInput`, and sheet/select patterns for enumerations instead of forcing users to remember and type values. Source: [NN/g recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/).
- **Make data entry forgiving.** Use the appropriate keyboard/content type, platform autofill where safe, visible labels/instructions, useful defaults, inline recovery text, and validation at the point it helps the user correct the value. Identify invalid fields and explain them in text; provide a safe correction suggestion when one is known. Preserve entered values after a failed submission and avoid asking for the same value twice in one flow unless security or validity requires it. Sources: [Apple HIG entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [WCAG SC 3.3.1, 3.3.2, 3.3.3, and 3.3.7](https://www.w3.org/TR/WCAG22/).
- **Use sheets for contextual, bounded tasks.** A sheet should preserve the underlying context, have a visible title and an explicit close/cancel path, and keep its controls inside safe areas and target bounds. Use a full-screen route for an immersive or multi-step flow. The assigned Apple sheet page does not establish a universal React Native detent or nesting number; do not invent one—follow the existing `BottomSheet` contract and native smoke-test the result. Source: [Apple HIG sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), `src/components/ui/BottomSheet.tsx`.
- **Keep authentication accessible.** Do not require a memory puzzle or CAPTCHA-like cognitive test as the only authentication path; prefer platform credentials, autofill, or an equivalent assisted path. Source: [WCAG SC 3.3.8](https://www.w3.org/TR/WCAG22/).

## Usability screen test

Apply these ten NN/g heuristics as positive checks during review. They are broad rules of thumb, not a replacement for the platform or domain contract.

1. **Visibility of System Status:** show timely loading, progress, confirmation, and current-state feedback.
2. **Match Between System and the Real World:** use KUQuest/user language and a natural task order, not backend enum names.
3. **User Control and Freedom:** provide a clear Back, Cancel, Undo, or other short exit from every interruptible flow.
4. **Consistency and Standards:** reuse the same labels, icons, roles, and interaction patterns for the same concept; follow platform conventions.
5. **Error Prevention:** constrain invalid input and confirm destructive or irreversible actions before commit.
6. **Recognition Rather than Recall:** keep needed choices, labels, values, and help visible or one step away.
7. **Flexibility and Efficiency of Use:** add optional shortcuts or saved defaults without removing the novice path.
8. **Aesthetic and Minimalist Design:** remove irrelevant badges, copy, and chrome that compete with the task.
9. **Help Users Recognize, Diagnose, and Recover from Errors:** identify the field, explain the problem in plain language, and give the next safe action.
10. **Help and Documentation:** keep task help searchable, contextual, concise, and step-based; the screen should remain usable without it.

Source: [NN/g 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Repository implementation map

| Need                     | Use here                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Styled native primitives | Import styled primitives from `@/tw`; keep `style` for measured, animated, safe-area, runtime, or third-party-only values.                                         |
| Visual tokens            | Use semantic `ku-*` classes from `src/global.css`, the mirrored imperative values in `src/theme/colors.ts`, and the roles documented in `DESIGN.md`.               |
| User-visible copy        | Use `src/locales/`; keep labels, errors, instructions, and status messages translatable.                                                                           |
| Screen composition       | Keep route files thin; compose in the owning feature and use `src/components/layout/ScreenLayout.tsx` for the established safe-area boundary.                      |
| Responsive metrics       | Use `useWindowDimensions()` and the named helpers in `src/theme/layout.ts`; do not add a global `PixelRatio` scale.                                                |
| Accessible controls      | Prefer existing `Button`, `Input`, `SearchInput`, `BottomSheet`, and navigation primitives; preserve `testID`, accessibility props, and semantic labels.           |
| Native proof             | Use `bun run check-android-navigation-targets` for visible navigation states; it currently checks a 44dp floor, while this document's target is 48 logical units.  |
| Style proof              | Jest cannot prove resolved NativeWind layout or color; use the NativeWind audit and a development-build smoke check in light/dark and relevant window/text states. |

## Delivery checklist

- [ ] The surface was routed to its owner and domain branch.
- [ ] Every interactive control has a visible/programmatic name, role, state, and 48-unit frame.
- [ ] Meaning and state do not rely on color, motion, position, or a gesture alone.
- [ ] Text scales, wraps, and remains readable; errors identify the field and recovery path.
- [ ] Safe areas and keyboard are handled once; focused content is not obscured.
- [ ] Compact, larger-window, landscape, light/dark, large-text, and reduced-motion states were considered and tested when applicable.
- [ ] Navigation stays visible/discoverable and uses the appropriate bar/rail/drawer composition.
- [ ] The focused repository check and native development-build evidence are recorded.

## Sources

### Apple

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data)
- [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

### Android

- [Layout basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics)
- [Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns)
- [Adapt layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout)
- [Accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
- [Window size classes](https://developer.android.com/develop/ui/views/layout/use-window-size-classes)

### Usability and accessibility

- [NN/g 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [NN/g recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/)
- [NN/g mobile navigation patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)
- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [WCAG 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
