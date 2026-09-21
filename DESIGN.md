---
name: KUQuest
description: A trusted community job board for people with @ku.th accounts.
colors:
  # Brand
  primary: "#5F7655"
  primary-dark: "#465B3E"
  primary-deep: "#34462F"
  primary-subtle: "#EDF2EA"
  primary-border: "#B6C4AF"
  on-primary: "#FFFFFF"

  support: "#755570"
  support-dark: "#5D4058"
  support-deep: "#463143"
  support-subtle: "#F3ECF2"
  support-border: "#B79AAF"
  on-support: "#FFFFFF"

  # Neutral
  background: "#F7F9F8"
  surface: "#FFFFFF"
  surface-raised: "#F0F3F1"
  surface-high: "#E7ECE8"
  text-strong: "#18201B"
  text: "#273029"
  text-secondary: "#5F6962"
  text-muted: "#737D76"
  border: "#D5DDD7"
  divider: "#DDE3DF"

  # Supporting accents
  cream: "#F6EFE6"
  gold: "#C8953D"
  terracotta: "#9C634D"
  rose: "#C88C9B"

  # Semantic
  success: "#21864F"
  warning: "#B7791F"
  danger: "#C13D43"
  info: "#356CA5"

  # Dark mode
  dark:
    background: "#101713"
    surface: "#172019"
    surface-raised: "#1E2A22"
    surface-high: "#27342B"

    primary: "#A9C79E"
    primary-dark: "#7FA273"
    primary-deep: "#5F7655"
    primary-subtle: "#243128"
    primary-border: "#526B58"
    on-primary: "#142019"

    support: "#D8B4D0"
    support-dark: "#BE91B5"
    support-deep: "#966B8F"
    support-subtle: "#342832"
    support-border: "#72556D"
    on-support: "#21171F"

    text-strong: "#F2F5F2"
    text: "#E3E9E4"
    text-secondary: "#B4BDB6"
    text-muted: "#919C94"
    border: "#3A4940"
    divider: "#334039"

    cream: "#302B24"
    gold: "#E3BB70"
    terracotta: "#DA9A80"
    rose: "#DBA7B4"

    success: "#62C88B"
    warning: "#E4B45A"
    danger: "#EF777B"
    info: "#75A8DA"
typography:
  display:
    fontFamily: "KuriousSemiBold, sans-serif"
    fontSize: "44px"
    fontWeight: 600
  headline:
    fontFamily: "KuriousSemiBold, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "38px"
  title:
    fontFamily: "KuriousSemiBold, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "29px"
  body:
    fontFamily: "KuriousMedium, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-small:
    fontFamily: "KuriousMedium, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "21px"
  label:
    fontFamily: "KuriousMedium, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
  label-strong:
    fontFamily: "KuriousSemiBold, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "18px"
rounded:
  field: "8px"
  image: "10px"
  image-large: "12px"
  card: "16px"
  search: "18px"
  sheet: "24px"
  navigation: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 16px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 16px"
    height: "48px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "48px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.search}"
    padding: "8px 16px"
    height: "56px"
  quest-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.card}"
    padding: "16px"
  filter-chip:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
    height: "32px"
  bottom-navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.navigation}"
    padding: "4px 6px"
    height: "68px"
---

# Design System: KUQuest — Organic Editorial Mobile UI

## Overview

**Creative North Star: "The Organic Editorial Campus Noticeboard"**

KUQuest is a trusted community opportunity platform for students, faculty, and staff with `@ku.th` accounts. Its visual language merges the grounded, warm authority of an **editorial lifestyle publication** with the calm, human warmth of an **organic product UI**. Rather than feeling like a sterile corporate dashboard, a transactional gig app, or a bright neon gamified tool, KUQuest feels like an intentional print-and-digital campus gazette: thoughtful, clear, and rooted in natural campus life.

The system is defined by:

- **Calm, neutral-dominant canvases**: 60–70% of any screen is clean, breathable neutral ground.
- **Organic forest sage primary identity**: `#5F7655` anchors the app in Kasetsart's agricultural and campus heritage.
- **Deep plum supporting identity**: `#755570` provides a sophisticated editorial companion for special moments, secondary actions, and badges.
- **Earthy supporting accents**: Cream (`#F6EFE6`), Gold (`#C8953D`), Terracotta (`#9C634D`), and Rose (`#C88C9B`) add deliberate warmth to cards, wallet surfaces, and empty states.
- **Editorial typography and whitespace**: Strong headings, expressive section titles, and generous asymmetrical compositions paired with highly readable, scannable UI labels.
- **Quiet cards and soft geometry**: Surfaces sit naturally on the canvas with subtle borders and minimal shadows rather than heavy elevation.
- **Intentional color blocking**: Single dominant color moments per flow (such as a full-bleed onboarding screen, a colored profile hero, or a tinted header) rather than a scatter of colored badges.

