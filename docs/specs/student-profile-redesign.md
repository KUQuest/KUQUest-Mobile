# Student Profile redesign for mobile

## Problem Statement

As a Student, I currently see the Student Profile as one long vertically stacked page with a generic branded top bar. The current presentation makes it harder to move between About, Experience, Portfolio Work, Certificates, and Reviews, and it does not match the approved mobile profile mockup. The profile header also lacks the mockup's clearer identity hierarchy and the statistics card does not expose Reviews as a first-class summary value.

The current edit flow additionally presents Occupation and Student ID as editable fields without persisting those changes through Academic Registration. This can make a Student believe a change was saved when it was silently discarded.

## Solution

Replace the current Student Profile presentation with the approved mobile mockup direction while preserving the existing API boundary, public-profile scope, localization, accessibility, and profile data behavior.

The Student Profile will use a profile-owned branded header, a compact identity card, a three-value statistics card, and sticky tabs for About, Experience, My Works, Certificates, and Reviews. Only the selected section will be shown at a time. Certificates and Portfolio Work will use responsive card grids, Experience will retain its chronological timeline, and Reviews will retain its existing rating distribution and filters.

The authenticated app will show the KUQuest logo only on primary tab destinations. Detail and form screens will use compact contextual headers. The existing real API remains the default data source; explicit demo mode will provide mockup-like profile, avatar, certificate, and work data for visual QA.

Edit mode will persist Occupation and Student ID through the existing Academic Registration API rather than silently dropping those changes.

## User Stories

1. As a Student, I want to open my Student Profile from the authenticated primary navigation, so that I can review and manage my public profile.
2. As a Student, I want to see my avatar and display name prominently, so that I can immediately confirm whose profile I am viewing.
3. As a Student, I want to see my Occupation, Faculty, and Department in the profile header, so that my academic and professional context is clear.
4. As a Student, I want to see my selected profile tags in the header, so that relevant skills and interests are easy to scan.
5. As a Student, I want the profile header to use the approved KUQuest branding, so that the screen feels consistent with the product identity.
6. As a Student, I want one clear Edit Profile action, so that I know how to update my information.
7. As a Student, I want the profile header to avoid undefined Share and overflow actions, so that every visible control has a reliable behavior.
8. As a Student, I want to see my Profile Rating, completed Quest count, and Review count together, so that I can understand my reputation at a glance.
9. As a Student, I want to switch between About, Experience, My Works, Certificates, and Reviews with tabs, so that I can reach the information I need without scrolling through unrelated sections.
10. As a Student, I want the About tab to be the default tab, so that the profile opens with a general introduction.
11. As a Student, I want the selected profile tab to remain visible while its content scrolls, so that I can switch sections without returning to the top.
12. As a Student, I want the About tab to show my profile description or a clear empty state, so that missing content is understandable.
13. As a Student, I want Experience entries displayed in chronological timeline form, so that my background is easy to follow.
14. As a Student, I want Experience entries to retain their employment type, organization, dates, description, and Present state, so that the redesign does not remove useful context.
15. As a Student, I want My Works displayed as scannable cards, so that I can browse my Portfolio Work efficiently.
16. As a Student, I want Portfolio Work cards to show an image fallback when an image is unavailable, so that text-only work remains usable.
17. As a Student, I want Certificates displayed in a responsive card grid, so that multiple certificates can be compared without a long list of sparse rows.
18. As a Student, I want each Certificate card to show its image, name, issuer, and issued year, so that the summary is useful before opening the preview.
19. As a Student, I want to tap anywhere on a Certificate card to preview the certificate image, so that the interaction target is easy to discover.
20. As a Student, I want certificate previews to be dismissible and accessible, so that the preview does not trap me in a modal.
21. As a Student, I want Reviews to retain rating filters, so that I can inspect feedback by star rating.
22. As a Student, I want Reviews to retain the rating summary and distribution, so that individual feedback is presented in reputation context.
23. As a Student, I want loading states to be visible while profile data is being retrieved, so that I know the screen is working.
24. As a Student, I want empty states for sections without data, so that an empty profile section is not confused with a loading or failure state.
25. As a Student, I want a failed optional section to explain that it is temporarily unavailable and offer retry, so that one endpoint failure does not hide the rest of my profile.
26. As a Student, I want a failed required profile load to provide a clear retry action, so that I can recover without restarting the app.
27. As a Student, I want an expired session to sign me out and return me to Sign-in, so that the profile does not expose stale or unauthorized data.
28. As a Student, I want image-load failures to show useful fallbacks, so that broken remote media does not break the layout.
29. As a Student, I want the profile to remain usable at large font scales, so that text and controls are not clipped or hidden.
30. As a Student using a narrow phone, I want Certificate and Portfolio Work cards to collapse to a readable layout, so that content remains accessible on small screens.
31. As a Student using iOS or Android, I want safe-area and bottom-navigation spacing to remain correct, so that content and controls are not obscured by system UI.
32. As a Thai-speaking Student, I want the redesigned profile to retain localized labels and messages, so that the redesign does not change the system-locale-only language behavior.
33. As a Student, I want the primary navigation to retain its five destinations and active state, so that the redesign does not change how I move around the authenticated app.
34. As a Student, I want primary destinations to retain a clear KUQuest brand anchor, so that the app remains recognizable without repeating the logo on every screen.
35. As a Student, I want Quest Detail and form screens to use compact contextual headers, so that those screens reserve more space for their task content.
36. As a Student, I want the Create destination to retain its prominent central action, so that the approved primary-navigation hierarchy remains intact.
37. As a Student editing my profile, I want changes to Occupation to be persisted, so that the value shown after saving matches my choice.
38. As a Student editing my profile, I want changes to Student ID to be persisted through Academic Registration, so that required academic identity data is not silently lost.
39. As a Student editing my profile, I want a partial-save failure to preserve the draft and explain what happened, so that I can retry without re-entering unrelated information.
40. As a developer, I want the real API to remain the default profile data source, so that production never silently substitutes fake profile records.
41. As a developer, I want explicit demo mode to provide mockup-like profile data, so that the visual redesign can be reviewed without depending on seeded production data.
42. As a tester, I want populated, loading, empty, degraded, error, retry, and media-failure states represented in tests, so that the redesign is verified beyond the happy path.
43. As a tester, I want iOS and Android screenshots checked against the provided mockup direction, so that layout regressions are visible before QA handoff.

