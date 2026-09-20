---
name: KUQuest
description: A trusted community job board for people with @ku.th accounts.
colors:
  background: "#F7F9F8"
  surface: "#FFFFFF"
  surface-muted: "#F0F3F1"
  surface-subtle: "#F0F3F1"
  surface-accent: "#E5F1F0"
  surface-success: "#E2EEE7"
  surface-danger: "#F2E6E6"
  surface-image: "#DEEAE9"
  surface-placeholder: "#DDE3DF"
  surface-nav-translucent: "rgba(255, 255, 255, 0.92)"
  border-nav: "rgba(24, 32, 27, 0.14)"
  nav-icon-muted: "#89928C"
  primary: "#006664"
  primary-dark: "#004D4B"
  primary-deep: "#004D4B"
  on-primary: "#FFFFFF"
  hirer-primary: "#006664"
  hirer-primary-dark: "#004D4B"
  hirer-primary-subtle: "#E5F1F0"
  hirer-accent-border: "#B9D5D2"
  hirer-on-primary: "#FFFFFF"
  worker-primary: "#B2BB1E"
  worker-primary-dark: "#7D8615"
  worker-primary-subtle: "#F4F5DF"
  worker-accent-border: "#D9DDA5"
  worker-on-primary: "#1B2106"
  text: "#18201B"
  text-strong: "#18201B"
  text-secondary: "#5F6962"
  text-muted: "#5F6962"
  text-subtle: "#89928C"
  text-faint: "#89928C"
  border: "#DDE3DF"
  border-subtle: "#DDE3DF"
  border-muted: "#DDE3DF"
  border-accent: "#B9D5D2"
  border-danger: "#E6BDBE"
  border-success: "#B3D4C2"
  danger: "#C13D43"
  danger-dark: "#8B2C30"
  danger-light: "#E6BDBE"
  danger-icon: "#C13D43"
  success: "#21864F"
  success-bright: "#21864F"
  success-light: "#B3D4C2"
  warning: "#B7791F"
  warning-dark: "#845716"
  surface-warning: "#F1ECE2"
  border-warning: "#E3D0B3"
  info: "#356CA5"
  disabled: "#C8CECA"
  black: "#18201B"
  white: "#FFFFFF"
  overlay: "rgba(24, 32, 27, 0.4)"
  card: "#FFFFFF"
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
    backgroundColor: "{colors.white}"
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
    backgroundColor: "{colors.white}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body-small}"
    rounded: "{rounded.card}"
    padding: "16px"
  filter-chip:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
    height: "32px"
  bottom-navigation:
    backgroundColor: "{colors.surface-nav-translucent}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.navigation}"
    padding: "4px 6px"
    height: "68px"
---

# Design System: KUQuest

## Overview

**Creative North Star: "The Green Noticeboard"**

KUQuest is a trusted community job board for people with `@ku.th` accounts. Its visual system treats the **Quest Board** as a clear, welcoming noticeboard: useful information comes first, actions are easy to find, and the KU identity feels connected to the community rather than to a generic marketplace.

The atmosphere is calm, grounded, and quietly energetic in light appearance. Cool neutral surfaces keep long lists and **Quest Detail** information comfortable to read. In dark appearance the same system moves to deep green-black layers with pale text and softened signals. KU Teal marks important actions and active states in the Hirer workspace; KU Lime is the Worker workspace counterpart. Cards, filters, and inputs use soft edges and calm layers so the interface feels friendly, soft, and confident.

**Key Characteristics:**

- Cool neutral canvas with quiet white surface layers.
- KU Teal for primary actions and Hirer identity.
- KU Lime as the Worker persona ramp.
- Compact, scannable information for Quest discovery and comparison.
- Clear mobile behavior with safe-area-aware navigation.

## Colors

The palette is built from two persona ramps, one neutral ramp, and one semantic ramp. Light and dark appearance carry the same roles. Status colors stay semantic and should not become decorative accents.

### Persona ramps

