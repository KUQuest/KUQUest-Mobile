# NativeWind styling

`className` is the default styling system in this repo. This file is the reference for writing it correctly _here_.

Neighbouring authorities, not repeated below: `DESIGN.md` owns what the palette, type scale and components mean; `docs/agents/ui-design-rules.md` owns platform targets, accessibility semantics, contrast, responsive layout, and native proof; `src/global.css` owns the token values; `docs/agents/gotchas.md` owns non-styling repo traps.

Installed stack: NativeWind 5 preview on top of `react-native-css`, Tailwind CSS v4, CSS-first theme. Read `package.json` for exact versions.

## Drift: nativewind.dev documents v4, this repo runs v5

<https://www.nativewind.dev> and its `llms-full.txt` open with "Nativewind 4.2.7 is the stable release and uses Tailwind CSS v3". Every API page there is v4. Treat a v4 page as a hypothesis and confirm it against `node_modules/nativewind` or `node_modules/react-native-css` before acting on it.

| v4 docs say                                         | v5 reality here                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cssInterop(C, mapping)`                            | Not exported. Use `styled(C, mapping)` from `nativewind`, or `useCssElement(C, props, mapping)` as `src/tw/index.tsx` does.                |
| `remapProps(C, mapping)`                            | Not exported. Same replacement.                                                                                                            |
| `nativeStyleToProp` inside a mapping                | Deprecated. Use `nativeStyleMapping`.                                                                                                      |
| `vars({...})` passed as a `style` prop              | Deprecated. Use `<VariableContextProvider value={{ "--token": value }}>`; it merges over inherited variables, so nesting composes.         |
| `useColorScheme()` from `nativewind`                | Deprecated in favour of `useColorScheme()` from `react-native`, which is what this repo uses.                                              |
| `withNativeWind(config, { input: "./global.css" })` | `withNativewind(config, options?)`. There is no `input` option; `src/app/_layout.tsx` imports the CSS directly.                            |
| `tailwind.config.js`, `darkMode: "class"`           | No JS config exists. Tokens are an `@theme` block in `src/global.css`; dark mode is a `@media (prefers-color-scheme: dark)` `:root` block. |

The per-utility support tables under `nativewind.dev/docs/tailwind/**` remain the best answer to _which Tailwind utilities do nothing on native_ (`grid`, `float`, most filters, blend modes). Those are style-engine facts, not version facts.

## Trap: `className` on a `react-native` import silently does nothing

`metro.config.js` sets `globalClassNamePolyfill: false`, overriding NativeWind's own default of `true`. That flag gates exactly one thing — a Metro `resolveRequest` hook that would redirect `react-native` imports to pre-wrapped components. It does not gate types: `react-native-css/types.d.ts` merges `className` onto `ViewProps`, `TextProps` and friends unconditionally.

So `<View className="p-4" />` on a `View` imported from `"react-native"` typechecks, lints, renders, and applies no styles. There is no error at any stage.

Import every styled primitive from `@/tw`, which wraps each component through `useCssElement`. `@/tw` also exports `Link`, `Image`, `AnimatedScrollView` and `useCSSVariable`; `@/tw/animated` covers Reanimated. Importing `Platform`, `Modal`, `Alert`, `RefreshControl` or hooks straight from `react-native` is correct — they carry no `className`.

The previously observed instances were migrated; use this trap description when reviewing new or untouched code.

## Trap: `cn()` drops font sizes

`src/tw/cn.ts` is `twMerge(clsx(inputs))` with an unconfigured `tailwind-merge`. Tailwind v4 compiles both `--text-ku-*` (font size) and `--color-ku-text-*` (colour) into the `text-` namespace, and default `tailwind-merge` classifies the whole namespace as one conflict group. Measured:

```
twMerge("font-ku-bold text-ku-title text-ku-text-strong")  -> "font-ku-bold text-ku-text-strong"
twMerge("text-ku-body text-ku-text-secondary")             -> "text-ku-text-secondary"
```

The size is deleted. The same applies to any two `ku-` utilities Tailwind's default groups collapse.

`src/tw/cn.ts` registers the `ku-` size, spacing and radius scales with `extendTailwindMerge`, which splits the namespace again; `src/tw/__tests__/cn.test.ts` pins that. Colours need no list — a `text-` suffix that is not a known size falls back to the colour group. **Adding a `--text-ku-*`, `--spacing-ku-*` or `--radius-ku-*` token to `src/global.css` means adding it to `cn.ts` too**, or `cn` starts deleting it again.

## Trap: tests cannot observe styles

`package.json` maps `\.css$` to `jest.style-mock.js`, whose entire content is `module.exports = {}`. The compiled stylesheet is never registered under Jest, so `className` resolves to nothing there.

Assert on behaviour, `testID`, accessibility props and rendered text. A test that asserts a resolved colour or spacing is asserting the mock.

## Tokens

`src/global.css` is the single source of truth. A custom property becomes a utility by dropping the property kind: `--color-ku-primary` gives `bg-ku-primary` / `text-ku-primary` / `border-ku-primary`; `--text-ku-body` gives `text-ku-body`; `--spacing-ku-md` gives `p-ku-md` / `gap-ku-md`; `--radius-ku-pill` gives `rounded-ku-pill`. An opacity modifier works too and stays role-aware: `bg-ku-on-primary/[0.34]` compiles to a runtime `color-mix` over the variable.

`--color-ku-on-primary` is the foreground **on a filled accent surface** — a label or icon inside a `bg-ku-primary` button, chip or hero. `--color-ku-white` is literal white. They hold the same value in the Hirer ramp, so the distinction only bites once the Worker ramp is active, where the accent is lime and its foreground is near-black. Choosing `text-ku-white` for a button label is therefore a latent contrast bug, not a style preference.

Screens consume `ku-` semantic names. A raw hex or `rgba()` in JSX is a token gap — add the token in `src/global.css` (light **and** dark) plus its `DESIGN.md` entry, then use it.

`src/theme/colors.ts` mirrors the same palette for imperative surfaces that
take a colour value rather than a class: `lucide-react-native` icon `color`,
`StatusBar`, `SystemUI`, `placeholderTextColor`, third-party `style`-only
props. `src/features/workspace/AppThemeProvider.tsx` owns appearance and
workspace resolution, publishes the full palette through `useAppTheme()`, and
binds matching NativeWind variables. React Modules should call
`useAppTheme()`; keep the exported `colors` Proxy only for non-React adapters.
The provider keeps its active ramp synchronized before render.

## Dark mode

Appearance follows the OS only — there is no Light/Dark/System user setting,
and adding one is a product change, not a styling change. NativeWind variables
and imperative colours both come from `useAppTheme()`.

State both sides of an appearance-dependent style. React Native applies
conditional styles unreliably, so write `bg-ku-surface dark:bg-ku-card`, never
a bare `dark:` utility.

## Hirer / Worker accent

Role lives in `src/features/workspace/roleWorkspaceStore.ts`
(`useRoleWorkspace()`, persisted under `kuquest_active_workspace`).
`src/features/workspace/AppThemeProvider.tsx` wraps the app in
`<VariableContextProvider>`, resolves `hirerRamp` or `workerRamp` from
`src/theme/colors.ts`, and publishes appearance-aware accent variables.
The same provider calls `setActiveRamp`, so the compatibility `colors` Proxy
uses the same role ramp for non-React adapters.

React components should call `useAppTheme()` and read `colors`; non-React
adapters may use the compatibility `colors` Proxy. Never branch on role inside
a `className`, and never duplicate a component per role.

`metro.config.js` lists accent variables under `inlineVariables.exclude`. The
compiler folds any custom property referenced exactly once into its consumer
(`react-native-css/dist/commonjs/compiler/inline-variables.js:9`), which would
make it unreachable from the provider.

Role must never be communicated by colour alone — keep the existing textual and icon indicators.

## When `style` stays

Keep the `style` prop for values that are not static: Reanimated and `useAnimatedStyle`, measured layout from `onLayout`/`measureInWindow`, safe-area insets, `getAppChromeMetrics()` / `getProfileLayoutMetrics()` output, runtime coordinates, interpolation, and third-party components that expose only `style`. `src/components/ui/{Avatar,BottomSheet,LoadingSkeleton,Select,TopBar}.tsx` are the reference cases.

Never drive one property from both systems. If a class sets `padding`, the `style` object must not.

## Composition

Static classes belong inline in JSX. Longer or shared sets live in a co-located `*Styles.ts` exporting a plain object of class strings (`src/features/profileEdit/profileEditStyles.ts`, `src/components/ui/selectStyles.ts`) — these are class strings, not `StyleSheet.create`. Variants are a typed record keyed by the variant name (`src/components/ui/Chip.tsx`), not nested ternaries inside `className`.

Prettier sorts classes via `prettier-plugin-tailwindcss`, configured against `src/global.css` with `cn`/`clsx` registered as class functions. Write classes in any order and let `bun run format` settle them.

## Before finishing a styling change

Run `bun run verify`; it includes the NativeWind ownership/token audit, the
Expo Router health audit, typecheck, lint, format, and Jest. Then confirm on a
device or emulator in light and dark — the class path and imperative path can
disagree, and only a running app shows it.
