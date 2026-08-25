# Quest State Summary for Frontend

## State model

A Quest has one Quest Lifecycle State. The state determines whether the Quest appears on the Quest Board and whether it can accept additional Workers.

| State | Meaning | Quest Board | Accept additional Worker |
| --- | --- | --- | --- |
| `DRAFT` | The Hirer is creating or editing the Quest. | No | No |
| `OPEN` | The Hirer has published the Quest and it is waiting for Workers. | Yes | Yes |
| `ASSIGNED` | The Quest has Workers equal to its headcount. | No | No |
| `AWAITING_CONSENT` | The start time has arrived, the Quest has some but not all possible Workers, and the Quest is waiting for Consent. | No | No |
| `IN_PROGRESS` | The Quest has started with its current Workers. | No | No |
| `UNFILLED` | The Quest cannot start. | No | No |

## Flow

```text
DRAFT
  └─ Hirer publishes
       ↓
OPEN
  ├─ Workers reach headcount
  │    ↓
  │  ASSIGNED
  │    ↓ at start time
  │  IN_PROGRESS
  │
  ├─ Start time arrives with no Worker
  │    ↓
  │  UNFILLED
  │
  └─ Start time arrives with some, but not all, possible Workers
       ↓
     AWAITING_CONSENT
       ├─ All current Workers give Consent
       │    ↓
       │  IN_PROGRESS
       │
       └─ A Worker refuses Consent, or Consent is incomplete after 15 minutes
            ↓
          UNFILLED
```

## Rules

- `headcount` is the maximum number of Workers. It is not a minimum.
- A Quest with 2 of 4 Workers remains `OPEN` before its start time.
- At the start time:
  - a full Quest enters `IN_PROGRESS`;
  - a partially filled Quest enters `AWAITING_CONSENT`;
  - a Quest with no Worker enters `UNFILLED`.
- Worker Consent allows the Quest to start with the current Workers even when headcount is not full.
- When a Quest becomes `UNFILLED`, its existing Quest Assignments become `CANCELLED`.
- `AWAITING_CONSENT` and `UNFILLED` are frontend-supported states.
- A Quest Card appears on the Quest Board only when the Quest is `OPEN`.
