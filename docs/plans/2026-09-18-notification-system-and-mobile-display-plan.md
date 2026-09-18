# Notification System & Mobile Display Engineering Plan

## 1. Problem Statement & User Goal

Currently, neither `KUQuest-API-Server` nor `KUQUest-Mobile` has a notification delivery and presentation system.
When significant domain events happen (e.g., someone applies as a solo candidate, the Hirer selects a candidate, quest state advances to `QUEST_IN_PROGRESS`, proof is submitted, or quest completes), users currently have no way of knowing unless they manually refresh or poll the respective screens.

### Target User Experience

When a user receives and clicks a notification (either an in-app banner or an item in the notification tray):

1. **Immediate Meaningful Context**: They immediately see a short, clear message explaining **what happened, who did it, and to which Quest** (e.g. _"Tanaporn applied to your quest 'Move boxes to dorm 3'"_).
2. **Instant Actionable Routing**: A single tap takes them directly to the relevant action screen (e.g. Candidate Review Sheet, Work Chat, or Proof Review).

---

## 2. Frontend-Optimized Data Contract

To make frontend rendering seamless, the backend must return a **pre-formatted presentation payload**. The mobile app should **not** have to make 3 separate HTTP requests to fetch the actor's profile, the quest title, and the assignment status just to display one notification row or pop-up.

### Notification Object Schema (`GET /api/v2/notifications`)

```typescript
export type NotificationCategory =
  "CANDIDATE" | "QUEST_STATE" | "PROOF" | "CHAT" | "FINANCE";

export type NotificationSeverity = "info" | "success" | "warning" | "neutral";

export interface NotificationAction {
  label: string; // e.g. "Review Candidate", "Open Work Chat", "View Proof"
  route: string; // e.g. "/quest/123e4567-e89b-12d3-a456-426614174000/manage"
  params?: Record<string, string>;
}

export interface NotificationItem {
  id: string; // UUID
  category: NotificationCategory;
  type: string; // Domain event: 'CANDIDATE_APPLIED', 'CANDIDATE_SELECTED', etc.
  severity: NotificationSeverity;

  // Short & meaningful copy for instant display
  title: string; // e.g. "New Candidate Application"
  message: string; // e.g. "Tanaporn applied to your quest 'Move boxes to dorm 3'."

  // Context metadata for the popup sheet
  actor?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;

  quest?: {
    id: string;
    title: string;
    state: string;
  } | null;

  // Deep link action
  action: NotificationAction;

  readAt: string | null; // ISO timestamp or null if unread
  createdAt: string; // ISO timestamp
}
```

---

## 3. Event Catalog & Human-Readable Copy

| Domain Event (`type`) | Category      | Target Recipient       | Title                      | Short Meaningful Message (`message`)                                                  | Action Route              |
| :-------------------- | :------------ | :--------------------- | :------------------------- | :------------------------------------------------------------------------------------ | :------------------------ |
| `CANDIDATE_APPLIED`   | `CANDIDATE`   | **Hirer**              | New Candidate Application  | _"**{actor.displayName}** applied to your quest '**{quest.title}**'."_                | `/quest/{questId}/manage` |
| `CANDIDATE_WITHDRAWN` | `CANDIDATE`   | **Hirer**              | Candidate Withdrawn        | _"**{actor.displayName}** withdrew their application for '**{quest.title}**'."_       | `/quest/{questId}/manage` |
| `CANDIDATE_SELECTED`  | `CANDIDATE`   | **Selected Worker**    | Application Accepted! 🎉   | _"You were selected for '**{quest.title}**'. Tap to open your Work Chat."_            | `/quest/{questId}/work`   |
| `CANDIDATE_REJECTED`  | `CANDIDATE`   | **Other Applicants**   | Application Update         | _"The Hirer selected another candidate for '**{quest.title}**'."_                     | `/quest/{questId}`        |
| `QUEST_IN_PROGRESS`   | `QUEST_STATE` | **Accepted Worker(s)** | Quest Started              | _"'**{quest.title}**' is now in progress. Remember to submit proof before deadline."_ | `/quest/{questId}/work`   |
| `PROOF_SUBMITTED`     | `PROOF`       | **Hirer**              | Proof Submitted for Review | _"**{actor.displayName}** submitted completion proof for '**{quest.title}**'."_       | `/quest/{questId}/proof`  |
| `PROOF_APPROVED`      | `PROOF`       | **Worker(s)**          | Proof Approved! ✅         | _"Hirer approved your work for '**{quest.title}**'. Quest completed!"_                | `/quest/{questId}/work`   |
| `QUEST_COMPLETED`     | `FINANCE`     | **Worker**             | Reward Paid 💰             | _"Reward of ฿{amount} for '**{quest.title}**' has been credited to your Wallet."_     | `/settings` (Wallet)      |
| `QUEST_FAILED`        | `QUEST_STATE` | **All Participants**   | Quest Failed               | _"'**{quest.title}**' failed due to missed deadline. Tap to view details."_           | `/quest/{questId}`        |

