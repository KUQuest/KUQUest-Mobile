---
version: 1
slug: "src-features-home-homescreen-tsx"
primary_target: "src/features/home/HomeScreen.tsx"
related_targets: []
---

# Hirer Home

Mode: Operate

Audience: A Member currently acting as a Hirer.
Job: Scan active Quests, understand each Worker’s progress, and open Quest details.
Primary action: Open Quest details from the progress card.
Constraints: Native Android/iOS, Thai and English, safe-area aware, existing Green Noticeboard system, no fabricated production evidence.

## Direction contract

THESIS: Hirer Home is an active-work noticeboard, not a generic dashboard. It puts one real decision in reach: understand the current Quest and open its details.

OWN-WORLD: Extend KUQuest’s warm paper canvas, deep green identity, rounded 16px content surfaces, compact typography, and calm elevation. Translate the supplied card’s navy outline, pale mint Worker panel, green completed stages, orange current stage, and restrained cream footer into the existing token system without adding decorative gradients or unrelated chrome.

STORY: The Hirer sees a Quest title and lifecycle status first, identifies the Worker and can open their public profile, reads progress from left-to-right content and top-to-bottom timeline, then opens Quest details. The card uses localized human labels; internal Quest states never appear as raw enum names.

FIRST VIEWPORT: A safe-area-aware scroll surface with a concise Hirer Home title, one prominent data-driven progress card, and enough bottom clearance for the existing floating navigation. The card keeps the screenshot hierarchy: status/title/action, Worker identity beside a five-step timeline, then due date and detail action.

FORM: A reusable HirerQuestProgressCard inside a Hirer Home screen. The supplied screenshot is the pinned composition, so no concept-seed tournament is run; the component’s state projection carries all seven canonical Quest states while the first fixture shows QUEST_IN_PROGRESS.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
