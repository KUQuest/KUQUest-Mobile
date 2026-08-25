# Linear template: Mobile implementation

Use this description template for Mobile implementation issues in Linear.
Mobile work belongs to the Frontend team and is scoped with the `Mobile` label.

## Linear defaults

- Title: `<User journey outcome> on mobile`
- Team: `Frontend`
- Status: `Backlog` or `Todo`
- Labels: `Role/Implementation`, `Type/Feature`, `Surface/Mobile`, `Agent State/ready-for-agent`, `QA Policy/Required`
- Estimate: required before scheduling
- Project and milestone: required

## Description template

```markdown
## Outcome

<!-- Describe the complete mobile user outcome. -->

## User story

As a **<mobile user role>**, I want to **<action>**, so that **<outcome>**.

## Context

- Parent spec/PRD: <!-- Linear issue -->
- Figma flow/frame: <!-- Exact reference -->
- Backend/API dependency: <!-- Issue/contract -->
- Supported platforms: <!-- Android/iOS/both -->
- Minimum OS/app version: <!-- If relevant -->

## Scope

### In scope

- <!-- Journey owned by this issue -->

### Out of scope

- <!-- Explicit exclusions -->

## Navigation and lifecycle

- Entry point: <!-- Route/screen/deep link -->
- Success destination: <!-- Route/screen -->
- Back behavior: <!-- System/app back -->
- App background/foreground behavior: <!-- State preservation -->
- Process restart behavior: <!-- Persisted/recovered state -->

## Required UI states

- Initial/loading
- Empty
- Error and retry
- Success
- Offline/degraded network
- Permission denied
- Session expired

Describe only applicable states and remove the rest explicitly.

## Device and interaction requirements

- Screen sizes/orientations: <!-- Supported cases -->
- Keyboard behavior: <!-- Resize/scroll/focus -->
- Safe areas/system bars: <!-- Expectations -->
- Touch target and gesture behavior: <!-- Expectations -->
- Accessibility: <!-- Semantics, scaling, screen reader -->
- Localization/timezone/date/number behavior: <!-- If applicable -->

## Data, cache and synchronization

- API operations: <!-- Relevant endpoints -->
- Local state/cache: <!-- What persists and for how long -->
- Offline behavior: <!-- Read/write/queue/refuse -->
- Retry and duplicate-submit behavior: <!-- Contract -->
- Conflict behavior: <!-- If local and remote differ -->

## Acceptance criteria

- [ ] Given **<device/app state>**, when **<user action>**, then **<observable result>**.
- [ ] Given a slow or unavailable network, the user sees **<state>** and can **<recover>**.
- [ ] Given backgrounding/restart at **<point>**, the selected state-preservation behavior occurs.
- [ ] Given permission denial/session expiry, the app responds without trapping or losing unrelated user data.
- [ ] Text scaling and screen-reader navigation remain usable for the changed flow.

## Testing decisions

- Unit/widget tests: <!-- State and rendering behavior -->
- Integration tests: <!-- Navigation/API/storage -->
- Device/E2E tests: <!-- Critical journey -->
- Manual device matrix: <!-- Minimum set -->
- Regression focus: <!-- Existing flow at risk -->

## Demo path

1. Install/open build `<identifier>`.
2. Use account/data `<fixture>`.
3. Perform `<actions>`.
4. Observe `<result>`.

## Definition of Done

- [ ] Acceptance criteria pass on the agreed device matrix.
- [ ] Loading/error/offline/lifecycle states are handled where applicable.
- [ ] Required automated checks pass.
- [ ] PR contains screenshots or screen recording.
- [ ] Build/commit tested by QA is identifiable.
- [ ] PR contains QA Brief and test data instructions.
- [ ] Issue has entered `Ready for QA`; do not mark it Done until the linked verification passes.
```

## Rejection checks

- Reject if the exact build, platform or device assumptions needed for verification are unknowable.
- Reject if the happy path is specified but offline, permission or lifecycle behavior materially affects the flow and remains undecided.
- Reject if a UI-only ticket cannot be demonstrated without an unstated API dependency.
