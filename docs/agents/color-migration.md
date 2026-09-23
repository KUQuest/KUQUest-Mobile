# Color Migration Plan

Migrate the app from the original two-ramp palette (hirer and worker both mapped to sage
green) to the three-family role palette defined in `DESIGN.md`: Hirer stays sage, Worker
moves to terracotta (`#96533F`), and Additional purple (`#7C4BA8`) is introduced as a
new token family.

**Baseline:** record passing test count before Phase 1; compare at Phase 4.

**Done when:** typecheck clean, test count ≥ baseline, no `#96533F / #713D30 / #4F2A22 /
#F8ECE8 / #7C4BA8 / #623784 / #412357 / #F1EBF8` hardcoded outside the two token files,
`colors.worker` resolves to `#96533F` in a light scheme, `AppThemeProvider.test.tsx`
passes with the updated `workerRamp`.

---

## Convention

Two canonical token files own every color value. Everything else references a token —
never a raw hex.

| File                  | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `src/theme/colors.ts` | Imperative consumers (`colors.foo`) and ramp-based workspace theming |
| `src/global.css`      | NativeWind consumers (`className="bg-ku-worker"`)                    |

A change to a value belongs in both files, kept in sync. Any other file that contains
a raw hex is a gap to fix in Phase 3.

---

## What changes

### `workerRamp` — currently identical to `hirerRamp` (both sage)

`workerRamp` must move to terracotta so the Worker workspace palette resolves correctly
when `setActiveRamp("worker")` is called. The ramp keys stay the same; only the values
change.

### New tokens — `hirer-*`, `worker-*`, `additional-*` families

`lightColors` and `darkColors` currently have no `hirer`, `worker`, or `additional`
keys. These must be added as static tokens (not ramp-driven) so NativeWind classes like
`bg-ku-hirer`, `text-ku-worker`, `bg-ku-additional-subtle` can be used to colour
role-specific UI elements regardless of the active workspace.

### New `additionalRamp` — for a future Additional workspace (optional stub)

Not required for the colour token migration, but add the stub to keep `ramps` complete.
If the Additional workspace is not yet in scope, add only the CSS/TS tokens and skip
the ramp.

---

## Phase 1 — Update `workerRamp` in `colors.ts`

Replace the `workerRamp` values with the terracotta family from `DESIGN.md`:

```typescript
export const workerRamp = {
  light: {
    primary: "#96533F",
    primaryDark: "#713D30",
    primarySubtle: "#F8ECE8",
    accentBorder: "#C9A79A",
    onPrimary: "#FFFFFF",
  },
  dark: {
    primary: "#E1A08C",
    primaryDark: "#C77B65",
    primarySubtle: "#3B2924",
    accentBorder: "#805044",
    onPrimary: "#241A17",
  },
} as const;
```

`withRamp` maps `primary → colors.primary`, `primaryDark → colors.primaryDark`,
`primarySubtle → colors.surfaceAccent`, `accentBorder → colors.borderAccent`,
`onPrimary → colors.onPrimary`. No other code changes needed in this phase.

Update `src/theme/__tests__/colors.test.ts` — the two assertions that expect
`workerRamp.light.primary === "#5F7655"` and `workerRamp.dark.primary === "#A9C79E"`
must flip to `"#96533F"` and `"#E1A08C"` respectively.

Also update `src/features/workspace/__tests__/AppThemeProvider.test.tsx` — the assertion
that checks `dark:${workerRamp.dark.primary}` in a NativeWind class string.

**Phase 1 done when:** `bun run typecheck` passes and `bun run test
src/theme/__tests__/colors.test.ts src/features/workspace/__tests__/AppThemeProvider.test.tsx`
passes.

---

## Phase 2 — Add role and additional tokens to both token files

### `src/theme/colors.ts` — add to `lightColors` and `darkColors`

Add after the existing `support*` keys in each object. Use the same camelCase convention
as the surrounding keys.

**`lightColors` additions:**

```typescript
// Role colors
hirer:           "#5F7655",
hirerDark:       "#465B3E",
hirerDeep:       "#34462F",
hirerSubtle:     "#EDF2EA",
hirerBorder:     "#B6C4AF",
onHirer:         "#FFFFFF",

worker:          "#96533F",
workerDark:      "#713D30",
workerDeep:      "#4F2A22",
workerSubtle:    "#F8ECE8",
workerBorder:    "#C9A79A",
onWorker:        "#FFFFFF",

additional:      "#7C4BA8",
additionalDark:  "#623784",
additionalDeep:  "#412357",
additionalSubtle:"#F1EBF8",
additionalBorder:"#C2AED7",
onAdditional:    "#FFFFFF",
```

**`darkColors` additions** (same keys, dark values from `DESIGN.md`):

```typescript
hirer:           "#A9C79E",
hirerDark:       "#7FA273",
hirerDeep:       "#5F7655",
hirerSubtle:     "#243128",
hirerBorder:     "#526B58",
onHirer:         "#142019",

worker:          "#E1A08C",
workerDark:      "#C77B65",
workerDeep:      "#A75D4B",
workerSubtle:    "#3B2924",
workerBorder:    "#805044",
onWorker:        "#241A17",

additional:      "#C7A3EA",
additionalDark:  "#A77ACF",
additionalDeep:  "#8759B0",
additionalSubtle:"#302541",
additionalBorder:"#735896",
onAdditional:    "#241B2B",
```

