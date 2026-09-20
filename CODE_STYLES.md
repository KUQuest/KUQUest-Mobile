# KUQuest Mobile code standards

This file is the review standard. Repository-specific facts belong in the referenced docs, not in a second copy here.

## 1. Ownership and composition

- Keep domain UI in its owning `src/features/<feature>/` directory.
- Promote a component to `src/components/` only when it is domain-agnostic and has a second real consumer.
- Keep screens as composition roots. If a screen grows beyond roughly 400 lines or contains independently testable regions, split feature-local components and assemble them in the screen.
- Keep route files in `src/app/` thin; route modules export a default screen or layout. Providers and other support modules live outside `src/app/`.
- Use existing domain terminology from `CONTEXT.md`; do not introduce synonyms for canonical states or actors.

## 2. NativeWind

Read `docs/agents/nativewind.md` for the installed NativeWind v5 behavior and token rules.

- Import class-styled primitives from `@/tw`; direct `react-native` imports are for APIs and components that do not receive `className`.
- Use semantic `ku-*` tokens from `src/global.css`, not raw palette utilities or screen-local color constants.
- Keep imperative colors in `src/theme/colors.ts` synchronized with CSS tokens.
- Register every custom text, spacing, and radius token in `src/tw/cn.ts`.
- Use `cn()` for conditional or variant composition. Keep longer static sets in co-located `*Styles.ts` objects as plain class strings.
- Keep `style` for measured, animated, runtime, safe-area, elevation, or third-party style-only values. A property belongs to one styling system, not both.
- Filled role-accent surfaces use `ku-on-primary`; literal white requires a documented surface reason.

## 3. Large screen composition

- Extract feature-local components when a screen exceeds roughly 400 lines or contains multiple independently testable visual regions.
- Prefer composition over broad prop-forwarding wrappers.
- Do not add a shared primitive for hypothetical reuse. Repeated structure earns a primitive only when its visual and behavioral contract is stable across real consumers.

## 4. Tests and verification

- Assert consumer-visible behavior, transitions, boundaries, accessibility, and errors; do not assert implementation wiring or resolved CSS values.
- Jest mocks CSS, so tests cannot observe compiled NativeWind styles. Use the NativeWind audit and native smoke checks for styling behavior.
- Use repository scripts: `bun run typecheck`, `bun run lint`, `bun run format:check`, `bun run test`, and `bun run verify`.
- Native-facing changes require light/dark validation on a development build. Android and iOS are product targets; document the platform that was actually exercised.

## 5. Animated interactive surfaces

- Do not scale an animated parent that contains interactive controls. Animate spacing or dimensions, or isolate the visual layer, so compact states preserve at least 44dp accessibility bounds.
- Scroll-driven chrome transitions require native smoke evidence for expanded and compact states; verify every interactive descendant remains enabled and hittable.
