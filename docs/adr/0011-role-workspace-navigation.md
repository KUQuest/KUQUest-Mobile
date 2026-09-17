# Role Workspace Navigation

**Status:** Accepted

KUQuest presents separate Hirer and Worker Role Workspaces for the same Member rather than treating either role as a permanent account type. The Hirer Workspace uses Home, Money, Create Quest, Chat, and Profile as its five primary destinations; the Worker Workspace remains a follow-up surface. The selected workspace remembers the last choice after the first launch defaults to Hirer. Once the Worker Workspace exists, holding Profile switches immediately and lands on the target workspace Home. The long-press switch is intentionally deferred from the Hirer-only milestone so the app never routes into an unfinished Worker surface.

## Consequences

- Hirer-specific actions, including Create Quest, stay out of the future Worker navigation.
- Role Workspace state belongs to the app shell and does not rewrite Member identity or Quest-specific role records.
- The Hirer milestone can ship independently with the role-switch contract documented but unwired.
