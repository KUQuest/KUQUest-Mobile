# Create Quest Draft Key Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make authenticated Create Quest draft hydration use a valid Expo SecureStore key so the page opens instead of showing the draft-restore error.

**Architecture:** Keep draft persistence local to `expo-secure-store`. Change only the account-scoping delimiter in the storage-key builder from `:` to a SecureStore-supported character. Preserve the existing unauthenticated fallback key and all draft serialization behavior; the backend does not participate in this failure path.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, `expo-secure-store`, Jest with `jest-expo`.

---

### Task 1: Update the account-scoped key contract test

**Files:**

- Modify: `src/features/createQuest/__tests__/createQuestPersistence.test.ts:19-20,37-52`

**Steps:**

1. Change the test storage key from `${CREATE_QUEST_DRAFT_KEY}:account-42` to `${CREATE_QUEST_DRAFT_KEY}.account-42`.
2. Keep the authenticated-session assertion unchanged apart from the expected delimiter.
3. Do not alter tests for the shared fallback key, serialization, corrupt data, or deletion.

**Acceptance:** The test expresses the SecureStore-safe key contract and fails against the current colon implementation.

### Task 2: Run the focused test and confirm the red state

**Command:**

```bash
bun run test -- --runInBand src/features/createQuest/__tests__/createQuestPersistence.test.ts
```

**Expected:** The account-scoped key assertion fails because the implementation still returns a key containing `:`. Other persistence tests may continue to pass.

### Task 3: Replace the invalid key delimiter

**Files:**

- Modify: `src/features/createQuest/createQuestPersistence.ts:10-16`

**Change:**

Replace:

```ts
return session?.user.id
  ? `${CREATE_QUEST_DRAFT_KEY}:${session.user.id}`
  : CREATE_QUEST_DRAFT_KEY;
```

with:

```ts
return session?.user.id
  ? `${CREATE_QUEST_DRAFT_KEY}.${session.user.id}`
  : CREATE_QUEST_DRAFT_KEY;
```

The dot is allowed by Expo SecureStore, preserves account isolation, and avoids introducing a new storage abstraction.

### Task 4: Run focused persistence and screen tests

**Commands:**

```bash
bun run test -- --runInBand src/features/createQuest/__tests__/createQuestPersistence.test.ts
bun run test -- --runInBand src/features/createQuest/__tests__/CreateQuestScreen.test.tsx
```

**Expected:** Persistence tests pass, including the account-scoped key assertion. Create Quest screen tests pass, including hydration and retry behavior.

### Task 5: Run repository validation

**Commands:**

```bash
bun run typecheck
bun run lint
```

**Expected:** TypeScript and Expo lint complete without errors.

### Task 6: Verify the native Android surface

**Prerequisites:** An Android device or emulator with `adb` available. Use a development build, not Expo Go, because the repository requires native Google Sign-In.

**Commands:**

```bash
bun run dev:android
```

**Scenario:**

1. Sign in as an authenticated Member.
2. Open Create Quest.
3. Confirm the page leaves the loading/error state and displays the Quest Info form.
4. Enter a title, close and reopen the Create Quest page, and confirm the draft restores.
5. Confirm the retry screen does not appear.

**Expected:** The page hydrates successfully using `kuquest.create-quest-draft.<member-id>`.

### Task 7: Review the final diff

**Files:**

- `src/features/createQuest/createQuestPersistence.ts`
- `src/features/createQuest/__tests__/createQuestPersistence.test.ts`

Confirm no backend, auth, navigation, or unrelated UI files changed. No migration is expected because the current Expo SecureStore implementation rejects colon-containing keys before reading or writing them.

## Scope

- **In:** SecureStore key delimiter, focused regression test, TypeScript/lint validation, Android smoke verification.
- **Out:** Backend changes, draft schema changes, retry behavior changes, new persistence layers, broad auth refactors.

## Open Questions

- None blocking. If Member IDs are later allowed to contain characters outside `[A-Za-z0-9_.-]`, introduce a separately tested safe encoding before composing the key.
