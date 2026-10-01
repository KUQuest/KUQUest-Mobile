# Candidate Team Staging Findings

## Verified staging state

- Quest `01045b36-1f70-4d51-8685-5f3fde7a097b` is open, Candidate + Group, with start time `2026-10-02T18:30:00.000+07:00`.
- Candidate Team `56f04709-6cfa-4485-8f3b-55082765892c` (`BlueTeamSmoke`) was submitted as `TEAM_SUBMITTED` with two members, a proposal note, and one image attachment.
- As the team member, staging test account 2 received `200` from both `GET /api/v2/quests/{questId}/teams` and `GET /api/v2/quests/{questId}/teams/{teamId}`. The response shapes validate against the mobile Zod contracts.
- As Hirer, the earlier staging check received `200` from the Candidate Team collection and detail reads.
- A fresh Google Worker can read `GET /api/v2/quests/{questId}/public`. Its `404` from `GET /api/v2/quests/{questId}` is consistent with OpenAPI, which limits that detail route to the authenticated Hirer. A non-member's team-list `404` is also consistent with the listed Hirer/Team Member permissions.

## Mobile behavior and contract notes

- The Hirer candidate review correctly filters out `TEAM_FORMING`; it should show no reviewable proposals until the team submits with the required member count.
- The mobile production flow calls `listCandidateTeams`. The separate `getCandidateTeam` method is exposed by `QuestApi` and `liveQuestService`, but has no production call site. The collection response already contains team membership and submission fields; member profiles and proposal file links are read through their own endpoints. Do not add a duplicate detail request without a product or contract requirement.
- Native staging flow completed on two emulators and the physical Google Worker phone: the second Worker joined by invite, the leader submitted the full team, and the Hirer Candidate Review changed from zero proposals to one. The sheet showed the team, note, and both member names; opening the attached image returned `200` and displayed it. The Hirer did not select or accept the candidate.
- The app's submit error UI was moved next to the Step 3 introduction. Duplicate Student ID errors now unwrap the persistence error, map `STUDENT_ID_ALREADY_EXISTS` to localized copy, and retain the form for retry.
- A development warning on the proposal panel's theme-variable spacing class was fixed with `will-change-variable`; the post-change device log scan did not show the warning again.
- `scripts/find-quest.js` now accepts both supported collection envelopes and reports failed HTTP responses instead of miscounting proposals as zero.
- `scripts/android-ui.sh` and the `android-device-quick` skill provide unique-match semantic ADB find/tap, dump, text entry, swipe, and log commands for future native checks.
- `docs/agents/routing.md` points to `docs/specs/group-quest-behavior.md`, but that spec file is absent. Resolve the mobile domain-spec gap before changing Candidate Team visibility or lifecycle behavior.

## Backend work

No missing Candidate Team route was found in this pass. Existing list and per-team detail routes are present, authorized Hirer reads return `200`, and the mobile contracts accept their response shapes. No backend endpoint request is queued by this note.

## Test data

The synthetic Student ID `6712345678` was already present in staging and correctly returned `409 STUDENT_ID_ALREADY_EXISTS`. The supplied test ID `6710504444` succeeded. Use a known-unused Student ID for future staging registrations.
