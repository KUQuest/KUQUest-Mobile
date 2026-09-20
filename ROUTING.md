# ROUTING.md

Entry point for agent-to-agent routing in this repo.

- **Domain, spec, rulebook, and ADR routing**: read [`docs/agents/routing.md`](docs/agents/routing.md) before planning or coding. It routes by feature area, actor, and quest lifecycle state.
- **Native UI, accessibility, and adaptive layout routing**: read
  [`docs/agents/ui-design-rules.md`](docs/agents/ui-design-rules.md) with
  [`DESIGN.md`](DESIGN.md) before the owning feature and ADR.
- **Handoffs between agents** (implementer → tester, subagent → orchestrator): emit the **Handoff v1** format below.

## Handoff v1

A handoff is a structured result with these fields:

- `handoff: "v1"` — format version.
- `task` — the assignment this work closes, one line.
- `status` — `complete`, `complete_in_scope` (with what remains and who owns it), or `blocked` (with the exact blocker and what was tried).
- `changed_files` — every file touched; no others.
- `changes` — per file, what changed and why, tied to the acceptance criteria.
- `verification` — every command run with its captured result (cite the `Test Suites:`/`Tests:` lines, not a bare count).
- `unexpected` — discoveries, mid-flight regressions from concurrent work (name the owner), and anything flagged as surplus.
- `route` — the agent or role the change set should reach next (normally Tester).

Rules for authors of handoffs and the assignments that produce them:

- Cite a repo rule by `file:line` or not at all (see `AGENTS.md` → Subagent Workflow).
- An assignment that mandates a symbol, dependency, or state field must name its consumer or callsite; a mandate with no named consumer is optional and should be challenged in `unexpected`.
- An assignment states the scoped proof it expects (which test file or command), explicitly scoped so concurrent work in other files is never gated on it.
