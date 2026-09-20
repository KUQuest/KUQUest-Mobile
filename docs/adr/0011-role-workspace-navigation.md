# Role Workspace Navigation

**Status:** Accepted

KUQuest presents separate Hirer and Worker Role Workspaces for the same Member rather than treating either role as a permanent account type. The Hirer Workspace uses Home, Money, Create Quest, Chat, and Profile as its five primary destinations; the Worker Workspace uses Home, Money, Work Management, Chat, and Profile. The selected workspace remembers the last choice after the first launch defaults to Hirer. Workspace switching is explicit from Settings and returns to the target workspace Home; primary navigation and workspace Home headers do not switch roles implicitly.

## Consequences

- Hirer-specific actions, including Create Quest, stay out of Worker navigation.
- The Worker Home and Work Management destinations are selected through the authenticated route seam from the current Role Workspace.
- Role Workspace state belongs to the app shell and does not rewrite Member identity or Quest-specific role records.
- Workspace selection owns persistence and transition state; route callers own returning to workspace Home.

## Page ownership

| Destination     | Hirer Workspace                       | Worker Workspace            | Implementation |
| --------------- | ------------------------------------- | --------------------------- | -------------- |
| Home            | Hirer Home                            | Worker Home                 | Separate       |
| Money           | Wallet                                | Wallet                      | Shared         |
| Create Quest    | Available                             | Not in primary navigation   | Hirer-only     |
| Work Management | Hirer quest management when requested | Worker quest management     | Role-adapted   |
| Chat            | Conversations                         | Conversations               | Shared         |
| Profile         | Member profile and settings           | Member profile and settings | Shared         |

The authenticated route owns the Home selection, while the page implementations
remain separate. Shared pages keep one implementation and derive only the
workspace-specific labels or data they actually need. Work Management keeps one
route with role-specific projections rather than duplicating the page shell.
