# Issue tracker: Linear

Issues for this repo live in Linear, team **Frontend** (id `9367dd84-2109-48f2-8d4d-dda8072dd699`), scoped by the `Mobile` label. Projects are shared cross-team (Frontend/Backend/Tester-QA) and split by `Mobile`/`Web` label, not by repo — always filter/tag `Mobile` when creating or listing issues for this repo.

Mobile implementation issues must follow the [Mobile implementation template](linear-mobile-implementation-template.md), copied from the KUQuest API Server's shared ticket design.

## Conventions

- **Create an issue**: `save_issue` with `team: "Frontend"`, label `Mobile`, plus any relevant project (see project list below).
- **Read an issue**: `get_issue`.
- **List issues**: `list_issues` filtered by `team: "Frontend"` and `label: "Mobile"`.
- **Comment**: `save_comment`.
- **List comments**: `list_comments`.
- **Close**: `save_issue` setting status to `Done` (completed) or `Canceled` — see workflow states below.

## Workflow states (team Frontend)

`Backlog`, `Todo`, `In Progress`, `In Review`, `Done` (completed), `Canceled`, `Duplicate`.

## Relevant projects (filter by `Mobile` label)

Messaging & Notifications, Trust & Safety, Wallet & Payments, Quest Application & Fulfillment, Quest Core, Auth & Profile. Fetch via `list_projects` with `team: "Frontend"`.

## When a skill says "publish to the issue tracker"

Create a Linear issue via `save_issue`, team Frontend, label `Mobile`.

## When a skill says "fetch the relevant ticket"

`get_issue`.
