# KUQuest Mobile — Agent Guide

This file is the repository entry contract for coding agents. Keep it concise;
detailed rules live in the linked documents and skills below.

## Non-negotiables

- This is an Expo native mobile app. Android and iOS are the product targets;
  web behavior is out of scope unless explicitly requested.
- Use Bun and the scripts in `package.json`. Do not add another package-manager
  lockfile or upgrade Expo-managed dependencies without checking the SDK 57
  versioned documentation.
- Preserve unrelated work, tests, fixtures, QA evidence, and generated-state
  boundaries. Never use destructive Git cleanup as routine debugging.
- Use the terminology in `CONTEXT.md`. Do not invent backend routes, schemas,
  fixtures, domain states, navigation routes, or product rules.
- Validate the behavior changed before delivery. Native-facing changes require
  a development build; Expo Go is not evidence for native modules.

## Read order

Before changing source, routes, fixtures, API boundaries, tests, or project
files, read:

1. `docs/agents/repository-context.md` — ownership seams, compatibility drift,
   test topology, and safe-debug boundaries.
2. `CONTEXT.md` — canonical domain language.
3. `docs/agents/routing.md` — route to the relevant specification, rulebook,
   and ADR.
4. `CODE_STYLES.md` — review standards, composition, NativeWind, accessibility,
   and test conventions.
5. `docs/agents/ui-design-rules.md` — platform UI behavior, accessibility,
   responsive layout, navigation, forms, sheets, and native proof.
6. `docs/agents/gotchas.md` — repository-specific traps.

Then read the owning feature, adjacent tests, and the routed domain documents.
Read `docs/agents/engineering-workflow.md` for planning, delegation, Git
safety, behavioral tests, validation order, and delivery evidence.
For review, refactor, decomposition, or restructuring work, read
`docs/agents/codebase-review.md` before proposing or changing files.

## Domain authority

- Backend behavior: `docs/rulebook/` and `docs/api/api.yaml`.
- Mobile behavior: `docs/specs/`.
- Architecture and navigation: `docs/adr/` and
  `docs/system-design-specification.md`.
- UI behavior and accessibility: `docs/agents/ui-design-rules.md`; visual
  identity, tokens, typography, and component appearance: `DESIGN.md`.
- For Quest, Work Chat, Candidate Inquiry, Profile, Wallet, Proof, Review, or
  Settlement changes, resolve the actor, Quest state, selection mode,
  participation, `proofRequired`, and `dueAt` branch before changing behavior.
  Use `CONTEXT.md` and `docs/agents/routing.md`; record an assumption when an
  autonomous task has no narrower repository-supported answer.

## API boundaries

Before changing `src/api/*` or API-derived fixtures:

1. Read the routed rulebook/spec.
2. Run `bun run query-api` or use the `query-api` skill.
3. Verify method, path, parameters, request body, response schema, and errors.
4. Follow the existing API abstraction and fixture conventions.

The OpenAPI contract owns transport shape. Rulebooks and specs own domain
semantics. Record conflicts or missing contracts; never invent a substitute.

## Preservation and absence

- A missing route, schema, fixture, rulebook branch, navigation surface, or
  domain state is a repository gap. Record it; do not invent, redirect,
  silently delete, or reuse an unrelated surface.
- Do not delete, disable, skip, weaken, or rename unrelated tests. Change tests
  only when the product contract changed and the replacement remains behavioral.
- Remove unused code made by your change. Leave unrelated pre-existing dead
  code alone and report it separately.
- Check `git status` before editing and inspect changed-file ownership before
  delivery.

## Native validation

Read `README.md` and `docs/agents/mobile-validation.md` before native smoke
work. The canonical connected flow uses `bun run staging:start`, an installed
development build, semantic accessibility targets, and explicit device/build
state evidence. Close the app session and stop supervised Metro afterward.

## Skills and issue tracking

Use the matching repository skill instead of recreating its workflow. In
particular: `query-api` for API contracts, `domain-modeling` for terminology or
ADRs, `mobile-validation` for native smoke, and `retro` after substantial or
failed implementation work. Read `docs/agents/issue-tracker.md`,
`docs/agents/triage-labels.md`, and `docs/agents/domain.md` for GitHub issue
work; use only the canonical triage states.

If a failure or discovery is likely to affect future sessions, add a concise
rule to `docs/agents/gotchas.md` using its format. Prune obsolete gotchas
instead of accumulating diary entries.