## Implementation Decisions

- Replace the current vertically stacked Student Profile presentation with a tabbed profile presentation.
- Use About as the default selected tab. Keep the selected tab as local screen state; deep-linking individual profile tabs is not part of this change.
- Keep the profile header owned by the Student Profile presentation rather than treating it as a generic global header.
- The profile header includes the KUQuest logo, avatar, display name, Occupation, Faculty, Department, selected tags, and Edit Profile action. University and Academic Year are not shown in the new header unless the reference design is later expanded to include them.
- Do not include Share Profile or an overflow menu until a public profile route and concrete actions exist.
- Add a three-column statistics presentation for Profile Rating, completed Quest count, and Review count. Continue to use the existing reputation data; retain rating distribution inside Reviews.
- Keep the existing public Student Profile boundary. Telephone and Student ID remain excluded from the public display even though they are available to Academic Registration editing.
- Render only the selected profile section while retaining the existing section data model and API reads.
- Keep the tab strip visible while section content scrolls, subject to native platform and safe-area behavior.
- Present Certificates as responsive cards with certificate image, name, issuer, and issued year. The full card opens the existing certificate preview behavior.
- Present Portfolio Work as a responsive card grid with image fallback behavior.
- Retain Experience as a newest-started-first chronological timeline with employment type and existing date semantics.
- Retain Reviews rating filters, rating summary, distribution, review count, review dates, reviewer identity, comments, and Quest titles.
- Keep the existing optional-read policy: the required Profile record is required for the screen; optional section failures produce section-level degraded states; unsupported optional endpoints produce honest empty states; demo fixtures are used only when explicit demo mode is enabled.
- Expand demo fixtures to include an approved local placeholder avatar, Certificate records with local placeholder images, and Portfolio Work records. The provided screenshot is the visual reference; unknown or unapproved screenshot media is not embedded as production content.
- Use real API data by default. `EXPO_PUBLIC_PROFILE_DEMO` remains the explicit switch for visual QA fixtures.
- Keep the existing KUQuest theme tokens, NativeWind styling boundary, typography, colors, spacing language, and Lucide icon system. Do not introduce a competing design-token source.
- Show the KUQuest logo on primary authenticated tab destinations: Quest Board, My Quests, Chat, and Student Profile. Create, Quest Detail, and other task/form screens use compact contextual headers instead of repeating the logo.
- Preserve existing route names and navigation semantics. The visible My Quests label may follow the approved mockup's shorter `Quests` wording without renaming its route or domain concept.
- Keep the five-destination authenticated navigation model and central Create action from the authenticated-navigation ADR.
- In edit mode, persist Occupation and Student ID through the existing Academic Registration update operation. Keep Profile-owned fields on the existing Profile update operation and do not silently discard values shown as editable.
- Preserve existing partial-save recovery and duplicate-prevention behavior for certificates, Portfolio Work, Experience, avatar uploads, and retries.
- Support iOS and Android, including narrow phones, larger phones, safe areas, and increased font scales. Web parity is not a required target for this redesign.
- Replace the current presentation directly rather than introducing a production feature flag. Demo mode is for data fixtures and visual QA only.
- Treat the existing rendered screen and component boundaries as the implementation seams. No new production abstraction is required solely to test the redesign.

