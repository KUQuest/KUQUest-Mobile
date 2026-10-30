# Dispute Case Visibility for Both Sides — API Request

**Status:** proposal for the backend team. Nothing here exists in the staging
OpenAPI (checked 2026-10-31 with `bun run query-api --staging`). Do not
build the respondent UI in the app until the contract lands.

## Problem

A Hirer cannot learn that a Worker filed a Dispute Case on their Quest, nor
who won it. A Worker cannot learn about a case that names them unless they
filed it.

What the API gives today:

| Read                                            | Who sees what                                                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispute.myCase` on `GET /api/v2/quests/{id}`   | The caller's **own** case only: `id`, `displayId`, `status`, `createdAt`. No outcome.                                                                |
| `GET /api/v1/quests/{questId}/disputes/mine`    | The filer's own case, with `resolvedWorkerId`, `resolvedAmountSatang`, `resolvedAt`.                                                                 |
| `POST /api/v1/disputes/{disputeCaseId}/respond` | Lets "the opposing Member" send one statement, but no Member read returns a case they did not file, so the respondent can never get `disputeCaseId`. |
| Push / Member Notification inbox                | No Dispute types. Today the inbox holds penalty types only (ADR 0035).                                                                               |

Result: a Hirer sees the held money leave on settlement with no reason, and
the respond route cannot be called from the app.

The app already shows a filing **Worker** the result of their own case
(`DisputeOutcome`, from `getMyQuestDisputeCase`). Since #316, a Hirer cannot
file in the app, so the Hirer is always the respondent.

## 1. Cases on the Quest detail (`dispute.cases`)

Add `cases` to the `dispute` object on every Quest detail read: the Hirer's
canonical `GET /api/v2/quests/{id}` and the participation detail. It lists
every case on this Quest where the caller is the **filer or the respondent**,
oldest first. Keep `myCase` unchanged for compatibility.

Today `dispute` is `null` unless the Quest is `QUEST_FAILED` (or
`QUEST_COMPLETED` with an unpaid slot). Keep sending it on those Quests
**after the filing window closes**, while any case exists. The outcome must
stay readable in history.

```json
{
  "canFile": false,
  "windowEndsAt": "date-time | null",
  "myCase": null,
  "cases": [
    {
      "id": "uuid",
      "displayId": "DC-000123",
      "status": "DISPUTE_CASE_PENDING | DISPUTE_CASE_DISMISSED | DISPUTE_CASE_RESOLVED",
      "category": "PROOF_REVIEW | QUEST_CONDITION | PARTIAL_WORK | OTHER | null",
      "createdAt": "date-time",
      "viewerSide": "FILER | RESPONDENT",
      "filer": {
        "role": "HIRER | WORKER | TEAM_LEADER",
        "memberId": "uuid",
        "displayName": "string"
      },
      "respond": {
        "canRespond": true,
        "respondBy": "date-time | null",
        "submittedAt": "date-time | null"
      },
      "outcome": {
        "resolvedAt": "date-time",
        "paidWorker": { "memberId": "uuid", "displayName": "string" },
        "amountSatang": 25050
      }
    }
  ]
}
```

| Field        | Rule                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewerSide` | `FILER` for the caller's own case (and, in a Candidate Team, every Team member for the Team Leader's case). `RESPONDENT` for a case filed against the caller.                                                        |
| `filer`      | Who filed. The Hirer always sees the filing Worker. Name only, no contact data.                                                                                                                                      |
| `respond`    | `null` when `viewerSide` is `FILER`. `canRespond` is the server decision (case pending, hold active, within 7 days, no statement yet). `respondBy` drives the countdown.                                             |
| `outcome`    | `null` while `DISPUTE_CASE_PENDING`. For `DISPUTE_CASE_DISMISSED`: `{ resolvedAt, paidWorker: null, amountSatang: null }`. For `DISPUTE_CASE_RESOLVED`: the paid Worker and the integer Satang moved Hirer → Worker. |
| Money        | Integer Satang. The client never computes it.                                                                                                                                                                        |
| Privacy      | No `submittedDetail`, respondent statement, or evidence of the other side. Those stay Admin-only (`getAdminDisputeEvidence`).                                                                                        |

Open product points for the backend and product teams:

1. **Who is the respondent?** When a Worker files, it is the Hirer. When a
   Hirer files (allowed by the rulebook, hidden in the app since #316), is it
   every Assignment Worker or only those the case names?
2. **Other Workers' cases.** Should a Worker see that another Worker on the
   same Quest won money? This request says no: only filer and respondent see a
   case.

## 2. Push and inbox Events

Add Quest-level Event types to the Member Notification inbox and FCM. They
follow the ADR 0035 Push rules: data-only, `eventKey` for deduplication, no
localized text.

| `type`                           | Send to                                                             | When                                  |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| `DISPUTE_CASE_FILED_AGAINST_YOU` | the respondent                                                      | A case is filed or opened by an Admin |
| `DISPUTE_CASE_DECIDED`           | the filer and the respondent (and every Team member of a Team case) | An Admin dismisses or resolves it     |

Data payload (strings):

```json
{
  "type": "DISPUTE_CASE_DECIDED",
  "eventKey": "dispute-decided:<caseId>",
  "notificationId": "uuid",
  "questId": "uuid",
  "disputeCaseId": "uuid",
  "status": "DISPUTE_CASE_DISMISSED | DISPUTE_CASE_RESOLVED",
  "viewerWon": "true | false"
}
```

`viewerWon` is the server's answer for this recipient: `true` for the paid
Worker, `false` for the Hirer of a resolved case, and so on. The app writes
the copy from `type`, `status`, and `viewerWon`. The amount stays in the
Quest detail read, not in the Push. The inbox list row (`listMemberNotifications`)
gets the same `questId` plus `status`, so a tap opens `/quest/{questId}`.

## 3. Hirer history badge (optional)

`GET /api/v2/quests/mine` items: add

```json
"disputeSummary": { "pendingCount": 1, "decidedCount": 0 }
```

(`null` when the Quest has no case). The Hirer's My Quests history can then
mark a Quest with a pending or decided case without loading every detail.

## Errors

`POST /api/v1/disputes/{disputeCaseId}/respond` keeps its route and rules.
Name the codes the app must branch on, for example:

| Status | Code                                  | Client action                    |
| ------ | ------------------------------------- | -------------------------------- |
| 403    | `DISPUTE_CASE_NOT_RESPONDENT`         | Show the read-only case.         |
| 409    | `DISPUTE_CASE_RESPONSE_EXISTS`        | Reload; show "Statement sent".   |
| 409    | `DISPUTE_CASE_RESPONSE_WINDOW_CLOSED` | Reload; hide the respond button. |

These names are proposals. Use the server's names if they already exist.

## What the app builds once this lands

- Hirer Quest management and Quest Detail: "Worker {name} filed Dispute Case
  {displayId}", status, a respond form while `canRespond`, and the outcome:
  "Admin dismissed the case" or "Admin paid {amount} to {worker}".
- Worker Work Hub: the same card for a case where the Worker is the
  respondent; the existing result line for a case they filed reads `outcome`
  instead of the extra `getMyQuestDisputeCase` call.
- Inbox rows and Push alerts for the two new types.
