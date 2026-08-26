---
target: src/features/createQuest/CreateQuestScreen.tsx
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-26T12-33-56Z
slug: src-features-createquest-createquestscreen-tsx
---
# Impeccable Critique — Create Quest

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Progress, autosave, and success states are visible, but save errors are not surfaced. |
| 2 | Match System / Real World | 2/4 | “Receive Applicants: No,” FCFS, Worker, and SINGLE create semantic friction. |
| 3 | User Control and Freedom | 3/4 | Back, draft recovery, picker dismissal, and discard confirmation are strong. |
| 4 | Consistency and Standards | 2/4 | Inert chevrons, mixed step scope, and ambiguous final actions reduce predictability. |
| 5 | Error Prevention | 3/4 | Required validation, date ordering, numeric limits, and autosave prevent common mistakes. |
| 6 | Recognition Rather Than Recall | 3/4 | Selected states and the mode summary help, but summary values can truncate or mislabel data. |
| 7 | Flexibility and Efficiency | 2/4 | Autosave helps, but Review has no quick edit or direct recovery path to invalid fields. |
| 8 | Aesthetic and Minimalist Design | 3/4 | The palette is strong, but oversized chrome and nested cards crowd the first viewport. |
| 9 | Error Recovery | 2/4 | Inline errors are useful; save failures are silent and Review errors can point to hidden fields. |
| 10 | Help and Documentation | 2/4 | Help explains the flow broadly, but not team semantics, FCFS, or save/preview outcomes. |
| **Total** |  | **24/40** | **Acceptable; significant improvements needed before release.** |

## Design Specificity Verdict

The screen is partially product-specific. KUQuest’s forest-green hero, three-step progress, “Quest Setup,” and dynamic mode summary give it a recognizable point of view. However, the radio-card/form language is still interchangeable with a generic gig marketplace.

The deterministic detector found 0 findings in `CreateQuestScreen.tsx` (exit 0; no rule names or locations). That confirms there are no matching automated anti-pattern rules, but it does not validate rendered NativeWind styles, Thai text wrapping, native touch behavior, font scaling, safe-area/keyboard behavior, iOS parity, or visual fidelity. The Android capture and source review caught issues the detector cannot see.

No browser overlay was used: this is a native Expo Android/iOS surface, so browser visualization is not applicable.

## Overall Impression

The happy path is understandable and visually polished, but Step 2 is carrying too many jobs under “Team Setup”: work format, acceptance method, capacity/reward, schedule/location, and images. The oversized hero, tall summary, and sticky footer compete with the primary decision. The single biggest opportunity is to make the first viewport about choosing the participation mode, then progressively reveal the logistics.

## What’s Working

- The green/white contrast, progress treatment, selected borders, and radios create a confident KUQuest visual language.
- Autosave, draft restoration, native date/time pickers, and localized validation protect user work.
- The live “Selected mode” explanation externalizes the consequence of the user’s choices and reduces recall.

## Priority Issues

### [P1] Step 2 is too long and diverges from the reference composition

**Why it matters:** In the current Android capture, the vertically stacked format cards and tall summary push the key decision below the fold and make the flow feel longer than it is.

**Fix:** Keep the existing behavior, but make the two format cards compact horizontal rows on normal widths; use inline icon/copy/value/chevron metric rows; and place capacity/reward plus schedule/location behind clearly separated subheadings or progressive disclosure. Keep the stacked fallback only for narrow widths or large font scales.

**Suggested command:** `$impeccable layout`

### [P1] The setup summary reports misleading data and suggests dead interactions

**Why it matters:** `draft.tag` is shown under “Quest Type,” while FCFS maps to “Receive Applicants: No.” A user can read that as “applicants cannot apply.” The chevrons look tappable, but the metric is a non-interactive `View`.

**Fix:** Rename “Quest Type” to “Quest Tag,” or provide a real quest-type field. Replace Yes/No with the actual mode (“Instant accept” / “Review applicants”). Either make each metric navigate to its editable section or remove the chevrons.

**Suggested command:** `$impeccable clarify`

### [P1] Save and Review failure paths are opaque

**Why it matters:** The screen has saving/saved states but no visible recovery for `saveState === 'error'`. Review validates Step 2 while Step 3 is visible, so a user may receive a reward/date error while the offending field is unmounted.

**Fix:** Add an inline retryable save-error banner. When Review validation fails, return to Step 2, scroll to the first invalid field, focus it, and preserve the draft.

**Suggested command:** `$impeccable harden`

### [P2] Thai copy leaks implementation and domain jargon

**Why it matters:** “Worker,” “SINGLE,” and “FCFS” are implementation-facing terms, while “mission” and “Quest” are mixed in English. This increases the first-time comprehension cost.

**Fix:** Define one bilingual glossary. Keep “มาก่อนได้ก่อน” as the user-facing FCFS explanation, replace raw enum names, and align the header, step labels, summary, and buttons around “Quest.”

**Suggested command:** `$impeccable clarify`

### [P2] Accessibility and localization resilience are incomplete

**Why it matters:** Step names are visually present but the label row is excluded from the accessibility tree; progress buttons announce only “Step 2 of 3.” The three-column summary uses fixed narrow widths and two-line truncation, which is already visible with Thai values. Fixed footer clearance may also fail under larger font sizes.

**Fix:** Include the step name in each progress accessibility label, remove silent truncation, add compact-width/large-font fallbacks, and calculate bottom clearance from the actual action-bar height.

**Suggested command:** `$impeccable adapt`

## Persona Red Flags

**Jordan — confused first-timer**

- “Team Setup” also contains reward, dates, location, and images, so the step boundary is misleading.
- “Receive Applicants: No” sounds like nobody can apply.
- FCFS, Worker, and SINGLE are not consistently explained.
- Summary chevrons imply edit controls that do nothing.

**Sam — accessibility-dependent user**

- Step names are hidden from the accessibility tree.
- Review errors can announce a missing field while leaving that field off-screen/unmounted.
- Long Thai labels can be truncated inside the three-column summary.
- Radio semantics and touch targets are otherwise comparatively strong.

**Casey — distracted mobile user**

- Primary choices sit far from the thumb zone after the large hero and summary card.
- The fixed footer competes with the lower content.
- Autosave protects interruptions, but a failed save provides no recovery cue.

## Minor Observations

- `UsersRound` is used for both Quest Type and Team Size; the metrics are harder to distinguish.
- “Next” is generic; “Review Quest” better communicates the transition.
- The reference’s “5 / 8” should only be reproduced once the denominator has a product meaning; the current model stores one headcount value.
- “Save draft” and “Save Quest preview” have similar visual weight despite different outcomes.
- The success copy is honest about local-only storage, but preview and publish language should be clearly separated.

## Questions to Consider

- If Step 2 is called “Team Setup,” should schedule, location, images, and reward compete inside the same step?
- Would you trust a summary that says “Receive Applicants: No,” or should it expose the actual acceptance method?
- What should be the visual peak: choosing a mode, reviewing the complete Quest, or seeing a confirmed save?
- Can the screen feel distinctly KUQuest through product semantics and trust cues, not only through green cards?