## Testing Decisions

- Tests should assert observable Student behavior: visible content, selected tabs, accessibility semantics, press interactions, loading/error/empty states, retry behavior, media fallbacks, navigation intent, and persistence calls. Tests should not assert exact Tailwind class strings or private component structure.
- The highest presentation seam is the rendered Profile screen with its profile-data loader mocked. It should cover the new header, three-column statistics, tab selection, section rendering, responsive card presentation, Certificate preview interaction, and required/optional loading states.
- Reuse the existing Student Profile component test prior art for Profile Header, Profile Stats, Experience, My Works, Certificates, Reviews, and image fallback behavior. Move assertions toward user-visible outcomes as the tabbed layout is introduced.
- Reuse the existing profile view-data tests for tag selection, Experience sorting, API-to-view mapping, optional endpoint failures, unsupported endpoints, and explicit demo-mode fallback behavior.
- Extend demo fixture tests to prove that real data remains authoritative by default and that mockup-like avatar, Certificate, and Portfolio Work data appears only when demo mode is enabled.
- Reuse the existing Academic Registration/edit-flow screen seam to change Occupation and Student ID in edit mode and assert the Academic Registration persistence operation receives the selected values.
- Extend Profile Persistence Coordinator tests to cover successful edit-mode Academic Registration persistence, partial failure recovery, and no duplicate writes on retry.
- Reuse the existing BottomNav tests to cover the approved labels, selected state, accessibility roles, central Create action, and preserved route destinations.
- Keep responsive layout metric tests for narrow and standard widths. Add assertions for the Certificate/Portfolio grid breakpoint and font-scale-safe layout behavior where a pure metric seam exists.
- Keep StudentApi contract tests focused on existing Profile, Academic Registration, reputation, reviews, Certificate, Portfolio Work, Experience, upload, and error boundaries. Do not add new backend endpoints for this redesign.
- Run the full Jest suite, TypeScript typecheck, and Expo lint after implementation.
- Perform manual device QA on at least one iOS device/simulator and one Android device/emulator, including a narrow phone, large font scale, safe-area insets, scrolling, modal dismissal, failed remote images, degraded optional sections, and session expiry handling.
- Capture before/after or target comparison screenshots using demo mode, with the provided profile mockup as the visual reference.

## Out of Scope

- Creating a public Student Profile route or implementing Share Profile.
- Adding or changing backend Profile, reputation, review, Certificate, Portfolio Work, or Experience endpoints.
- Changing the public Student Profile domain boundary or exposing telephone or Student ID publicly.
- Redesigning Sign-in or Academic Registration branding and layouts.
- Changing Quest Board, Quest Detail, Quest Application, Quest creation, cancellation, or chat behavior.
- Changing the authenticated five-destination route structure or central Create navigation behavior.
- Adding deep links for individual profile tabs.
- Adding a production feature flag for the new profile presentation.
- Using unapproved screenshot certificate/avatar assets in production or demo fixtures.
- Web visual parity, unless separately specified.
- Introducing a new styling framework or competing design-token source.
- Adding a new E2E framework or visual-regression service solely for this redesign.

## Further Notes

- The visual reference is the iPhone Student Profile mockup provided during planning. It shows the Certificates tab, but About remains the approved default tab.
- The current profile implementation already has API mapping, optional section degradation, certificate preview behavior, Experience sorting, review filters, responsive metrics, and demo-mode foundations. The redesign should deepen those existing seams instead of replacing them.
- The current demo fixture set needs additional Certificate, Portfolio Work, and avatar data to make the mockup reproducible during QA.
- The existing domain decisions remain authoritative: Student Profile is a public trust and discovery surface; Academic Registration is a separate record; the authenticated primary navigation remains persistent; and server-owned data must not be silently replaced by local fallback data.
- The current working tree contains pre-existing uncommitted changes outside this spec. Implementation should begin from the agent's agreed branch state and avoid overwriting unrelated work.