---

## 4. Mobile UX & Click Interaction Flow

### A. Notification Tray & List

- Located via a Bell icon in the Top Navigation bar with an unread badge counter.
- Unread items display a subtle indicator dot and bold font.
- Grouped by `Today`, `Yesterday`, and `Earlier`.

### B. Clicking a Notification (The Modal/Sheet Experience)

When the user taps any notification:

1. **Auto-mark as read**: Optimistically mark `readAt = now` and call `PATCH /api/v2/notifications/:id/read`.
2. **Notification Detail Bottom Sheet** (`NotificationDetailSheet.tsx`):
   - **Header**: Icon (colored by `severity`) + `title` + time elapsed (e.g. "5m ago").
   - **Avatar & Actor**: Displays the sender's avatar and display name.
   - **Detailed Message**:
     > _"Tanaporn applied to your quest **Move boxes to dorm 3**._  
     > _You have 2 pending applicants waiting for your review."_
   - **Primary CTA**: Styled button using `action.label` (e.g. **"Review Candidates"**). Tapping directly navigates to `action.route`.
   - **Secondary CTA**: **"Dismiss"** (closes sheet).
3. **Push Notification Direct Tap**:
   - If user opens from the OS Notification Shade (FCM), app launches and navigates directly to `action.route`.

---

## 5. Backend Implementation Specifications (`KUQuest-API-Server`)

### Database Table (`src/database/schema/notification.schema.ts`)

```typescript
export const notificationTable = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => authUser.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    category: text("category").notNull(), // 'CANDIDATE' | 'QUEST_STATE' | ...
    severity: text("severity").notNull().default("info"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    actionRoute: text("action_route").notNull(),
    actionLabel: text("action_label").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notification_recipient_read_idx").on(
      table.recipientId,
      table.readAt
    ),
    index("notification_recipient_created_idx").on(
      table.recipientId,
      table.createdAt
    ),
  ]
);
```

### Endpoints (`src/modules/notification/notification.route.ts`)

1. `GET /api/v2/notifications` — Paginated list of user notifications.
2. `GET /api/v2/notifications/unread-count` — Light check for badge.
3. `PATCH /api/v2/notifications/:id/read` — Mark single notification read.
4. `POST /api/v2/notifications/mark-all-read` — Mark all notifications read.
5. `POST /api/v2/notifications/devices` — Register FCM token (ADR 0017/0018).
6. `DELETE /api/v2/notifications/devices/:token` — Unregister token on logout.

### Service Trigger Hooks

In `src/modules/quest/quest-candidate-v2.service.ts`:

- Inside `createQuestV2CandidateApplication`:
  ```typescript
  await createNotification({
    recipientId: quest.hirerId,
    actorId: memberId,
    type: "CANDIDATE_APPLIED",
    category: "CANDIDATE",
    severity: "info",
    title: "New Candidate Application",
    message: `${applicantName} applied to your quest '${quest.title}'.`,
    actionRoute: `/quest/${quest.id}/manage`,
    actionLabel: "Review Candidates",
    resourceType: "QUEST",
    resourceId: quest.id,
  });
  ```
- Inside `selectQuestV2CandidateApplication`:
  - Create `CANDIDATE_SELECTED` for the selected worker.
  - Create `CANDIDATE_REJECTED` for all other applicants.

---

## 6. Verification Checklist

1. [ ] **Unit Tests**:
   - `NotificationApi.test.ts`: Verify fetch, read mark, unread count parsing.
   - `NotificationDetailSheet.test.tsx`: Verify rendering message, title, actor, and navigation button.
2. [ ] **Integration Tests**:
   - Verify applying to a quest inserts a notification row for the Hirer.
   - Verify selecting a candidate triggers notifications to selected and rejected candidates.
3. [ ] **Mobile UI Smoke Verification**:
   - Bell badge updates dynamically when unread count changes.
   - Clicking item opens detail sheet with the short message.
   - Clicking primary button routes cleanly to `/quest/:id/manage` or `/quest/:id/work`.