Update `ThemeColors` — because it is derived as `typeof lightColors`, the new keys
appear automatically; no manual interface edit needed.

### `src/global.css` — add CSS custom properties

Add after the existing `--color-ku-on-support` line in the light block, and after
`--color-ku-on-support` in the dark media query block.

**Light block additions:**

```css
/* Role colors */
--color-ku-hirer: #5f7655;
--color-ku-hirer-dark: #465b3e;
--color-ku-hirer-deep: #34462f;
--color-ku-hirer-subtle: #edf2ea;
--color-ku-hirer-border: #b6c4af;
--color-ku-on-hirer: #ffffff;

--color-ku-worker: #96533f;
--color-ku-worker-dark: #713d30;
--color-ku-worker-deep: #4f2a22;
--color-ku-worker-subtle: #f8ece8;
--color-ku-worker-border: #c9a79a;
--color-ku-on-worker: #ffffff;

--color-ku-additional: #7c4ba8;
--color-ku-additional-dark: #623784;
--color-ku-additional-deep: #412357;
--color-ku-additional-subtle: #f1ebf8;
--color-ku-additional-border: #c2aed7;
--color-ku-on-additional: #ffffff;
```

**Dark media query additions** (same property names, dark values):

```css
--color-ku-hirer: #a9c79e;
--color-ku-hirer-dark: #7fa273;
--color-ku-hirer-deep: #5f7655;
--color-ku-hirer-subtle: #243128;
--color-ku-hirer-border: #526b58;
--color-ku-on-hirer: #142019;

--color-ku-worker: #e1a08c;
--color-ku-worker-dark: #c77b65;
--color-ku-worker-deep: #a75d4b;
--color-ku-worker-subtle: #3b2924;
--color-ku-worker-border: #805044;
--color-ku-on-worker: #241a17;

--color-ku-additional: #c7a3ea;
--color-ku-additional-dark: #a77acf;
--color-ku-additional-deep: #8759b0;
--color-ku-additional-subtle: #302541;
--color-ku-additional-border: #735896;
--color-ku-on-additional: #241b2b;
```

**Phase 2 done when:** `bun run typecheck` passes. Run the NativeWind audit:
`node scripts/check-nativewind.js` — it must pass. No test changes in this phase.

---

## Phase 3 — Audit and migrate role-coloured UI

This phase finds UI components that currently use `ku-primary` (or `colors.primary`) to
colour a Worker- or Hirer-specific surface and replaces them with the correct role token.

### 3a — Identify role-specific usages

Search for `ku-primary` across `src` (248 usages found at audit time). For each one,
determine the workspace context:

- **Neutral / shared** — leave as `ku-primary` (buttons, active nav indicator, shared
  form focus ring). These correctly track the active ramp.
- **Hirer-specific surface** — replace with `ku-hirer` / `ku-hirer-subtle` /
  `ku-on-hirer` as appropriate. Example: a card header that is always Hirer-branded
  regardless of who is viewing.
- **Worker-specific surface** — replace with `ku-worker` / `ku-worker-subtle` /
  `ku-on-worker`. Example: the Worker assignment status badge or work-hub header.

The NativeWind audit (`node scripts/check-nativewind.js`) catches unknown class names;
run it after each file to confirm the new classes resolve.

Imperative consumers (`colors.primary` from `colors.ts`) follow the same rule. A
Worker-specific element that was reading `colors.primary` should read `colors.worker`
(static, not ramp-driven).

### 3b — Additional accent usages

`ku-additional` is for highlights, tags, and secondary emphasis that are not
Hirer/Worker specific and not a semantic status. Any existing `ku-support` usage that
fits this description may be migrated to `ku-additional`; `ku-support` remains for
editorial plum accents.

### 3c — `surface-terracotta` alignment

`--color-ku-surface-terracotta` exists in `global.css` as a bespoke warm surface. After
this migration it should map to `worker-subtle` (`#F8ECE8` light / `#3B2924` dark) to
stay consistent. Update the value in both light and dark blocks.

**Phase 3 done when:** `bun run typecheck` passes, `node scripts/check-nativewind.js`
passes, and no raw hex values from the new role families appear in any file other than
`colors.ts` and `global.css`. Verify with:

```bash
git grep -rn "96533F\|713D30\|4F2A22\|F8ECE8\|7C4BA8\|623784\|412357\|F1EBF8" -- src \
  ':!src/theme/colors.ts' ':!src/global.css'
```

Expected: no output.

---

## Phase 4 — Verify

```bash
bun run typecheck
bunx jest --forceExit --json --outputFile=/tmp/color-verify.json
node scripts/check-nativewind.js
node scripts/check-enum-literals.js
```

Check `/tmp/color-verify.json`: `numPassedTests` ≥ baseline, `numFailedTests` ≤ 3
(the pre-existing `ChatConversation*` failures).

Confirm the post-conditions from the top of this document — in particular that
`colors.worker` resolves to `#96533F` under a light scheme (assert in the browser or
via a throwaway eval: `getThemeColors("light").worker`).
