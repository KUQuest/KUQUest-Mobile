# Member Penalty Notifications — API Request

**Status:** proposal for the backend team. Nothing here exists in
`docs/api/api.yaml` yet. Do not implement it in the app until the contract
lands and `bun run query-api` confirms it.

## Problem

A Member who receives a Red Flag, a Member Ban, or an upheld Conduct Report
can learn of it only by opening their own Profile
(`GET /api/v1/profile/penalty-status`) or by being refused an action
(`MEMBER_RED_FLAGGED`, `MEMBER_BANNED`).

- The rulebook already promises a push: `CONDUCT_REPORT_UPHELD` "sends an
  Android Push Notification to the reported Member naming the reason and
  result" (`docs/rulebook/admin/admin-conduct-report-contract.md`).
- The app's push contract cannot carry it. `questV2PushTypeSchema`
  (`src/api/questV2Contracts.ts`) lists eight Quest push types, none about
  penalties, and `pushPayloadSchema` requires a Quest `questId` that a
  penalty does not have.
- There is no endpoint that lists past notifications, so a missed or
  dismissed push is lost.

## 1. Push types

Add Member-level push types. Penalty pushes carry no `questId`.

| `type`                     | Recipient           | Fired when                                                           |
| -------------------------- | ------------------- | -------------------------------------------------------------------- |
| `PENALTY_RED_FLAG_APPLIED` | the Member          | a Misconduct strike produces a Red Flag                              |
| `PENALTY_RED_FLAG_EXPIRED` | the Member          | the Red Flag expires, or a `REPORT_CASE_RESTORED` decision clears it |
| `PENALTY_BAN_APPLIED`      | the Member          | a temporary or permanent ban starts                                  |
| `PENALTY_BAN_ENDED`        | the Member          | a temporary ban expires or is reversed                               |
| `CONDUCT_REPORT_UPHELD`    | the reported Member | an Admin upholds a Conduct Report (already required by the rulebook) |

Data payload for these types:

```json
{
  "type": "PENALTY_RED_FLAG_APPLIED",
  "notificationId": "uuid",
  "transitionId": "string",
  "result": "RED_FLAG | TEMPORARY_BAN | PERMANENT_BAN",
  "ladder": "MISCONDUCT | REVIEW",
  "source": "REPORT_CASE | CONDUCT_REPORT | REVIEW_AVERAGE",
  "expiresAt": "date-time, omitted for a permanent ban"
}
```

Privacy: the payload never names the reporter and never includes the reported
message text or proof. This keeps the existing rule that the reported Member
never learns the filer.

Critical-event rule: these types are not mutable per Quest. They are
critical Events under the Push Notification contract.

## 2. Notification inbox

A read-only list so a Member can see past notifications, including penalty
ones, in one place. It should cover existing Quest push types too, so the
app can build one notification center.

### `GET /api/v1/notifications`

Cursor-paginated, newest first.

Query: `limit` (1–50, default 20), `cursor` (opaque), `unreadOnly` (boolean).

Response `data`:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "PENALTY_RED_FLAG_APPLIED",
      "createdAt": "date-time",
      "readAt": "date-time | null",
      "questId": "uuid | null",
      "result": "RED_FLAG | TEMPORARY_BAN | PERMANENT_BAN | null",
      "expiresAt": "date-time | null"
    }
  ],
  "nextCursor": "string | null"
}
```

The server sends no localized copy. The app owns Thai and English text, as it
does for push today.

### `GET /api/v1/notifications/unread-count`

Response `data`: `{ "count": 0 }`. Drives a badge without loading the list.

### `POST /api/v1/notifications/read`

Request: `{ "ids": ["uuid"] }` (up to 100) or `{ "all": true }`.
Idempotent: marking a read item again succeeds and changes nothing.

Errors: standard `401` for no session. A `MEMBER_BANNED` Member cannot reach
these endpoints, because sign-in is denied.

## 3. Red Flag on other Members

The rulebook shows the Red Flag on the Member Profile, the mini-profile during
Candidate selection, and the Hirer identity on Quest pages. The API already
exposes `redFlagged` on Member data and `hirerRedFlagged` on Quest data. No
new field is needed. This section is here so the contract owner confirms those
fields mean "a Red Flag is active now", not "has ever had one".

## Open questions for the backend

1. Does the inbox include Work Conversation messages, or only Events? The app
   recommends Events only, since chat has its own unread state.
2. Retention of inbox items. The app recommends at least 90 days.
3. Should `PENALTY_BAN_APPLIED` be delivered at all? A banned Member cannot
   sign in, but a push can still reach the device and explain the ban.

## Mobile follow-up once this lands

- Extend the push contract and add localized copy in `src/locales`.
- Add a notification center surface. This needs a new route and a Mobile
  Surface entry, so it is gated on the contract and a product decision.
- Link a penalty notification to the Profile penalty card
  (`ProfilePenaltyStatus`).
