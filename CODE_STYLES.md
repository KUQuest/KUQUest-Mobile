# KUQuest Mobile code standards

This file is the review standard. Repository-specific facts belong in the referenced docs, not in a second copy here.

## 1. Ownership and composition

- Keep domain UI in its owning `src/features/<feature>/` directory.
- Promote a component to `src/components/` only when it is domain-agnostic and has a second real consumer.
- Keep screens as composition roots. Extract feature-local components when a meaningful responsibility or independently understandable UI section benefits from its own boundary.
- Keep route files in `src/app/` thin; route modules export a default screen or layout. Providers and other support modules live outside `src/app/`.
- Use existing domain terminology from `CONTEXT.md`; do not introduce synonyms for canonical states or actors.
- Keep each cross-workspace action behind one explicit seam. A workspace switch exposed in Settings must not be duplicated in primary navigation, a Home header, or an implicit gesture without an ADR update and behavioral coverage.
- For review, refactor, decomposition, or restructuring work, follow [`docs/agents/codebase-review.md`](docs/agents/codebase-review.md): inspect the owning module and its consumers, publish responsibilities and structural issues, propose file ownership before editing, then re-check dependencies and behavior.
- Keep small, single-use component prop types beside the component; put reusable feature and domain contracts in the owning type module (e.g. `myQuestTypes.ts`, `liveQuestTypes.ts`, or `src/features/questBoard/domain/types.ts`). A `*Types.ts` file imports only other `*Types.ts` files, `src/features/questBoard/domain/types.ts`, and locale primitives — never an implementation file (`*Service.ts`, `*Projection.ts`, `*Screen.tsx`, `*Queries.ts`).
- Use `as const` enum objects (`src/features/questBoard/domain/types.ts` is the canonical example) and reference values by name (`QuestNextAction.WAIT_FOR_START`). Raw string literals where a typed enum value belongs silently survive renames and fall through label maps without a compile error.

## 2. NativeWind

Read `docs/agents/nativewind.md` for the installed NativeWind v5 behavior and token rules.

- Read `docs/agents/ui-design-rules.md` for the platform target, accessibility,
  responsive layout, navigation, forms, sheets, and native verification contract.

- Import class-styled primitives from `@/tw`; direct `react-native` imports are for APIs and components that do not receive `className`.
- Use semantic `ku-*` tokens from `src/global.css`, not raw palette utilities or screen-local color constants.
- Keep imperative colors in `src/theme/colors.ts` synchronized with CSS tokens.
- Register every custom text, spacing, and radius token in `src/tw/cn.ts`.
- Use `cn()` for conditional or variant composition. Keep longer static sets in co-located `*Styles.ts` objects as plain class strings.
- Keep `style` for measured, animated, runtime, safe-area, elevation, or third-party style-only values. A property belongs to one styling system, not both.
- Filled role-accent surfaces use `ku-on-primary`; literal white requires a documented surface reason.

Quest Board example:

```tsx
import { View } from "@/tw";
import styles from "./questBoardStyles";

// Good: use the owning style object and semantic tokens.
<View className={styles.card} />

// Bad: bypass design tokens with palette and generic radius utilities.
<View className="bg-white border-gray-200 rounded-lg" />
```

Create Quest Team Setup example:

```tsx
import { View } from "@/tw";
import styles from "../createQuestStyles";

// Good: reuse the owning style object and semantic tokens.
<View className={styles.sectionCard} />

// Bad: hard-code palette and generic radius utilities.
<View className="bg-white border-gray-200 rounded-lg" />
```

## 3. Component composition

- Keep `.tsx` files focused on UI composition, hook calls, small UI state, small event handlers, and clear rendering branches. Decompose around responsibility and readability, never a line-count threshold.
- Keep meaningful loading, empty, and error layouts separate from the main content. Compose feature skeletons from the shared skeleton primitives; keep tiny placeholders inline.
- Prefer composition over broad prop-forwarding wrappers.
- Colocate a component's companion files when it has several; do not create a folder for every small component.
- Do not add a shared primitive for hypothetical reuse. Repeated structure earns a primitive only when its visual and behavioral contract is stable across real consumers.

## 4. Tests and verification

- Assert consumer-visible behavior, transitions, boundaries, accessibility, and errors; do not assert implementation wiring or resolved CSS values.
- Jest mocks CSS, so tests cannot observe compiled NativeWind styles. Use the NativeWind audit and native smoke checks for styling behavior.
- Use repository scripts: `bun run typecheck`, `bun run lint`, `bun run format:check`, `bun run test`, and `bun run verify`.
- Native-facing changes require light/dark validation on a development build. Android and iOS are product targets; document the platform that was actually exercised.

## 5. Platform UI and accessibility

- Use 48 logical units as the minimum interactive frame for new or changed controls; the Android navigation checker’s 44dp threshold is a regression floor.
- Give every interactive control a visible/programmatic name, role, and current state. Keep state and meaning independent of color or motion.
- Preserve text scaling and content-driven height. Verify focused inputs, errors, safe areas, keyboard-visible layouts, and larger windows on native builds.
- Meet the contrast and adaptive-layout checks in `docs/agents/ui-design-rules.md`; do not treat a web run or Jest CSS mock as native proof.

## 6. Animated interactive surfaces

- Do not scale an animated parent that contains interactive controls. Animate spacing or dimensions, or isolate the visual layer, so compact states preserve at least 48 logical-unit accessibility bounds.
- Scroll-driven chrome transitions require native smoke evidence for expanded and compact states; verify every interactive descendant remains enabled and hittable.
