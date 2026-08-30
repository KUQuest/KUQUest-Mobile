# KUQuest Mobile Agent Guide

```
use bun by deafault
```

## Platform focus

This repository is an Expo app for native Android and iOS. Treat Android and iOS behavior as the product target and keep implementation, testing, and run instructions focused on mobile.

Web support and web-specific optimization are out of scope unless the user explicitly asks for them. Keep responses focused on the requested mobile behavior rather than explaining development-server internals.

Native Google Sign-In requires an installed development build; use the mobile development-build scripts in `package.json` rather than Expo Go when validating the app.

## Expo version

Expo has changed. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing code.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

### Workflow

- Idea → sharpened plan: `grilling`/`grill-me` (interview only), `grill-with-docs` (interview + ADR/glossary), `batch-grill-me` (many open questions at once).
- Plan → issue tracker: `to-spec` (synthesis, no interview, one spec issue), `to-tickets` (breaks plan into blocking tracer-bullet tickets).
- Work bigger than one session: `wayfinder` — shared map issue + child ticket issues with blocking edges, resolved one at a time.
- Bug reports / QA: `qa` — conversational bug intake, files GitHub issues.
- Issue lifecycle: `triage` — categorises issues/PRs into the five labels above.
- Domain/architecture: `domain-modeling` (terminology, ADRs), `improve-codebase-architecture` (refactor scan).

Typical chain: `grilling`/`grill-with-docs` → `to-spec`/`to-tickets` → `triage` as issues come in → `wayfinder` if scope exceeds one session.

### Coding guidelines

Behavioral guidelines to reduce common LLM coding mistakes ([source](https://github.com/multica-ai/andrej-karpathy-skills)). Bias toward caution over speed; use judgment on trivial tasks.

**1. Think before coding** — don't assume, don't hide confusion, surface tradeoffs.
- State assumptions explicitly; if uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so; push back when warranted.
- If something is unclear, stop, name what's confusing, ask.

**2. Simplicity first** — minimum code that solves the problem, nothing speculative.
- No features beyond what was asked. No abstractions for single-use code. No unrequested "flexibility". No error handling for impossible scenarios.
- 200 lines that could be 50 → rewrite it.
- Ask: "Would a senior engineer call this overcomplicated?" If yes, simplify.

**3. Surgical changes** — touch only what you must, clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style even if you'd do it differently.
- Unrelated dead code: mention it, don't delete it.
- Remove imports/variables/functions YOUR changes made unused; don't remove pre-existing dead code unless asked.
- Test: every changed line traces directly to the user's request.

**4. Goal-driven execution** — define success criteria, loop until verified.
- "Add validation" → write tests for invalid inputs, then make them pass.
- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Refactor X" → ensure tests pass before and after.
- Multi-step tasks: state a brief plan, one line per step with its verify check.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites from overcomplication, clarifying questions come before implementation rather than after mistakes.

## Subagent workflow

For delegated or parallel work, read `docs/agents/subagent-workflow.md` before spawning agents. It is the provider-neutral routing and handoff contract.

- Codex project defaults and role manifests live in `.codex/config.toml` and `.codex/agents/`.
- Antigravity workspace agents live in `.agents/agents/<role>/agent.md`.
- Keep one writer per file; use read-only scout/reviewer/verifier roles for independent work.
- Codex parent sessions use `gpt-5.6-luna` with `max`; role manifests use task-shaped effort, escalating to `max` only for high-risk or ambiguous work. Antigravity manifests use its documented `flash`/`pro` tiers; it does not accept the Codex model ID.
