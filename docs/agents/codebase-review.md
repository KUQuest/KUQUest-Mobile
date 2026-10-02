# Codebase review and decomposition

Use this rule when reviewing, refactoring, decomposing, restructuring, moving,
or extracting code from an existing module, including React Native components.
It applies before creating a component, hook, utility, service, type,
constant, skeleton, or shared abstraction for that work.

The required sequence is:

```text
inspect → list → understand → diagnose → propose → refactor → verify
```

## 1. Inspect the current structure

Read the target file and inspect its surrounding module before editing. Build
the inventory with repository search rather than assumptions. Include, when
relevant:

- direct imports and consumers of the target
- related components, types, hooks, utilities, services, and constants
- adjacent tests, styles, loading states, and skeleton components
- shared UI primitives and existing abstractions that could solve the task
- exports, barrel files, aliases, and framework boundaries

Search for an equivalent before creating any file or abstraction. Record the
current worktree status so unrelated changes remain distinguishable.

**Done when:** the inventory names the target, its relevant dependencies and
consumers, adjacent behavior tests, and the existing abstractions considered.

## 2. Publish the relevant-file inventory

Before proposing a refactor, show only the files relevant to the task. Include
the target, direct imports, relevant consumers, related files in the owning
feature, and shared dependencies likely to change. For each file, state its
current responsibility in one or two lines. Do not list the whole repository.

Use this shape:

```text
Files involved

src/features/example/ExampleScreen.tsx
- Composes the screen UI
- Currently contains filtering and loading markup

src/features/example/exampleTypes.ts
- Owns the feature's domain and view-model types
```

**Done when:** every listed file has a responsibility and every omitted file
is either unrelated or intentionally outside the change boundary.

## 3. Diagnose before designing

Identify evidence-backed structural problems in the current implementation.
Check for:

- mixed responsibilities or business logic inside presentation code
- API or external I/O performed by UI components
- duplicated types, constants, logic, or UI patterns
- meaningful loading markup embedded in the primary component
- reusable logic defined locally or an abstraction that has no real reuse
- files located outside their owning feature
- unclear or circular dependencies
- a component whose size reflects several responsibilities rather than one

Treat size alone as evidence for inspection, not as a reason to split a file.
State the responsibility boundary that makes each proposed extraction useful.

**Done when:** each proposed change has a named structural reason, and the
current behavior, public interfaces, and known compatibility values are listed
as preservation constraints.

## 4. Propose the final structure

Show the proposed tree before creating, deleting, moving, or renaming files.
List the exact changes:

```text
Proposed structure

features/example/
├── components/
│   ├── ExampleScreen.tsx
│   └── ExampleSkeleton.tsx
├── hooks/
│   └── useExample.ts
├── exampleTypes.ts
└── exampleConstants.ts

Changes

Create:
- ExampleSkeleton.tsx — owns the meaningful loading layout

Modify:
- ExampleScreen.tsx — composes the screen and consumes the hook

Move:
- Example type → exampleTypes.ts

Delete:
- none
```

Every new file needs an independent responsibility: reuse, business-logic
separation, independent testing, a meaningful UI section, a shared domain
contract, shared configuration, or external I/O. Keep feature code cohesive;
use a global directory only for code genuinely shared across features.

Keep trivial one-use logic local when extraction would only shorten a file.
Extract when the boundary improves reuse, testing, responsibility, or
readability. A loading state with meaningful structure belongs in a feature
specific `*Skeleton.tsx` beside its primary component.

**Done when:** the tree, file operations, responsibilities, ownership, and
reason for every new abstraction are reviewable before implementation begins.

## 5. Review dependencies before moving code

For every moved or extracted symbol, inspect:

- imports, path aliases, and server/client or native/framework boundaries
- shared state, context, and side effects
- tests, fixtures, public exports, barrel files, and all consumers

Search references to exported symbols before finalizing the change list. Keep
compatibility re-exports only when an existing consumer requires them, and
record that boundary in the plan. Do not move a symbol across a boundary whose
runtime behavior has not been checked.

**Done when:** every affected caller, test, export, and boundary has a planned
destination or an explicit reason to remain unchanged.

## 6. Refactor in responsibility-sized batches

Implement the proposed structure with the smallest owning change. A `.tsx`
file should make its rendered hierarchy easy to scan. Keep it primarily to
props, hook calls, small UI-specific state, small event handlers, conditional
rendering, and UI composition. A reader should understand the screen before
having to parse business rules or infrastructure details.

Keep small, single-use component prop types beside the component. Put reusable
feature or domain contracts in the feature's established type module, such as
`chatTypes.ts` or `questBoard/types.ts`. Follow the import boundary in
[`CODE_STYLES.md`](../../CODE_STYLES.md) for `*Types.ts` modules.