Each ramp is five roles: **Primary**, **Primary Dark**, **Primary Subtle**, **Accent Border**, **On Primary**.

- **Hirer (KU Teal, `#006664` light / `#2FA39B` dark):** the app-wide `primary` tokens resolve to this ramp today.
- **Worker (KU Lime, `#B2BB1E` light / `#C8D34A` dark):** defined as `worker*` tokens so the Worker workspace can adopt it without inventing values. Nothing resolves to it yet.

A surface never mixes the two ramps. The persona in view owns its primary, its subtle tint, and its accent border together.

### Neutral

- **Canvas:** The main app background, a cool off-white in light appearance and a green-black in dark.
- **Surface:** The card and sheet surface, pure white in light appearance.
- **Surface Raised:** Low-emphasis controls, skeletons, grouped content, and pressed backgrounds.
- **Accent Surface:** The persona's Primary Subtle tint, used for selected filters, avatar fallbacks, and positive notices.
- **Image Surface:** A soft tinted image fallback surface.
- **Placeholder Surface:** Neutral image and certificate placeholders.
- **Strong Text:** Main headings, Quest titles, and important values.
- **Secondary Text:** Supporting descriptions, metadata, and body copy.
- **Muted Text:** Labels, helper copy, and less important metadata.
- **Faint Text:** Placeholder and tertiary copy.
- **Quiet Border:** The default field and option border.
- **Subtle Border:** Dividers and the outline around cards and profile sections.
- **Accent Border:** Selected controls and positive notice outlines; the persona's Accent Border.
- **Disabled:** Inactive controls and step indicators that are not yet reached.

### Status

Four semantic hues, each with a subtle surface, a border, and a darker on-surface text tone:

- **Success `#21864F` / `#42B873`** — completion, positive outcomes, certificate metadata.
- **Warning `#B7791F` / `#E4A83B`** — pending settlement, expiring holds, dispute notices.
- **Danger `#C13D43` / `#EF6469`** — invalid fields, failures, cancellation.
- **Info `#356CA5` / `#659AD0`** — neutral informational notices.

**Contrast policy.** WCAG AA requires 4.5:1 for ordinary text, 3:1 for large text (at least 18pt regular or 14pt bold in the web baseline), and 3:1 for meaningful non-text controls and state indicators. The current Muted Text (`#89928C`, 3.2:1 on light surfaces) and self-colored Success hue are documented token gaps: do not use them for body, placeholder, control, focus, or stand-alone status text. Use strong text on semantic surfaces; use the hue with text or icon cues. Verify both appearances before adding or changing a token. See [`docs/agents/ui-design-rules.md`](docs/agents/ui-design-rules.md).

### Named Rules

**The Persona Signal Rule.** The primary ramp marks an action, an active state, or a positive result for the workspace in view. Do not use it as a general decoration on every element, and do not mix the Hirer and Worker ramps on one surface.

**The Quiet Canvas Rule.** Keep the app canvas neutral and quiet so the information in a Quest Card or Quest Detail view remains the focus.

## Typography

**Display Font:** Kurious (`KuriousSemiBold`, with a sans-serif fallback)
**Body Font:** Kurious (`KuriousMedium`, with a sans-serif fallback)
**Label/Strong Font:** Kurious medium and semibold weights.

**Character:** The type system is direct and readable. Semibold Kurious gives the interface a confident KUQuest voice, while medium Kurious keeps requirements, schedules, rewards, and profile information easy to scan in both supported locales.

### Hierarchy

- **Display** (bold, 44px): Sign-in product identity and the strongest entry-point title.
- **Headline** (bold, 30px / 38px): Main flow titles such as Create Quest.
- **Title** (bold, 24px / 29px): Page and completion titles, reward values, and profile statistics.
- **Body** (regular, 16px / 24px): Main actions, search input, and readable explanatory copy.
- **Body Small** (regular, 14px / 21px): Supporting descriptions, fields, and state messages.
- **Label** (regular or bold, 12px / 18px): Metadata, field labels, tab labels, helper text, and compact controls.