---

## Colors & Hierarchy

### Brand Colors

- **Primary (`#5F7655` light / `#A9C79E` dark)**: The primary brand color. Used for primary buttons, active navigation indicators, key highlights, and selected states.
  - `primary-dark`: `#465B3E` light / `#7FA273` dark
  - `primary-deep`: `#34462F` light / `#5F7655` dark
  - `primary-subtle`: `#EDF2EA` light / `#243128` dark (surface tint for active chips, avatar backdrops, and highlights)
  - `primary-border`: `#B6C4AF` light / `#526B58` dark
  - `on-primary`: `#FFFFFF` light / `#142019` dark
- **Support (`#755570` light / `#D8B4D0` dark)**: Sophisticated plum tone for supporting accents, secondary badges, and editorial highlights.
  - `support-dark`: `#5D4058` light / `#BE91B5` dark
  - `support-deep`: `#463143` light / `#966B8F` dark
  - `support-subtle`: `#F3ECF2` light / `#342832` dark
  - `support-border`: `#B79AAF` light / `#72556D` dark
  - `on-support`: `#FFFFFF` light / `#21171F` dark

### Neutral Surfaces & Typography

- **Background (`#F7F9F8` light / `#101713` dark)**: The canvas foundation. Soft off-white light; deep organic green-black dark.
- **Surface (`#FFFFFF` light / `#172019` dark)**: Primary card, modal, and sheet background.
- **Surface Raised (`#F0F3F1` light / `#1E2A22` dark)**: Secondary card surface, grouped list items, pressed states, and chip backgrounds.
- **Surface High (`#E7ECE8` light / `#27342B` dark)**: Modals, active search bars, and elevated floating panels.
- **Text Strong (`#18201B` light / `#F2F5F2` dark)**: Display headings, Quest titles, and primary numbers.
- **Text (`#273029` light / `#E3E9E4` dark)**: Primary body text and readable descriptions.
- **Text Secondary (`#5F6962` light / `#B4BDB6` dark)**: Supporting copy, timestamps, and metadata.
- **Text Muted (`#737D76` light / `#919C94` dark)**: Field labels, inactive placeholders, and helper text.
- **Border (`#D5DDD7` light / `#3A4940` dark)**: Quiet structural borders for inputs, cards, and dividers.
- **Divider (`#DDE3DF` light / `#334039` dark)**: Subtle list item dividers.

### Supporting Accents (Warm & Organic)

- **Cream (`#F6EFE6` light / `#302B24` dark)**: Warm paper-like surface for onboarding cards, callouts, and quote blocks.
- **Gold (`#C8953D` light / `#E3BB70` dark)**: Rewards, earnings, star ratings, and financial badges.
- **Terracotta (`#9C634D` light / `#DA9A80` dark)**: Earthy accent for illustrations, creative tags, and profile banners.
- **Rose (`#C88C9B` light / `#DBA7B4` dark)**: Gentle accent for social moments, community inquiries, and heart/favorite cues.

### Semantic Status

- **Success (`#21864F` light / `#62C88B` dark)**: Completed quests, verified badges, positive balances.
- **Warning (`#B7791F` light / `#E4B45A` dark)**: Due soon alerts, pending settlements, dispute warnings.
- **Danger (`#C13D43` light / `#EF777B` dark)**: Errors, failed quests, cancellations, destructive actions.
- **Info (`#356CA5` light / `#75A8DA` dark)**: Instructional notices and system announcements.

### Palette Balance Rule (60-30-10)

1. **60–70% Neutral**: Clean canvas (`#F7F9F8` / `#101713`) and white/layered surfaces let content breathe.
2. **20–30% Primary Brand Family**: `#5F7655` and its subtle tints guide focus to main actions, tags, and progress.
3. **5–10% Supporting / Accent**: Cream, Gold, Plum, and Terracotta serve as deliberate accents, never overwhelming the page.

---

## Typography & Editorial Voice

**Display Font:** `KuriousSemiBold` (with clean sans-serif fallback)
**Body Font:** `KuriousMedium` (with clean sans-serif fallback)

### Hierarchy

