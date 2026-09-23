# Quest Type Refactor

Extract interface files from implementation files, introduce typed enum label maps,
and centralise lifecycle predicates.

**Baseline:** 770 tests pass, 3 pre-existing failures in `ChatConversation*` (unrelated —
preserve, do not fix). Record your local baseline at the start of Phase 1 and compare at
Phase 5.

**Done when:** typecheck clean, test count ≥ baseline, no `typeof questBoardMessages.en`
in source, no bare `"WAIT_FOR_START"` / `"SUBMIT_PROOF"` / `"CONFIRM_COMPLETION"` literals
outside `questBoard/types.ts` and test fixtures.

---

## Convention

State once; apply everywhere.

**Naming:** follow the existing repo pattern (`roleplayTypes.ts`, `createQuestTypes.ts`):
use `<feature>Types.ts` for new interface files.

**Dependency rule — interface files are import sinks:** a `*Types.ts` file MUST NOT import
from any implementation file (`*Service.ts`, `*Projection.ts`, `*Screen.tsx`,
`*Queries.ts`). Only `questBoard/types.ts`, other `*Types.ts` files, and
`src/locales/locale.ts` are valid imports.

**Enum references:** after this refactor, no file outside `questBoard/types.ts` may write a
raw string where an enum value belongs. Use `QuestNextAction.WAIT_FOR_START`, not
`"WAIT_FOR_START"`.

**Donor:** the implementation file a type is being extracted from. Donor files keep a
re-export shim until Phase 4 cleans them up.

---

## Phase 1 — Domain predicates and typed label maps

No implementation dependencies. Create and test both files before moving to Phase 2.

### `src/domain/questLifecycle.ts`

```typescript
export { QuestStatus, QuestNextAction } from "@/features/questBoard/types";

export const TERMINAL_STATUSES: ReadonlySet<QuestStatus>; // COMPLETED, CANCELLED, FAILED
export function isTerminalStatus(s: QuestStatus): boolean;
export function isActionableNextAction(a: QuestNextAction): boolean; // a !== NONE
```

**Donor code to delete in Phase 4:**

- `terminalStates: Record<string, true>` — `QuestWorkScreen.tsx` lines 45–49, also used
  at lines 79, 234, 252
- `terminalStatuses: Record<CanonicalHirerQuestStatus, boolean>` — `hirerHomeData.ts`
  line 135, used at line 157

**Test:** `src/domain/questLifecycle.test.ts`  
Iterate `Object.values(QuestStatus)` and assert every value against `isTerminalStatus`
with the expected boolean. No mocks.

---

### `src/locales/questStatusLabels.ts`

```typescript
export type QuestStatusLabels = Record<QuestStatus, string>;
export type QuestNextActionLabels = Record<QuestNextAction, string>;
export const questStatusLabels: Record<SupportedLocale, QuestStatusLabels>;
export const questNextActionLabels: Record<
  SupportedLocale,
  QuestNextActionLabels
>;
```

`questNextActionLabels` must cover all 19 `QuestNextAction` values:

```
NONE  JOIN  APPLY  WITHDRAW_APPLICATION  CREATE_TEAM  JOIN_TEAM  SUBMIT_TEAM
SELECT_CANDIDATE  SELECT_TEAM  DECIDE_UNDERFILLED  CONSENT_UNDERFILLED
RESPOND_TO_EDIT  WAIT_FOR_START  SUBMIT_PROOF  CONFIRM_COMPLETION
REVIEW_PROOF  CANCEL  CREATE_REVIEW
```

`REVIEW_PROOF`, `CREATE_REVIEW`, `CANCEL`, `JOIN`, `APPLY`, and the team/candidate group
are currently unhandled in `QuestWorkScreen` and fall through to raw enum strings in the
UI. Cover them here.

After creating this file, update `questBoardMessages.ts`'s `statusLabel` implementation
to delegate:

```typescript
statusLabel: (status) =>
  (questStatusLabels[locale] as Record<string, string>)[status] ?? status,
```

