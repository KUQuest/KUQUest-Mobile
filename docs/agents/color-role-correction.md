# Color Role Correction Plan

Fix components that currently use `ku-primary` (sage green) or `colors.primary` in
Worker-specific or Additional-accent contexts where they should use the new role tokens
introduced in the `DESIGN.md` update.

**Scope:** UI token corrections only. No new features, no layout changes.

**Baseline:** 770 tests pass (3 pre-existing `ChatConversation*` failures).

**Done when:** typecheck clean, NativeWind audit passes, test count ≥ baseline, and
every Worker-workspace surface that was sage green resolves to terracotta on device.

---

## What's wrong and why

`workerRamp` currently maps `primary` to sage green (`#5F7655`) — identical to
`hirerRamp`. So when the Worker workspace is active, `colors.primary` and `ku-primary`
still resolve to Hirer sage. The Phase 1 of the color migration plan
(`docs/agents/color-migration.md`) will fix the ramp. **This plan fixes the components
that will still be wrong after the ramp is corrected**, because they use `ku-primary`
hardcoded in a Worker-specific context that the ramp cannot reach.

Three categories of wrong usage exist:

| Category                | Token used                      | Should be                     | Why wrong                                                                           |
| ----------------------- | ------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| **Worker workspace UI** | `ku-primary` / `colors.primary` | `ku-worker` / `colors.worker` | Stays sage even after ramp fix because these surfaces are always Worker-branded     |
| **Hirer workspace UI**  | `ku-primary` / `colors.primary` | `ku-hirer` / `colors.hirer`   | Same issue on the other side — should be explicit not ramp-inherited                |
| **Accent slots**        | `ku-primary`                    | `ku-additional`               | Non-role decorative tags and highlights that belong to the Additional purple family |

---

## Phase 1 — Token files prerequisite

Run `docs/agents/color-migration.md` Phases 1 and 2 first. This plan assumes
`ku-worker`, `ku-hirer`, and `ku-additional` CSS tokens exist in `global.css` and
`colors.worker`, `colors.hirer`, `colors.additional` exist in `colors.ts`. Do not
proceed until `bun run typecheck` and `node scripts/check-nativewind.js` both pass
with those new tokens.

---

## Phase 2 — Worker workspace surfaces

These files are either Worker-only screens or components that only render inside the
Worker workspace. Every `ku-primary` / `colors.primary` here should become
`ku-worker` / `colors.worker` and every `ku-primary-dark` / `colors.primaryDark`
should become `ku-worker-dark` / `colors.workerDark`.

### `src/features/workerHome/WorkerHomeScreen.tsx`

- `bg-ku-primary-dark` on the retry button → `bg-ku-worker-dark`

### `src/features/workerHome/components/WorkerActiveAssignmentCard.tsx`

- `bg-ku-primary-dark` on the action button → `bg-ku-worker-dark`

### `src/features/workerHome/components/WorkerQuestFeedCard.tsx`

- `text-ku-primary-dark` (tag text, reward text, footer text) → `text-ku-worker-dark`

### `src/features/workerHome/components/WorkerQuickAccessBar.tsx`

- `border-ku-primary-dark bg-ku-primary-dark` on container → `border-ku-worker-dark bg-ku-worker-dark`
- `bg-ku-primary-dark` on indicator fill → `bg-ku-worker-dark`
- `text-ku-primary-dark` on title → `text-ku-worker-dark`
- `bg-ku-primary-dark` on progress fill → `bg-ku-worker-dark`

### `src/features/workerHome/components/WorkerSearchBar.tsx`

- `border-ku-primary-dark bg-ku-primary-dark` (active/focused states) → `border-ku-worker-dark bg-ku-worker-dark`

### `src/features/questBoard/QuestWorkScreen.tsx`

Worker-specific: this screen is only reached when `actor === "WORKER"`.

