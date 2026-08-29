---
name: KUQuest
description: A trusted community job board for people with @ku.th accounts.
colors: 
  background: "#FFFCFA"
  surface: "#FCF9F8"
  surface-muted: "#F5F2F0"
  surface-subtle: "#F9F9F9"
  surface-accent: "#F0F4F1"
  surface-success: "#EAF6ED"
  surface-danger: "#FDECEF"
  surface-image: "#DDE9D9"
  surface-placeholder: "#E8E8E8"
  surface-nav-translucent: "rgba(252, 249, 248, 0.92)"
  border-nav: "rgba(64, 73, 65, 0.14)"
  nav-icon-muted: "#66716A"
  primary: "#014925"
  primary-dark: "#004D25"
  primary-deep: "#003417"
  text: "#1B1B1B"
  text-strong: "#111111"
  text-secondary: "#404941"
  text-muted: "#666666"
  text-subtle: "#5F6B62"
  text-faint: "#626D65"
  border: "#C0C9BE"
  border-subtle: "#E5E2E1"
  border-muted: "#E0E0E0"
  border-accent: "#D0E3D5"
  border-danger: "#F5C2C7"
  border-success: "#C5E1C9"
  danger: "#D32F2F"
  danger-dark: "#842029"
  danger-light: "#FCA5A5"
  danger-icon: "#C41C1C"
  success: "#2E7238"
  success-bright: "#4CAF50"
  success-light: "#A8F3AA"
  black: "#122018"
  white: "#FFFEFD"
  card: "#FFFEFD"
  overlay: "rgba(18, 32, 24, 0.4)"
typography:
  display:
    fontFamily: "NotoSansThai_700Bold, sans-serif"
    fontSize: "44px"
    fontWeight: 700
  headline:
    fontFamily: "NotoSansThai_700Bold, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "38px"
  title:
    fontFamily: "NotoSansThai_700Bold, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "29px"
  body:
    fontFamily: "NotoSansThai_400Regular, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-small:
    fontFamily: "NotoSansThai_400Regular, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "21px"
  label:
    fontFamily: "NotoSansThai_400Regular, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
  label-strong:
    fontFamily: "NotoSansThai_700Bold, sans-serif"
    fontSize: "12px"
    fontWeight: 700
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
    textColor: "{colors.white}"
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

KUQuest is a trusted community job board for people with `@ku.th` accounts. Its visual system treats the **Quest Board** as a clear, welcoming noticeboard: useful information comes first, actions are easy to find, and the green identity feels connected to the KU community rather than to a generic marketplace.

The atmosphere is warm, grounded, friendly, and quietly energetic in light appearance. Warm paper surfaces keep long lists and **Quest Detail** information comfortable to read. In dark appearance, the same system moves to deep green-black layers with pale text and softened green signals. Deep green marks important actions and active states. Fresh Lime appears as a focused signal for selected navigation and success, not as decoration. Cards, filters, and inputs use soft edges and calm layers so the interface feels friendly, soft, and confident.

**Key Characteristics:**
- Warm paper background with quiet off-white surface layers.
- Deep Forest Green for primary actions and important product identity.
- Fresh Lime for active navigation and success signals.
- Compact, scannable information for Quest discovery and comparison.
- Rounded controls with light borders and restrained shadows.
- Clear mobile behavior with safe-area-aware navigation.

## Colors

The palette uses warm neutrals as the light canvas and a disciplined green range as the voice of the community. Dark appearance uses deep green-black surfaces and pale semantic text while preserving the same action and status roles. Status colors stay semantic and should not become decorative accents.

### Primary
- **Deep Forest Green:** The main action color for applying, creating, confirming, and selected controls.
- **Deep Forest Dark:** The darker action state for pressed or high-emphasis green content.
- **Deep Forest Deep:** The strongest green for back icons, initials, and high-contrast identity details.

### Secondary
- **Fresh Lime:** The active navigation and success signal. Use it for selected destination labels, active indicators, and positive outcomes.
- **Success Green:** Supporting positive text and certificate or completion metadata.

