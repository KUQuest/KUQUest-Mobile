# Live Quest Publish and Escrow Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Create Quest publish through the staging API, reserve Quest Escrow atomically, and show the result in live Hirer views.

**Architecture:** Demo mode continues using the in-memory fixture workflow. Normal authenticated mode uses the v2 API with canonical payloads, idempotency keys on both create and publish, server publish-check validation, and server-owned wallet movements. Local drafts are deleted only after successful server publish.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Jest/jest-expo, Better Auth cookies, `QuestApi`, `LiveQuestService`, `WalletApi`.

## Confirmed findings

- The old Create Quest path called `questWorkflow.dispatch({ type: "CREATE_AND_PUBLISH" })` with `hirerId: "demo-hirer"`, creating only in-memory state.
- The staging backend is operational: health, tags, Quest Board v2, Hirer Quests, Wallet, and Work Chat verification all pass.
- Staging requires `Idempotency-Key` on both `POST /api/v2/quests` and `POST /api/v2/quests/:id/publish`.
- Staging publish-check responses use `blockingReasons`, not `blockers`, and include the active money policy revision.
- v2 input uses inclusive per-slot `questFundingTotal` in Baht. The Server derives net reward and Platform Fee.

## Implementation tasks

1. Add API tests for canonical create requests, create idempotency, publish idempotency, and staging publish-check response fields.
2. Add a `toQuestV2Payload()` mapper for canonical modes, participation, condition items, Bangkok-offset timestamps, locations, tag IDs, proof boolean, headcount, and inclusive funding total.
3. Add live service methods for create, publish, and server publish-check operations.
4. Keep fixture publishing only behind explicit demo mode; use live API methods in normal authenticated mode.
5. Generate and reuse create/publish idempotency keys; retain the server Quest ID for same-screen retries.
6. Preserve local drafts on API failure and delete them only after `QUEST_OPEN` is returned.
7. Align Create Quest financial wording with inclusive Quest Funding Total semantics.
8. Load live Hirer Quests on focus in `MyQuestsScreen`, while retaining fixture behavior in demo mode.
9. Refresh wallet data on focus; never debit balances from the client.
10. Verify with focused tests, full Jest, typecheck, lint, staging create/check/publish/cancel, wallet delta, and My Quests visibility.

## Validation commands

```bash
bun run test -- --runInBand src/api/__tests__/QuestApi.test.ts
bun run test -- --runInBand src/features/createQuest/__tests__/createQuestModel.test.ts
bun run test -- --runInBand src/features/createQuest/__tests__/CreateQuestScreen.test.tsx
bun run test -- --runInBand src/features/myQuests/__tests__/MyQuestsScreen.test.tsx
bun run typecheck
bun run lint
bun run test -- --runInBand --silent
bun run verify:staging
```

## Staging acceptance

- Create returns `QUEST_DRAFT`.
- Publish-check returns `canPublish: true` and canonical `blockingReasons`.
- Publish returns `QUEST_OPEN`.
- `/api/v2/quests/mine` contains the Quest.
- Spending Balance decreases by exactly `escrowRequirementSatang`.
- Funding Reserved increases by exactly `escrowRequirementSatang`.
- Cancelling the disposable staging Quest refunds the reserved amount.