- **Display (44px / 52px)**: Expressive editorial moments — onboarding headlines, sign-in welcome, zero-state heroes.
- **Headline (30px / 38px)**: Major flow titles (Create Quest, Wallet, Profile Overview).
- **Title (24px / 29px)**: Section headers, Quest titles in detail view, reward amounts.
- **Body (16px / 24px)**: Primary interactive controls, search inputs, description paragraphs.
- **Body Small (14px / 21px)**: Quest card titles, form field labels, metadata rows.
- **Label (12px / 18px)**: Status badges, category chips, bottom tab labels, small timestamps.

### Editorial Guidelines

- **Expressive contrast**: Combine bold display sizes with generous margins to give screens an editorial magazine feel.
- **Weight before color**: Establish clarity using size and weight before adding color.
- **Uncluttered copy**: Terse, honest, community-oriented phrases. Avoid hype, marketing fluff, or generic gig language ("Gigs", "Bids"). Use domain terms from `CONTEXT.md`: **Quest**, **Reward**, **Hirer**, **Worker**, **Proof**, **Review**.

---

## Shapes & Geometry

- **Inputs & Fields**: `8px` (`rounded-field`) — clean, structured, and tactile.
- **Cards & Content Blocks**: `16px` (`rounded-card`) — soft and natural without looking pillowy.
- **Search Inputs**: `18px` (`rounded-search`) — friendly and distinct from standard text fields.
- **Sheets & Modals**: `24px` top corners (`rounded-sheet`) — welcoming, sheet-like presentation.
- **Bottom Navigation Bar**: `28px` (`rounded-navigation`) — floating capsule with safe-area spacing.
- **Buttons, Badges & Chips**: Full pill `9999px` (`rounded-pill`) — friendly, ergonomic tap targets.

---

## Elevation, Depth & Layering

- **Surface before shadow**: Rely on subtle surface transitions (`#F7F9F8` -> `#FFFFFF` -> `#F0F3F1`) rather than drop shadows.
- **Thin, quiet borders**: `1px` border (`#D5DDD7` light / `#3A4940` dark) creates crisp, organic definition.
- **Quiet Lift**: Minimal shadow (`0 2px 6px rgba(24, 32, 27, 0.04)`) for floating elements like the bottom navigation and search bar.
- **No glassmorphism or neon glows**: Avoid blurred backdrops, heavy gradients, or glowing neon outlines.

---

## Screen-Specific Design Rules

### 1. Quest Board

- Clean neutral canvas with an editorial masthead ("KUQuest Notices").
- Rounded search bar (`18px`) and horizontal scrollable category chips (`rounded-pill`).
- Quest Cards are compact, structured, and scannable: title and reward first, category tag, creator avatar/name, schedule/location, and clear action.
- 8px gap between cards in lists for rapid comparison.

### 2. Quest Detail

- Editorial header block with title, author, and prominent reward value.
- Clear structural sections for Requirements, Schedule & Location, and Deliverables.
- Primary sticky action bar at bottom with clear, full-width pill button.

### 3. Create Quest

- Editorial header intro with a subtle tint block.
- Calm, focused 3-step wizard with clear progress pills.
- Clean inputs with 8px radius and explicit field labels.

### 4. Profile & Reputation

- Editorial magazine-style profile header with clean statistics (completed quests, rating, badges).
- Tabbed layout for Experience, Portfolio Work, Certificates, and Reviews.
- Authentic campus trust indicators without exposing private IDs.

### 5. Bottom Navigation

- Quiet, floating rounded capsule with safe-area clearance.
- Muted icons for inactive states; solid primary color indicator for the active tab.

---

## Do's and Don'ts

### Do:

- **Do** maintain the 60-30-10 color balance with neutral surfaces dominating.
- **Do** use `#5F7655` as the primary brand color across all screens and workspaces.
- **Do** use editorial typography with oversized titles for section introductions and empty states.
- **Do** keep interactive elements at a minimum 48px touch target.
- **Do** support full dark mode using the specified dark palette layers (`#101713`, `#172019`, `#1E2A22`).
- **Do** use domain terms: Quest, Quest Board, Hirer, Worker, Proof, Review.

### Don't:

- **Don't** use neon greens, bright purples, or generic corporate blues.
- **Don't** mix competing persona brand colors; Hirer and Worker both share the unified Organic Editorial palette.
- **Don't** scatter tiny colored badges across cards creating a "fruit salad" effect.
- **Don't** use heavy drop shadows, decorative blurs, or glossy gradients.
- **Don't** reduce text contrast below WCAG AA thresholds (4.5:1 for body copy).
