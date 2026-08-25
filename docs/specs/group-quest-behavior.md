# Group Quest Behavior

## GROUP + FIRST_COME_FIRST_SERVED

A Group Quest can admit multiple Workers up to its `headcount`.

- The Quest is `OPEN` after the Hirer publishes it.
- Workers join directly in arrival order.
- A partially filled Quest remains `OPEN` before `startTime` and can accept more Workers.
- No `quest_team` is created.
- Each Worker has a separate Quest Assignment.
- When the number of Workers reaches `headcount`, the Quest becomes `ASSIGNED` and leaves the Quest Board.
- At `startTime`:
  - a full Quest becomes `IN_PROGRESS` automatically;
  - a partially filled Quest becomes `AWAITING_CONSENT`;
  - a Quest with no Worker becomes `UNFILLED`.
- In `AWAITING_CONSENT`, every current Worker must consent to start with the current headcount. If any Worker refuses or Consent is incomplete after 15 minutes, the Quest becomes `UNFILLED` and existing Assignments become `CANCELLED`.

## GROUP + CANDIDATE

A Group Quest uses a team proposal instead of direct individual joining.

- A Quest Team Leader creates a Quest Team.
- Other KU Account Holders join the Quest Team.
- The Quest Team submits one proposal to the Hirer.
- The Hirer selects or rejects the Quest Team as one unit.
- A selected team must fit the Quest's remaining headcount.
- After selection, every team member becomes a Worker and receives a separate Quest Assignment.
- Only this combination creates a `quest_team` and has a Quest Team Leader.
- The team record includes the leader identity (`leaderId`).

## Leadership rule

| Quest type | Leader | Structure |
| --- | --- | --- |
| GROUP + FIRST_COME_FIRST_SERVED | No | Separate Worker Assignments; no team |
| GROUP + CANDIDATE | Yes | Quest Team with a leader; one team proposal |
