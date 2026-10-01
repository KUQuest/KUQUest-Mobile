# HTTPS Candidate Team Invites Implementation Plan

> **For Claude:** Use the `executing-plans` skill to execute this plan task-by-task.

**Goal:** Share an HTTPS Candidate Team invitation on `kuquest-dev-api.kubits.org` that opens the installed KUQuest app at an explicit Join Team screen and remains usable as a browser landing page otherwise.

**Architecture:** The API serves `/invite/team` and the Android/iOS association documents from the existing origin. Expo declares the origin as an Android App Link and iOS Universal Link, and a dedicated invite route retains the Quest ID and Join Code through authentication/onboarding before presenting an explicit join action. The Server remains authoritative for code validity and team membership.

**Tech Stack:** Expo SDK 57 / Expo Router / React Native; Elysia + Bun; Android App Links `assetlinks.json`; Apple Associated Domains `apple-app-site-association`.

**Implementation status:** Implemented on both feature branches. API and mobile focused checks pass; the API association endpoints intentionally remain unavailable until real deployment identifiers and Android signing fingerprints are configured.

**Remaining acceptance gate:** Deploy the API changes and association documents, build/install the updated native development app, and verify an actual Android/iOS link open plus two-member join. The current staging domain had no association documents during investigation, and the required signing/Apple identifiers were unavailable; Android preflight also found an unhealthy, unknown-owner listener on Metro port `6767`, which was left untouched. No App Link or device-smoke claim is made.

---

### Task 1: API invite landing and association endpoints

**Repository:** `../KUQuest-API-Server-https-team-invites` (branch `slowyier/feat/https-team-invites`, based on fetched `origin/develop` `e6bd600`). The sibling `KUQuest-API-Server` checkout has unrelated uncommitted work; preserve it.

**Files:**

- Create: `src/modules/team-invite/team-invite.route.ts` and `src/modules/team-invite/team-invite.config.ts`
- Modify: `src/app.ts`, `src/config/env.ts`, `.env.example`, and `SETUP.md`
- Create: `public/invite/team.html`, `public/invite/team.css`, and `public/invite/team.js`
- Create: `tests/modules/team-invite/team-invite.integration.test.ts`

**Behavior:** `GET /invite/team` returns an accessible fallback page. `GET /.well-known/assetlinks.json` and `GET /.well-known/apple-app-site-association` return their exact JSON media types and valid association documents from deployment-supplied package/certificate and Apple app identifiers. Missing association configuration returns a clear unavailable response; never publish placeholder IDs or fingerprints. Preserve `/`, `/api/*`, and existing test-bench assets.

**Test:** Elysia HTTP integration tests assert success content types, exact generated association shapes from explicit test config, missing-config behavior, and no reflection of untrusted query text into HTML.

### Task 2: Mobile verified-link configuration and invite route

**Repository:** `KUQUest-Mobile` (branch `slowyier/feat/https-team-invites`, current `develop` was fast-forwarded and already up to date).

**Files:**

- Modify: `app.config.ts` and `app.config.test.ts`
- Modify: `src/features/questBoard/teamAssemble/teamInvite.ts`, `TeamAssembleView.tsx`, and `TeamAssembleJoinTeamPanel.tsx`
- Create: `src/app/invite/team.tsx` and `src/features/questBoard/teamAssemble/TeamInviteLandingScreen.tsx`
- Add adjacent invite, auth, storage, and join-panel behavior tests

The API host is derived from the app's `EXPO_PUBLIC_API_URL` only when it is HTTPS. Android registers an auto-verified filter and iOS registers the associated domain for `/invite/team`. Generated links use the HTTPS origin and include encoded `questId`, `teamId`, and `code`; no custom-scheme fallback is shared. The route requires an explicit **Join team** action and never joins merely because a link opened.

### Task 3: Preserve invite through sign-in and Academic Registration

**Files:**

- Modify: `src/features/auth/AuthMiddleware.tsx`, `src/features/auth/AuthGate.tsx`, and `src/features/auth/sessionQueries.ts`, with adjacent tests
- Modify: onboarding route/controller and adjacent tests only where required

Add feature-owned pending-invite state in Zustand with secure persistence so authentication can return to the invite after sign-in and Academic Registration. Unauthenticated invitees remain on the invite screen until they choose sign-in; do not redirect an invite to Home and lose its parameters. Consume and clear pending invite state when a fully registered user returns to it.

### Task 4: Operational configuration and verification

Document the exact deployment variables for Android package/certificate fingerprints and Apple Team/bundle identifiers in API setup documentation. Do not claim App Link verification until the domain serves both association files and Android/iOS devices confirm the association. Run API integration tests, mobile focused tests, mobile typecheck, API typecheck/tests, then exercise a tap from a separate Android app into the development build and complete a two-Member join with a current Join Code. Record missing release-signing/Apple identifiers as blockers rather than substituting debug values.
