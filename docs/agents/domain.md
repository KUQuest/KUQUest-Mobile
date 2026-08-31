# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Authority & Source of Truth

The mirrored backend rulebook (`docs/rulebook/`, synced from `KUQuest-API-Server` at commit `1b55199d74d2e73a4a05a4662e49fb643cbee3e6`) is the canonical source of truth for domain rules, lifecycle transitions, state naming, money calculations, and administrative boundaries.

## Before exploring, read these

1. **`CONTEXT.md`** at the repo root: canonical domain glossary and language.
2. **`docs/specs/`**: domain specifications aligned with the backend rulebook:
   - `quest-state-summary.md` — canonical 7 Quest states, lifecycle transitions, Start Work, and UI visibility.
   - `group-quest-behavior.md` — 2×2 participation matrix (`SINGLE`/`GROUP` × `FCFS`/`CANDIDATE`), Candidate Teams, Join Codes, and underfilled consent gates.
   - `wallet-and-payments.md` — 4 Wallet compartments, integer Satang calculations, PromptPay top-up, Payouts, and Quest Escrow.
   - `conversation-and-work-chat.md` — Candidate Inquiry Conversations (1-on-1, pre-assignment) vs Work Conversations (coordination).
   - `proof-and-rating-reviews.md` — Proof submission, 24-hour review window, `PROOF_NOT_APPROVED` failure, and post-terminal Rating Reviews.
   - `student-profile-redesign.md` — Profile header, statistics card, tabbed views, and Academic Registration editing.
3. **`docs/adr/`**: architectural decisions for the mobile client.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids (e.g. use `Member`, `Hirer`, `Worker`, `Candidate`, `FIRST_COME_FIRST_SERVED`, `QUEST_FAILED`, `Academic Registration`).

If the concept you need isn't in the glossary yet, check the backend rulebook first before introducing new terms.

## Flag ADR conflicts

If your output contradicts an existing ADR or specification, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (authenticated-primary-navigation), but worth reopening because…_