Place non-trivial responsibilities according to the existing feature
architecture:

| Responsibility                     | Preferred location                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Reusable feature or domain types   | Feature's established `*Types.ts` module or domain owner                        |
| Static configuration or labels     | Feature constants/label module or `src/locales/`                                |
| Stateful feature orchestration     | Existing feature hook, query module under `api/`, or owning store               |
| Pure transformations and decisions | Feature projection or utility module                                            |
| API calls and external I/O         | Existing `src/api/` boundary through the feature's `api/` or service module     |
| Meaningful loading UI              | Feature-local `*Skeleton.tsx`, composed from shared skeleton primitives         |
| Reusable UI                        | Feature component; shared UI only for domain-agnostic contracts with real reuse |
| Styling                            | Feature-local `*Styles.ts` and the shared theme tokens                          |

Use the project's existing module shape. A custom hook is useful when it
clarifies stateful behavior or orchestration; query hooks already belong in
feature `api/` modules. Pure projections do not need React. Presentation
components consume feature hooks and query modules instead of issuing raw
requests or owning transport details. Keep trivial calculations, static
values, and event handlers local when extracting them would only add indirection.

### UI sections and states

Extract a child component when it represents a meaningful UI section, owns
state or behavior, can be reused, is independently understandable or testable,
or makes the parent hierarchy substantially clearer. Do not create a component
for every small JSX fragment or function.

Keep loading, empty, error, and primary content branches easy to distinguish.
Give a meaningful screen or card skeleton its own feature-local component and
compose it from the shared `LoadingSkeleton` and `SkeletonBlock` primitives
after checking their current API. Keep only an extremely small placeholder
inline. Extract substantial empty or error layouts when their own structure or
behavior obscures the main component. Small inline conditions remain clear:

For example, `{quest.isVerified && <VerifiedBadge />}` is a clear inline
condition and does not need its own component or utility.

Colocate feature code with its owner. A nested folder for a component and its
types, utilities, or skeleton is useful when several closely related files
exist; retain the current feature layout for small components. Put primitives
in `src/components/ui/` only when they are domain-agnostic and have a second
real consumer. Follow `DESIGN.md` and
[`nativewind.md`](nativewind.md) for semantic styling and shared tokens.

During diagnosis, check for extraction opportunities in this order when
applicable: reusable types, substantial static configuration, skeleton UI,
meaningful child sections, pure transformations, API or other I/O, complex
stateful behavior, then shared UI primitives. This order guides inspection;
ownership and behavior determine the actual implementation order.

Warning signs include many unrelated effects or state variables, substantial
business rules or formatting helpers, raw API calls, large static datasets,
several domain types, embedded skeleton trees, deeply nested state branches,
multiple major screen sections, or a long file where the main render is hard
to find. Treat these as prompts to inspect responsibility boundaries, not as
automatic extraction rules. File length alone does not justify decomposition.

Preserve component output, API behavior, state transitions, validation, error
handling, loading behavior, accessibility, and public interfaces. Remove only
obsolete code made by the current change; leave unrelated dead code and dirty
worktree changes intact.

**Done when:** the implementation matches the proposed structure, each moved
responsibility has one owning location, the parent component communicates its
UI hierarchy, and no behavior change was introduced without an explicit
product requirement.

## 7. Re-check and verify

After editing, inspect imports and references again. Confirm that the final
file structure matches the proposal, no duplicate abstraction remains, and
the changed-file list contains only task-owned paths. Run the repository's
targeted tests and the applicable type, lint, format, UI, API, and native
checks using the commands documented in
[`engineering-workflow.md`](engineering-workflow.md) and the owning feature.

Report failures with their exact scope and distinguish pre-existing failures
from regressions introduced by the change.

**Done when:** affected references resolve, focused behavioral checks pass,
the relevant broader checks have been run, and any remaining limitation is
explicitly reported.

## Required pre-refactor report

Before implementation, provide:

1. **Files involved** — relevant paths and current responsibilities.
2. **Issues found** — evidence-backed responsibility or dependency problems.
3. **Proposed structure** — the final tree and ownership boundaries.
4. **Changes** — create, modify, move, and delete lists.
5. **Responsibilities** — why each new or moved file exists.

The report is complete only when the user can review the intended file
operations and responsibility boundaries without reading the agent's private
reasoning.

## Required delivery report

End with the final structure, the files changed, the behavior preserved or
intentionally changed, verification commands and results, native/API
implications when applicable, and remaining limitations. Re-check the task
against the delivered paths before stopping.