### Named Rules

**The Clear Label Rule.** Labels name the information or action directly. Do not replace a useful label with a decorative phrase.

**The Weight Before Color Rule.** Use weight and size to establish hierarchy before adding another color.

## Layout

The system is mobile-first and safe-area aware. Main screens use 24px horizontal page padding; the top bar and Quest Board use 16px horizontal padding where the brand mark or search field needs more room. Sign-in content is capped at 420px, and the Student Profile content is capped at 720px on wider devices.

The spacing rhythm is 4px, 8px, 16px, 24px, and 32px. Use the smaller steps inside controls and metadata groups. Use 16px between related controls and 24px or more between sections. Quest Cards are intentionally compact and use an 8px gap in result lists so people can compare several Quests without excessive scrolling.

The implementation changes app chrome below 400px, expands profile content from 600px, and changes the authenticated navigation to a vertical rail at expanded tablet widths. The bottom navigation is absolute on phones and becomes an in-flow rail on tablets, with safe-area-aware spacing. Scrollable content calculates its bottom clearance from the actual navigation height and safe-area inset so the final Quest Card or profile section is not hidden.

Platform behavior, accessibility semantics, responsive windows, text scaling,
motion preferences, navigation, forms, and sheets are governed by
[`docs/agents/ui-design-rules.md`](docs/agents/ui-design-rules.md). This file
defines the visual system and does not weaken that contract.

## Elevation & Depth

Depth is layered and calm. Warm and pale green surface changes separate groups before a shadow is added. Cards and the bottom navigation use soft, low-contrast shadows. Sheets use an overlay and a raised bottom surface. Avoid large offsets, glossy effects, and decorative blur.

### Shadow Vocabulary

- **Quest Card lift** (`0px 2px 5px rgba(18, 32, 24, 0.06)`): A quiet separation from the warm canvas while scanning Quest results.
- **Navigation lift** (`0px 4px 4px rgba(18, 32, 24, 0.06)`): Keeps the floating bottom navigation readable above scrolling content.
- **Create action lift** (`0px 3px 4px rgba(18, 32, 24, 0.18)`): Gives the central Create action a clear position without making it look glossy.

### Named Rules

**The Calm Layer Rule.** Use surface color first. Use shadow only when a surface must sit above nearby content.

## Shapes

The form language is soft and approachable. Text fields and choice rows use an 8px radius. Quest Cards and Student Profile sections use a 16px radius. Search fields use an 18px radius, bottom sheets use a 24px top radius, and the bottom navigation uses a 28px radius. Pills are reserved for small actions, filters, tags, progress segments, and the central Create control.

Borders are light and functional. Keep them thin and quiet. Use rounded hit areas of at least 48 logical units for interactive controls, including back, close, filter, and tab actions. Images use 8px to 12px clipping depending on their size.

## Components

Components should feel friendly, soft, and confident. They should make the next action clear without adding visual noise.

### Buttons

- **Shape:** Full pills for primary and secondary actions; minimum height 48px.
- **Primary:** persona primary background, `on-primary` label, semibold type, and 16px horizontal padding.
- **Secondary:** Transparent background with a 2px persona primary outline and label.
- **Pressed / Disabled:** Pressed actions move to the persona Primary Dark state or a muted active surface. Disabled buttons use reduced opacity and keep their label readable.
- **Use:** Use a clear action label such as Apply now, Create Quest, Next, or Retry. Do not hide the action in an icon alone.

### Chips

- **Style:** Rounded pills with a pale green or quiet neutral surface, compact padding, and small semibold labels.
- **State:** Selected Quest Board filters use the accent surface and primary green text. Selected review filters use the primary green surface and `on-primary` text.
- **Use:** Use chips for Quest Tags, active Quest Board filters, and small profile categories. They are not a replacement for a full section heading.

### Cards / Containers