### Neutral
- **Warm Paper:** The main app canvas. It gives the mobile interface a warm, calm base.
- **Quiet Surface:** A slightly separated surface for sheets, profile areas, and grouped content.
- **Content Card:** The primary card surface. It is warm white in light appearance and deep green-black in dark appearance.
- **Muted Surface:** Low-emphasis controls, skeletons, and pressed backgrounds.
- **Subtle Surface:** Review content and other low-contrast containers.
- **Accent Surface:** A pale green tint for selected filters, avatar fallbacks, and positive notices.
- **Image Surface:** A soft green image fallback surface.
- **Placeholder Surface:** Neutral image and certificate placeholders.
- **Strong Text:** Main headings, Quest titles, and important values.
- **Secondary Text:** Supporting descriptions, metadata, and body copy.
- **Muted Text:** Labels, helper copy, and less important metadata.
- **Faint Text:** Placeholder and tertiary copy.
- **Quiet Border:** The default field and option border.
- **Subtle Border:** Dividers and the outline around cards and profile sections.
- **Accent Border:** Selected controls and positive notice outlines.

### Status
- **Danger Red:** Invalid fields and urgent error states.
- **Danger Dark:** Error copy and recovery actions on danger surfaces.
- **Danger Light:** Supporting error tint.
- **Danger Icon:** Error and unread indicators.
- **Success Surface:** Positive notice backgrounds.
- **Danger Surface:** Error notice backgrounds.

### Named Rules

**The Green Signal Rule.** Green marks an action, an active state, or a positive result. Do not use it as a general decoration on every element.

**The Warm Canvas Rule.** Keep the app canvas warm and quiet so the information in a Quest Card or Quest Detail view remains the focus.

## Typography

**Display Font:** Noto Sans Thai (`NotoSansThai_700Bold`, with a sans-serif fallback)
**Body Font:** Noto Sans Thai (`NotoSansThai_400Regular`, with a sans-serif fallback)
**Label/Strong Font:** Noto Sans Thai medium, semibold, and bold weights.

**Character:** The type system is direct and readable. Bold Noto Sans Thai gives the interface a confident KUQuest voice, while regular text keeps requirements, schedules, rewards, and profile information easy to scan in both supported locales.

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

Borders are light and functional. Keep them thin and quiet. Use rounded hit areas of at least 48px for interactive controls, including back, close, filter, and tab actions. Images use 8px to 12px clipping depending on their size.

## Components

Components should feel friendly, soft, and confident. They should make the next action clear without adding visual noise.

### Buttons
- **Shape:** Full pills for primary and secondary actions; minimum height 48px.
- **Primary:** Deep Forest Green background, white label, semibold type, and 16px horizontal padding.
- **Secondary:** Transparent background with a 2px Deep Forest Green outline and Deep Forest Green label.
- **Pressed / Disabled:** Pressed actions move to the darker green state or a muted active surface. Disabled buttons use reduced opacity and keep their label readable.
- **Use:** Use a clear action label such as Apply now, Create Quest, Next, or Retry. Do not hide the action in an icon alone.

### Chips
- **Style:** Rounded pills with a pale green or quiet neutral surface, compact padding, and small semibold labels.
- **State:** Selected Quest Board filters use the accent surface and primary green text. Selected review filters use the primary green surface and white text.
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
- **Focus:** Replace the quiet border with Deep Forest Green while keeping the field shape stable.
- **Error / Success:** Use the semantic danger or success border and helper text. Error copy must explain the problem and how to recover.
- **Disabled:** Use the muted surface and reduced opacity. Keep the label and value legible.
- **Select and Text Area:** Use the same field language. Select options open in a bottom sheet on mobile.

### Navigation
- **Style:** Five authenticated destinations: Quest Board, My Quests, Create, Chat, and Student Profile.
- **Default:** Translucent warm surface, 28px radius, quiet border, and muted green-gray icons.
- **Active:** Fresh Lime icon and label with a short active indicator. The central Create action uses a raised Deep Forest Green circular control.
- **Mobile treatment:** Keep the bar at the bottom, respect the safe area, and preserve at least 48px navigation targets.
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
- **Do** use Deep Forest Green for primary actions, selected controls, and the main KUQuest identity.
- **Do** keep the Warm Paper canvas and quiet surface layers behind Quest Board content.
- **Do** preserve the compact Quest Card order: title, reward, category, creator, metadata, then actions.
- **Do** keep interactive controls at least 48px high and safe-area aware on native Android and iOS.
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
