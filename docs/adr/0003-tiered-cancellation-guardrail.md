# Tiered Cancellation Guardrail

We use a 3-tier Context-Aware Cancellation Guardrail that escalates interaction friction based on the quest's lifecycle state (Tier 1: standard button click for 0% penalty; Tier 2: slide-to-cancel for 20% penalty + Red Flag; Tier 3: explicit keyword typing confirmation for 100% penalty) instead of a uniform confirmation alert. This deliberate UX friction prevents expensive mobile misclicks and protects users from financial loss and Red Flag penalties as defined in SRS Section 3.7.
