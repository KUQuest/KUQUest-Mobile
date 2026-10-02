# Quest Board Discovery and Application Boundary

The Quest Board shows only published, discoverable Quests that the current Student can still participate in; a Student's own Quests and full or deadline-closed Quests belong outside Board results but remain inspectable in Quest Detail when needed. Students use **Apply now** from Detail: first-come Quests produce an Accepted outcome when capacity remains, while reviewed-candidate Quests produce Application Pending, with confirmation required before either local mockup transition. This separates low-risk discovery from lifecycle-changing participation and keeps the compact Board focused on comparison.

## Consequences

- Board filters and sorts operate only on discoverable Quest data.
- Quest Detail owns creator identity, complete requirements, availability explanations, and the lifecycle-aware primary action.
- The local mockup must model capacity, deadline, candidate mode, and application state explicitly so future API wiring does not collapse discovery and participation into one screen action.