**Test:** `src/locales/questStatusLabels.test.ts`  
For each locale assert every `QuestStatus` key and every `QuestNextAction` key maps to a
non-empty string (no raw enum passthrough).

**Phase 1 done when:** `bun run typecheck` passes and both new test files pass.

---

## Phase 2 — Interface files (mechanical extraction)

Extract types from donors into `*Types.ts` files. Add a re-export shim to each donor so
existing imports still compile. Do not touch import paths in other files yet; that is
Phase 4. Do not change any logic.

### `src/features/questBoard/liveQuestTypes.ts`

**Donor:** `liveQuestService.ts`  
**Move:** `LiveQuestActor`, `LiveQuestNextAction`, `LiveQuestCapabilities`,
`LiveQuestAssignment`, `LiveQuestParticipant`, `LiveQuestSnapshotOptions`,
`LiveQuestSnapshot`

Add to `liveQuestService.ts`:

```typescript
export type {
  LiveQuestActor,
  LiveQuestNextAction,
  LiveQuestCapabilities,
  LiveQuestAssignment,
  LiveQuestParticipant,
  LiveQuestSnapshotOptions,
  LiveQuestSnapshot,
} from "./liveQuestTypes";
```

---

### `src/features/questBoard/questWorkflowTypes.ts`

**Donor:** `questWorkflow.ts`  
**Move:** `QuestMyQuestRelationship`, `QuestMyQuestTab`, `QuestMyQuestProjection`,
`QuestBoardPreviewState`, `QuestBoardReadyModel`, `QuestBoardLoadingModel`,
`QuestBoardEmptyModel`, `QuestBoardErrorModel`, `QuestBoardUnavailableModel`,
`QuestBoardSurfaceModel`, `QuestWorkflow`

Re-export all from `questWorkflow.ts`.

---

### `src/features/questBoard/questDetailTypes.ts`

**Donor:** `questDetailProjection.ts`  
**Move:** `QuestDetailProjectionSource`, `QuestDetailApplicationStatus`,
`QuestDetailJoinStatus`, `QuestDetailProjectionCapabilities`, `QuestDetailProjection`

Re-export all from `questDetailProjection.ts`.

---

### `src/features/home/hirerHomeTypes.ts`

**Donor:** `hirerHomeData.ts`  
**Move:** `CanonicalHirerQuestStatus`, `TimelineStageKey`, `TimelineStageState`,
`QuestProgressStage`, `LocalizedHirerCopy`, `QuestMemberProfile`,
`HirerHomeQuestFixture`, `LiveHirerQuestCardData`, `HirerHomeData`

Re-export all from `hirerHomeData.ts`.

---

### `src/features/myQuests/myQuestTypes.ts`

**Donor:** `myQuestService.ts`  
**Move:** `HirerTab`, `StatusTone`, `CategoryTone`, `QuestSummary`

Re-export all from `myQuestService.ts`.

---

### `src/features/workerWork/workerWorkTypes.ts`

**Donor:** `workerWorkProjection.ts`  
**Move:** `WorkerWorkTone`, `WorkerWorkItem`, `WorkerWorkProjection`

Re-export all from `workerWorkProjection.ts`.

---

**Phase 2 done when:** `bun run typecheck` passes. No test changes in this phase.

---

## Phase 3 — questLabels.ts

Create `src/features/questBoard/questLabels.ts`. Move the three label helpers out of
`QuestWorkScreen.tsx` (lines 51–90) and rewrite to use typed lookups instead of a switch.

