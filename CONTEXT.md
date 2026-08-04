# KUQuest Mobile Frontend

Frontend mobile application for KUQuest, a campus-exclusive freelance marketplace for Kasetsart University students and staff.

## Language

### Board & UI Components

**Quest Board**:
The central feed displaying open quests in a high-density Compact Horizontal List Card layout to maximize visibility per screen.
_Avoid_: Job feed, quest list, home page

**Quest Card**:
A compact horizontal card (80–100pt height) on the Quest Board displaying Tag Badge, Quest Type icon (FCFS/Candidate, Solo/Team), Title, countdown timer, location, and payout amount without full descriptions or cover images.
_Avoid_: Job card, feed item, post card

**Tag Chips**:
A horizontally scrollable row of pills on the Quest Board header that allows instant one-click filtering by a single Quest Tag.
_Avoid_: Category buttons, tag list, filter pills

**Filter Sheet**:
A bottom-sheet modal triggered from the Quest Board header for multi-parameter filtering (location, payout range, start time, duration) and sorting order.
_Avoid_: Filter page, search settings, filter drawer

### Quest Creation & Checkout

**Quest Creation Wizard**:
A 3-step mobile flow for creating a quest (Step 1: Basic Info & Scope; Step 2: Acceptance & Conditions including the 3 checkboxes; Step 3: Risk Review & Escrow Checkout).
_Avoid_: Create quest page, quest form, posting screen

**Escrow Checkout**:
The final step of the Quest Creation Wizard where the employer pays 100% of the quest payout into the system escrow wallet before the quest is published on the Quest Board.
_Avoid_: Payment step, deposit screen, pay button

### Quest Lifecycle & Guardrails

**Tiered Cancellation Guardrail**:
A 3-tier context-aware warning modal system that escalates visual severity and interaction friction (button click for 0% penalty, slide-to-cancel for 20% penalty + Red Flag, and keyword typing confirmation for 100% penalty) based on the current lifecycle state of the quest.
_Avoid_: Cancel alert, delete popup, warning modal