- `ActivityIndicator color={colors.primary}` → `colors.worker`
- `bg-ku-primary` on the error retry button → `bg-ku-worker`
- `tintColor={colors.primary}` on RefreshControl → `colors.worker`
- `ChevronLeft color={colors.primaryDeep}` → `colors.workerDeep`
- `RefreshCw color={colors.primaryDeep}` → `colors.workerDeep`

### `src/features/questBoard/components/QuestWorkStatusCard.tsx`

- `colors.primary` in the icon color expression → `colors.worker`

### `src/features/questBoard/components/QuestWorkActionsCard.tsx`

Worker actions only (Proof submission, Completion confirmation):

- `ShieldCheck color={colors.primary}` → `colors.worker`
- `CheckCircle2 color={colors.primary}` → `colors.worker`
- `bg-ku-primary` on action buttons → `bg-ku-worker`
- `CheckCircle2 color={colors.primaryDeep}` → `colors.workerDeep`

### `src/features/questBoard/components/ProofSubmissionSheet.tsx`

Worker-only Proof upload sheet:

- All `colors.primary` icon colors → `colors.worker`
- All `bg-ku-primary` button backgrounds → `bg-ku-worker`

### `src/features/workerWork/components/WorkerProofForm.tsx`

Check this file for any `ku-primary` or `colors.primary` and apply the same rule.

**Phase 2 done when:** `bun run typecheck` passes and
`bun run test src/features/workerWork src/features/workerHome src/features/questBoard/__tests__/QuestWorkScreen.test.tsx`
passes.

---

## Phase 3 — Hirer workspace surfaces

These surfaces are Hirer-only or Hirer-branded and should use the explicit `ku-hirer`
family rather than relying on the ramp. Using `ku-hirer` makes the intent explicit and
survives any future ramp changes.

The most visible Hirer-specific surfaces to audit:

### `src/features/questBoard/HirerQuestManageScreen.tsx`

- `FileEdit color={colors.primary}` — Hirer manage action icon → `colors.hirer`
- `ShieldCheck color={colors.primary}` — Hirer proof action → `colors.hirer`
- `MessageSquare color={colors.primary}` — Hirer chat action → `colors.hirer`

### `src/features/home/components/HirerQuestProgressCard.tsx`

Audit all `ku-primary` / `colors.primary` usages. The card always renders in the Hirer
Home workspace → replace with `ku-hirer` / `colors.hirer`.

### `src/features/wallet/components/HirerBalanceCards.tsx`

Always renders in the Hirer wallet view:

- `ArrowRightLeft color={colors.primary}` → `colors.hirer`
- `colors.primaryDeep` icon colors → `colors.hirerDeep`
- `colors.primary` icon colors → `colors.hirer`

### `src/features/wallet/components/HirerWalletBanner.tsx`

- `Plus color={colors.primaryDeep}` → `colors.hirerDeep`

### `src/features/wallet/components/TransferEarningsModal.tsx`

Worker earnings transfer — this is Worker-side, not Hirer:

- `colors.primaryDeep` → `colors.workerDeep`
- `colors.primary` → `colors.worker`

**Shared surfaces** (leave as `ku-primary` / `colors.primary` — ramp-driven is correct):

- `Button.tsx`, `Input.tsx`, `SearchInput.tsx`, `Chip.tsx` — generic UI primitives
- `ActivityIndicator` in loading screens that are workspace-agnostic
- Active nav indicator in `BottomNav`
- Focus ring on inputs

**Phase 3 done when:** `bun run typecheck` passes and
`bun run test src/features/home src/features/wallet src/features/questBoard/__tests__/QuestBoardScreenJoinAndOwner.test.tsx`
passes.

---

## Phase 4 — Verify

```bash
bun run typecheck
node scripts/check-nativewind.js
bunx jest --forceExit --json --outputFile=/tmp/role-color-verify.json
```

Check `/tmp/role-color-verify.json`: `numPassedTests` ≥ baseline, `numFailedTests` ≤ 3.

Visual confirmation on device (once Metro is healthy): open the Worker workspace and
confirm the Work Hub screen, Proof submission sheet, and Worker Home cards all render
in terracotta, not sage green.