- **Corner Style:** Quest Cards and Student Profile sections use the 16px card radius. Small review and form summary containers use 8px to 10px.
- **Background:** Use the Content Card surface for primary content cards and quiet surface layers for grouped or secondary content. The Content Card surface changes with appearance; do not use a bright white card in dark appearance.
- **Shadow Strategy:** Follow the calm layered approach in Elevation & Depth.
- **Border:** Use a subtle 1px border for cards, sections, and fields. Keep the border close to the surface color.
- **Internal Padding:** Use 16px for Quest Cards, profile cards, statistics, and review cards.
- **Signature behavior:** A Quest Card places the title and reward first, then category, creator, metadata, and lifecycle actions. Keep this order stable so people can compare Quests quickly.

### Inputs / Fields

- **Style:** White field surface, quiet 1px border, 8px radius, 48px minimum height, and 12px horizontal padding.
- **Focus:** Replace the quiet border with the persona primary while keeping the field shape stable.
- **Error / Success:** Use the semantic danger or success border and helper text. Error copy must explain the problem and how to recover.
- **Disabled:** Use the muted surface and reduced opacity. Keep the label and value legible.
- **Select and Text Area:** Use the same field language. Select options open in a bottom sheet on mobile.

### Navigation

- **Style:** The current authenticated shell exposes five same-level destinations: Quest Board, My Quests, Create, Chat, and Student Profile.
- **Default:** Translucent warm surface, 28px radius, quiet border, and muted green-gray icons.
- **Active:** persona primary icon and label with a short active indicator. If Create launches an action rather than a destination, its product contract must keep it distinct from selected-tab semantics.
- **Mobile treatment:** Keep the bar at the bottom, respect the safe area, preserve labels, and give each navigation target at least a 48 logical-unit frame.
- **Tablet treatment:** Use a vertical rail on expanded widths and reserve horizontal content space for it.

### Quest Board Filter Sheet

- **Style:** A bottom sheet with a warm background, 24px top corners, a small handle, a clear title, and grouped options.
- **Behavior:** Keep the current search query visible behind the sheet, preserve selected filters while editing, and provide explicit Apply filters and Clear all actions.
- **State:** Invalid reward bounds disable the primary Apply filters action and show a danger message near the fields.

### Student Profile

- **Style:** Use a brand row, Content Card surfaces for the profile header and statistics, and section cards with consistent 16px corners.
- **Tabs:** Use a horizontal tab strip with icons, a 72px minimum tab height, and a primary-green bottom indicator for the selected section.
- **Trust content:** Keep Profile Rating, completed Quest count, Experience, Portfolio Work, Certificates, and Reviews easy to scan. Do not expose private contact details or Student ID.

## Do's and Don'ts

### Do:

- **Do** use the persona primary for primary actions, selected controls, and the main KUQuest identity.
- **Do** keep the neutral canvas and quiet surface layers behind Quest Board content.
- **Do** preserve the compact Quest Card order: title, reward, category, creator, metadata, then actions.
- **Do** keep interactive controls at least 48 logical units high and safe-area aware on native Android and iOS; give them accessible names and states.
- **Do** provide a first-class dark appearance with the same semantic color roles.
- **Do** use the domain language from `CONTEXT.md`: Quest, Quest Board, Quest Detail, Quest Application, Student Profile, Academic Registration, and Review.
- **Do** provide clear loading, empty, error, unavailable, pending, and accepted states.

### Don't:

- **Don't** introduce generic corporate blue, glossy gradients, or noisy gaming aesthetics.
- **Don't** turn KUQuest into a crowded gig-marketplace interface with dense badges and competing accents.
- **Don't** use green on every surface or for text that does not represent an action, active state, or positive result.
- **Don't** use large hard-offset shadows, decorative blur, or heavy visual effects.
- **Don't** replace clear labels with icon-only controls when a person is applying to or creating a Quest.
- **Don't** invent proof, ratings, customer claims, or other product evidence that is not supplied by the product.