```typescript
import { QuestNextAction, QuestStatus } from "./types";
import { isTerminalStatus } from "@/domain/questLifecycle";
import type { LiveQuestSnapshot } from "./liveQuestTypes";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import type { SupportedLocale } from "@/locales/locale";
import {
  questNextActionLabels,
  questStatusLabels,
} from "@/locales/questStatusLabels";

export function nextActionLabel(
  action: QuestNextAction,
  messages: QuestWorkMessages,
  locale: SupportedLocale
): string {
  // messages supplies the four work-screen-specific overrides
  const overrides: Partial<Record<QuestNextAction, string>> = {
    [QuestNextAction.WAIT_FOR_START]: messages.waitingForStart,
    [QuestNextAction.SUBMIT_PROOF]: messages.proofCta,
    [QuestNextAction.CONFIRM_COMPLETION]: messages.confirmationCta,
    [QuestNextAction.RESPOND_TO_EDIT]: messages.editTitle,
  };
  return overrides[action] ?? questNextActionLabels[locale][action];
}

export function workStatusLabel(
  state: QuestStatus,
  messages: QuestWorkMessages,
  locale: SupportedLocale
): string {
  if (state === QuestStatus.QUEST_ASSIGNED) return messages.assigned;
  if (state === QuestStatus.QUEST_IN_PROGRESS) return messages.inProgress;
  if (isTerminalStatus(state)) return messages.terminal;
  return questStatusLabels[locale][state];
}

export function assignmentLabel(
  assignment: LiveQuestSnapshot["assignment"],
  locale: SupportedLocale
): string {
  return assignment?.state
    ? questStatusLabels[locale][assignment.state as QuestStatus]
    : "—";
}
```

Update `QuestWorkScreen.tsx`:

- Delete lines 45–90 (`terminalStates`, `nextActionLabel`, `statusLabel`,
  `assignmentLabel`)
- Import `nextActionLabel`, `workStatusLabel`, `assignmentLabel` from `./questLabels`
- Import `isTerminalStatus` from `@/domain/questLifecycle`
- Replace `typeof questBoardMessages.en` in the three remaining function signatures with
  `QuestBoardMessages` (already exported from `@/locales/questBoardMessages`)
- Update the three call sites in the component body to pass `locale` instead of
  `questMessages`; remove the now-unused `questMessages` constant

**Test:** `src/features/questBoard/questLabels.test.ts`  
Test `nextActionLabel` for the four override values and at least two fallthrough values
(`REVIEW_PROOF`, `CREATE_REVIEW`). Test `workStatusLabel` for `QUEST_ASSIGNED`,
`QUEST_IN_PROGRESS`, `QUEST_COMPLETED` (terminal). No rendering.

**Phase 3 done when:** `bun run typecheck` passes, existing `QuestWorkScreen` tests pass,
new `questLabels` tests pass.

---

## Phase 4 — Wire-up (mechanical)

Change import paths. No logic changes anywhere.

Remove re-export shims from donors after every consumer in its group is redirected, then
delete the original inline definitions from the donor.

### Redirect to `liveQuestTypes`

```
src/app/quest/[id]/__tests__/manage.test.tsx
src/app/quest/[id]/__tests__/select-roster.test.tsx
src/features/chat/__tests__/ChatConversationMedia.test.tsx
src/features/myQuests/myQuestService.ts
src/features/questBoard/HirerProofReviewScreen.tsx
src/features/questBoard/HirerQuestManageScreen.tsx
src/features/questBoard/QuestProofScreen.tsx
src/features/questBoard/QuestReviewScreen.tsx
src/features/questBoard/SelectRosterScreen.tsx
src/features/questBoard/__tests__/HirerProofReviewScreen.test.tsx
src/features/questBoard/__tests__/QuestBoardScreenJoinAndOwner.test.tsx
src/features/questBoard/__tests__/QuestReviewScreen.test.tsx
src/features/questBoard/__tests__/QuestWorkScreen.test.tsx
src/features/questBoard/api/questBoardQueries.ts
src/features/questBoard/components/QuestDetailBody.tsx
src/features/questBoard/components/QuestDetailEntrySurfaces.tsx
src/features/questBoard/components/QuestWorkActionsCard.tsx
src/features/questBoard/components/QuestWorkStatusCard.tsx
src/features/questBoard/detail/questDetailActions.ts
src/features/questBoard/detail/useQuestDetailReadSource.ts
src/features/questBoard/questDetailProjection.ts
src/features/questBoard/questWorkflow.ts
```

