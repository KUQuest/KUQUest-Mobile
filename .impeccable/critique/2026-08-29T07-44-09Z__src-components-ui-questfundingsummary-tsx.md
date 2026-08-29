---
target: src/components/ui/QuestFundingSummary.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-29T07-44-09Z
slug: src-components-ui-questfundingsummary-tsx
---
# QuestFundingSummary Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|---:|---|
| 1 | Visibility of System Status | 2/4 | Zero balance and unavailable actions communicate state, but provide no useful next step. |
| 2 | Match System / Real World | 2/4 | Funding/held language does not explain escrow, ownership, or availability. |
| 3 | User Control and Freedom | 3/4 | Expand/collapse is clear and reversible. |
| 4 | Consistency and Standards | 2/4 | Settlement/history and policy look actionable but are not interactive. |
| 5 | Error Prevention | 3/4 | Disabled payment actions prevent unsupported operations. |
| 6 | Recognition Rather Than Recall | 2/4 | Balance is visible, but eye affordance and funding semantics are ambiguous. |
| 7 | Flexibility and Efficiency | 2/4 | Compact bar helps scanning, but no useful payment path exists. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Collapsed bar is clean; expanded state adds low-value blocks around a buried balance. |
| 9 | Error Recovery | 1/4 | Unavailable state has no recovery or alternative action. |
| 10 | Help and Documentation | 1/4 | No contextual explanation of held funds, settlement, or refunds. |
| **Total** | | **21/40** | **Acceptable; significant improvements needed.** |

## Design Specificity Verdict

The green visual system is coherent and specific to KUQuest, but the funding component still reads as a generic wallet placeholder because it hardcodes `฿0`, exposes unavailable actions, and lacks quest-level funding context. The native detector/browser overlay is not applicable to this React Native target; native source and test evidence were used instead.

## Overall Impression

The compact bar is the right interaction pattern for progressive disclosure. The expanded state is visually confident but currently promises a financial workflow that cannot be completed. The single biggest opportunity is to make the unavailable prototype state explicit and trustworthy, or connect it to real Quest funding data before presenting payment actions.

## What's Working

- The 64dp expand/collapse target has a clear label, hint, role, state, and reversible behavior.
- Light/dark theme tokens and Thai/English copy are used consistently.
- Funding is correctly scoped to the Hirer view in My Quests, not discovery Home.

## Priority Issues

1. **[P1] Hardcoded balance and unavailable core actions** — `QuestFundingSummary.tsx`. `฿0` appears in visual and accessibility copy, while Top up and Transfer are disabled. Connect funding state when available, or label the entire surface as a prototype/unavailable service with a clear next step.
2. **[P1] False affordances** — Settlement/history and policy tiles look like navigation but are non-pressable. Make them buttons/links or rewrite them as informational labels.
3. **[P2] Weak expanded hierarchy** — The title dominates while the amount is buried in a second card. Make amount plus status the focal point.
4. **[P2] Ambiguous financial language** — Explain that held funds are reserved per Worker place and settle/refund according to Actual Headcount.
5. **[P2] Misleading eye icon** — It suggests a visibility toggle but has no behavior or label. Remove it or implement the toggle.

## Persona Red Flags

- **Jordan:** Cannot tell whether held funds are spendable, escrowed, or refundable; disabled actions provide no path forward.
- **Sam:** Eye icon has no semantic purpose; duplicate unavailable announcements may be noisy; long Thai copy risks wrapping at larger font scales.
- **Casey:** Expanded content adds several blocks before Quest cards while the key payment actions remain unavailable.

## Minor Observations

- Action buttons should use 48dp minimum on Android rather than 44dp.
- Keep unavailable messaging in one semantic channel to avoid duplicate announcements.
- Add a visible transition cue if expansion remains visually abrupt.

## Questions to Consider

- Is this a real funding surface now, or a visual promise for a future payment feature?
- Should Settlement and Policy remain informational until navigation destinations exist?
- Would an explicit “Payment service unavailable” state build more trust than a prominent `฿0`?