### Redirect to `questWorkflowTypes`

```
src/features/createQuest/CreateQuestScreen.tsx
src/features/createQuest/__tests__/createQuestWorkflow.test.ts
src/features/createQuest/components/CreateQuestActionBar.tsx
src/features/createQuest/components/CreateQuestCompletionState.tsx
src/features/createQuest/useCreateQuestCommit.ts
src/features/createQuest/useCreateQuestWizard.ts
src/features/questBoard/QuestBoardScreen.tsx
src/features/questBoard/__tests__/questWorkflow.test.ts
src/features/questBoard/questBoardHarness.ts
src/features/questBoard/questFixtureAdapter.ts
```

### Redirect to `questDetailTypes`

```
src/features/questBoard/__tests__/QuestDetailSmoke.test.tsx
src/features/questBoard/__tests__/questWorkflow.test.ts
src/features/questBoard/detail/questDetailActions.ts
src/features/questBoard/detail/questDetailPresentation.ts
src/features/questBoard/detail/useQuestDetailNavigation.ts
src/features/questBoard/detail/useQuestDetailReadSource.ts
```

### Redirect to `hirerHomeTypes`

```
src/features/home/HomeScreen.tsx
src/features/home/__tests__/HomeScreen.test.tsx
src/features/home/__tests__/hirerHomeData.test.ts
src/features/home/api/homeQueries.ts
src/features/home/components/HirerQuestProgressCard.tsx
src/features/home/components/HirerQuestRosterModal.tsx
src/features/home/hirerHomeMessages.ts
```

### Redirect to `myQuestTypes`

```
src/features/myQuests/MyQuestListScreen.tsx
src/features/myQuests/__tests__/MyQuestListScreen.test.tsx
src/features/myQuests/__tests__/MyQuestSummaryCard.test.tsx
src/features/myQuests/components/MyQuestSummaryCard.tsx
src/features/myQuests/myQuestWorkspaceProjection.ts
src/locales/myQuestMessages.ts
src/utils/format.ts
```

### Redirect to `workerWorkTypes`

```
src/features/workerWork/WorkerWorkManagementScreen.tsx
src/features/workerWork/__tests__/WorkerProofForm.test.tsx
src/features/workerWork/__tests__/WorkerWorkManagementScreen.test.tsx
src/features/workerWork/__tests__/workerWorkProjection.test.ts
src/features/workerWork/components/WorkerWorkCard.tsx
```

### Donor cleanup (after all redirects in each group)

- `liveQuestService.ts` — remove shim; delete the seven moved type definitions
- `questWorkflow.ts` — remove shim; delete moved type definitions
- `questDetailProjection.ts` — remove shim; delete moved type definitions
- `hirerHomeData.ts` — remove shim; delete moved type definitions; replace
  `terminalStatuses` with `isTerminalStatus` from `@/domain/questLifecycle`
- `myQuestService.ts` — remove shim; delete moved type definitions
- `workerWorkProjection.ts` — remove shim; delete moved type definitions

**Phase 4 done when:** `bun run typecheck` passes with 0 errors and `git grep "export.*from"` finds no re-export shims in donor files.

---

## Phase 5 — Verify

```bash
bun run typecheck
bunx jest --forceExit --json --outputFile=/tmp/refactor-verify.json
```

Check `/tmp/refactor-verify.json`:

- `numPassedTests` ≥ your recorded baseline
- `numFailedTests` ≤ 3 (the pre-existing `ChatConversation*` failures)

Then confirm the three post-conditions from the top of this document:

- no `typeof questBoardMessages.en` remains in source
- no bare `"WAIT_FOR_START"` / `"SUBMIT_PROOF"` / `"CONFIRM_COMPLETION"` literals outside `questBoard/types.ts` and test fixtures
- no `terminalStates` or `terminalStatuses` records remain outside `questLifecycle.ts`
