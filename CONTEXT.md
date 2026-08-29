# KUQuest Mobile

Mobile app for KU Account Holders—including Staff, Lecturers, and Students—to create and perform Quests.

## Language

**KU Account Holder**:
A person authorized to use KUQuest through a KU affiliation as Staff, Lecturer, or Student.
_Avoid_: User, account, customer

**Student**:
A KU Account Holder whose KU affiliation is Student.
_Avoid_: User, account, customer

**Staff**:
A KU Account Holder whose KU affiliation is Staff.

**Lecturer**:
A KU Account Holder whose KU affiliation is Lecturer.

**Hirer**:
A KU Account Holder who creates and funds a Quest. The role is open to Staff, Lecturers, and Students, but a Hirer cannot be a Worker on the same Quest. A KU Account Holder may be a Hirer for some Quests and a Worker for others.

**Worker**:
A KU Account Holder who has been admitted or assigned to perform a Quest. In a Group Quest, each participating person is a separate Worker.

**Applicant**:
A KU Account Holder seeking selection for a Candidate Quest, either individually in SINGLE + CANDIDATE or as a member of a Quest Team in GROUP + CANDIDATE.
_Avoid_: Worker, accepted participant

**Participation**:
A Quest setting that determines whether exactly one Worker (`SINGLE`) or multiple Workers (`GROUP`) may be admitted. `SINGLE` has Requested Headcount 1; `GROUP` may start below its Requested Headcount only after Partial-Start Consent.

**Headcount**:
The capacity quantity for a Quest. Requested Headcount is the number of Worker places the Hirer requests and funds; Actual Headcount is the number of Workers in the selected or approved roster.

**Requested Headcount**:
The number of Worker places the Hirer requests and funds before publishing. It is 1 for `SINGLE` and a maximum capacity for `GROUP`, not a minimum.

**Actual Headcount**:
The number of Workers in the roster that will start the Quest, fixed at direct admission for `SINGLE`, capacity for a full direct Group, Candidate Selection, or unanimous Partial-Start Consent. Rewards settle by Actual Headcount and unused requested places are refunded.

**Mode**:
A Quest setting that determines whether Workers join directly in arrival order (`NO_CANDIDATE`, formerly `FIRST_COME_FIRST_SERVED`, user-facing First-Come-First-Served) or are selected by the Hirer from Candidate Proposals (`CANDIDATE`).

**Single Quest**:
A Quest with `SINGLE` Participation and Requested Headcount 1. Before admission it may have no Worker; after direct admission or Selection it has exactly one Worker.

**Group Quest**:
A Quest with `GROUP` Participation. It supports multiple Workers, with capacity and rewards counted per Worker; `GROUP + CANDIDATE` uses Quest Team Proposals, while `GROUP + NO_CANDIDATE` uses direct joins and shared Work Chat without a team.

**First-Come-First-Served Mode**:
A Quest Mode in which eligible Workers join directly in arrival order (`NO_CANDIDATE`) until Requested Headcount is reached. No Proposal or Quest Team is needed.

**Candidate Mode**:
A Quest Mode in which individual KU Account Holders submit Candidate Proposals for a `SINGLE` Quest and the Hirer selects one Worker, or Quest Teams submit Proposals for a `GROUP` Quest and the Hirer selects one team.

**Candidate Proposal**:
A request for Hirer Selection: an individual Applicant's candidacy for `SINGLE + CANDIDATE`, or a submitted Quest Team roster for `GROUP + CANDIDATE`. An individual Proposal may be withdrawn before Selection and replaced by a new Proposal; a rejected Proposal cannot be resubmitted and a submitted team roster is locked.
_Avoid_: direct join, Assignment

**Selection**:
The Hirer's one-time decision to accept one eligible Candidate Proposal. Manual rejection leaves the Quest OPEN but closes that Proposal permanently; Selection makes the chosen Applicant or team members Workers, creates their Assignments, opens their Work Chat, and auto-rejects competing submitted Proposals.

**Quest Team**:
A group of KU Account Holders formed by a Quest Team Leader to submit one Proposal for a `GROUP + CANDIDATE` Quest. Multiple teams may propose, each Worker may belong to only one team per Quest, a team may submit any non-empty roster up to Requested Headcount, has no team name, and becomes immutable when the Leader confirms submission; after Selection, every member becomes a Worker with a separate Quest Assignment.

**Team Roster**:
The accepted KU Account Holders in a Quest Team. Only accepted members count toward Actual Headcount; the Leader's Review confirmation locks the roster for Selection.

**Quest Team Leader**:
The member of a Quest Team who creates, reviews, and submits the team. A Quest Team Leader exists only for `GROUP + CANDIDATE`; `GROUP + NO_CANDIDATE` has no team or leader.

**Team Invitation**:
An invitation from a Quest Team Leader to a KU Account Holder found through KU-member search. It lasts 24 hours; a declined or expired invitation may be replaced before the team roster is submitted, but no invitation can change a locked roster.

**Sign-in**:
Single action that authenticates a KU Account Holder via Google OAuth (Better Auth), restricted to the `ku.th` email domain. There is no separate registration step — the first successful sign-in creates the KU Account Holder record automatically.
_Avoid_: Sign-up, login, register

**Onboarding**:
Legacy name for the first-run experience after a Student's first sign-in. The canonical user-facing term is Academic Registration.
_Avoid_: Using Onboarding for the canonical Academic Registration flow.

**Academic Registration**:
The canonical first-run flow and resulting academic record where a Student supplies the academic and contact details needed before using the main app. Only Students complete Academic Registration; it is not a separate sign-up step.
_Avoid_: Onboarding, setup, sign-up

**KU Account Holder Profile**:
A KU Account Holder's biographical and publicly useful information, including profile text, avatar, portfolio work, certificates, and eligible Quest Reviews. The Profile is visible to all authenticated KU Account Holders. Academic Registration supplies required Student-specific academic identity fields but is a separate record.
_Avoid_: Student Profile, account profile, registration profile

**Experience**:
A chronological record of a KU Account Holder's work, tutoring, internship, or other background entries shown on the KU Account Holder Profile. Experience is distinct from Portfolio Work, which showcases individual projects.
_Avoid_: Work, portfolio item, job history

**Portfolio Work**:
A project or achievement showcased by a KU Account Holder as part of their KU Account Holder Profile, optionally with an image and description.
_Avoid_: Experience, job, task

**Review**:
Reciprocal feedback between a Hirer and each Worker after an eligible completed Quest relationship, displayed as public KU Account Holder Profile information. Reviews contribute to the reviewed KU Account Holder's aggregate Profile Rating when the review is eligible.
_Avoid_: Comment, testimonial, message

**Profile Rating**:
An aggregate score and count derived from eligible Quest Reviews and displayed on the reviewed KU Account Holder Profile.
_Avoid_: Quest score, user score

**Certificate Preview**:
The touch interaction that opens a certificate image from its green certificate icon without replacing the certificate summary row.
_Avoid_: Hover preview, certificate attachment

**Faculty** / **Department**:
A Department belongs to exactly one Faculty. Both are seeded server-side and picked from a fixed list during Academic Registration.

**Academic Year**:
The numeric year of study/admission entered during Academic Registration — not a calendar year.

**Quest**:
A work opportunity created and funded by a Hirer for KU Account Holders to discover, apply for, accept, and complete under the app's quest rules.
_Avoid_: Job, task, gig

**Quest Lifecycle State**:
The current state of a Quest, which determines its visibility and whether it can accept additional Workers. The exact canonical adapter values are `QUEST_DRAFT`, `QUEST_OPEN`, `QUEST_ASSIGNED`, `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`, `QUEST_AWAITING_EDIT_CONSENT`, `QUEST_IN_PROGRESS`, and `QUEST_CANCELLED`; `QUEST_AWAITING_CONSENT` is a legacy generic value only.

**DRAFT**:
The initial Quest Lifecycle State (`QUEST_DRAFT`) before the Hirer publishes the Quest. A DRAFT Quest is not shown on the Quest Board.

**OPEN**:
The Quest Lifecycle State (`QUEST_OPEN`) after the Hirer publishes a Quest and before its start time, while direct capacity or Candidate Selection remains available. An OPEN Quest is shown on the Quest Board and can accept direct joins, individual Proposals, or forming/submitted team Proposals according to its combination.

**ASSIGNED**:
The Quest Lifecycle State (`QUEST_ASSIGNED`) reached before the start time when its admitted or selected roster is fixed. It is hidden from the Quest Board, cannot accept additional Workers, and becomes IN_PROGRESS at the start time; a selected Candidate team may have Actual Headcount below Requested Headcount.

**AWAITING_CONSENT**:
A legacy umbrella label for older data, formerly exposed as `QUEST_AWAITING_CONSENT`, that does not distinguish consent purpose and must not be emitted by the adapter. New data uses `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT` for a partial direct Group start and `QUEST_AWAITING_EDIT_CONSENT` for an edit request.

**QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT**:
The canonical state at start time when a `GROUP + NO_CANDIDATE` Quest has a non-empty roster below Requested Headcount. The roster is frozen for 5 minutes while the Hirer and every joined Worker must unanimously approve; rejection or timeout produces `CANCELLED`.

**QUEST_AWAITING_EDIT_CONSENT**:
The canonical state while a Hirer-requested Quest edit awaits a 5-minute unanimous vote from every active Worker. Approval applies the changes and restores the previous state; rejection or timeout discards them and rolls back to that state.

**IN_PROGRESS**:
The Quest Lifecycle State (`QUEST_IN_PROGRESS`) in which the fixed Actual Headcount performs the Quest after the start time, either with a full roster, after Candidate Selection, or after approved Partial-Start Consent. An IN_PROGRESS Quest is hidden from the Quest Board and cannot accept additional Workers.

**CANCELLED**:
The terminal Quest Lifecycle State (`QUEST_CANCELLED`) for a Quest that will not start or has been cancelled. A pre-start cancellation has no active Assignments, gives a full refund, and makes any Work Chat read-only.

**Worker Consent**:
A Worker's approval vote in a Partial-Start Consent. It is distinct from Edit Consent and is sufficient only when the Hirer and every other joined Worker also approve.

**Partial-Start Consent**:
A 5-minute unanimous approval gate for a non-empty partial `GROUP + NO_CANDIDATE` roster at start time. The required voters are the Hirer and all joined Workers; approval starts the Quest at Actual Headcount, while rejection or timeout cancels it with a full refund.

**Edit Consent**:
A 5-minute unanimous vote by active Workers on a Hirer-requested editable Quest change. Rejection or timeout discards the changes and restores the previous lifecycle state; the Hirer does not vote in this worker-only consent.

**Quest Funding**:
The Hirer's reservation of the per-Worker reward for every Requested Headcount place before a Quest becomes Discoverable. Settlement pays Actual Headcount and refunds reserved places that were not used.

**Quest Cancellation**:
The ending of a Quest before its expected completion. A pre-start `CANCELLED` Quest receives a full refund, has no active Assignments, and cannot admit new Workers; later cancellation follows the applicable Quest cancellation policy.

**Actual Settlement**:
The reward and refund result calculated from Actual Headcount: pay one reward for each Worker in the fixed roster and return the reserved reward for each Requested Headcount place not used.

**Work Chat**:
The shared Quest conversation for the Hirer and admitted or selected Workers. Its membership and capability come from the Canonical Quest Adapter; it opens on the first direct Group join or after Candidate Selection, remains writable for active participants and while partial-start consent is pending, and becomes read-only after cancellation or another terminal state. Prototype messages are session-only and are cleared by Fixture Reset.

**Quest Board**:
The main discovery area where available Quests are presented to KU Account Holders seeking to perform them.
_Avoid_: Home, marketplace, feed

**My Quests**:
The area where a KU Account Holder tracks Quests they created as a Hirer, applied to as an Applicant, or perform as a Worker. A Hirer's own Quests are managed here rather than displayed on that Hirer's Quest Board.
_Avoid_: My jobs, saved quests, quest history

**Quest Card**:
A compact Quest Board summary that lets a KU Account Holder compare a Quest's title, reward, description, timing, tags, and participation mode before opening its details. A Quest Card is shown on the Quest Board only while the Quest is OPEN.
_Avoid_: Quest preview, job card

**Quest Detail**:
The focused view for one Quest, where a KU Account Holder can review its complete requirements and lifecycle-appropriate next action before applying or participating.
_Avoid_: Quest modal, job detail

**Quest Board Filter**:
A temporary constraint applied to Quest Board results using facets such as category, tag, reward bounds, deadline, start-time bucket, or location.
_Avoid_: Quest search, Quest filter

**Quest Tag**:
A descriptive label attached to a Quest that helps a KU Account Holder identify its subject or context.
_Avoid_: Category, keyword

**Reward Bounds**:
The minimum and maximum per-person reward a KU Account Holder is willing to consider for a Quest; either bound may be absent.
_Avoid_: Wage range, salary range

**Start-Time Bucket**:
A broad time-of-day classification based on when a Quest begins: Morning, Afternoon, or Evening.
_Avoid_: Schedule range, deadline

**Quest Board Sort**:
The ordering rule applied to visible Quest Board results, such as recommendation, recency, deadline, or reward.
_Avoid_: Quest filter, ranking

**Discoverable Quest**:
A published Quest that is still within its participation window and is eligible to appear in the Quest Board for a KU Account Holder seeking to perform it.
_Avoid_: Open job, active task

**Quest Board Fixture**:
A deterministic record in the `questFixtures` catalog used to exercise the Quest Board's populated, filtered, empty, loading, failure, and hidden scenario states before live Quest APIs are connected. Fixtures are projected through the Canonical Quest Adapter rather than treated as a backend contract.
_Avoid_: Mock production Quest, fake Quest

**Canonical Quest Adapter**:
The `questFixtureAdapter` local prototype boundary and canonical source for Quest, Quest Team, Candidate Proposal/Quest Application, invitation, Assignment, Work Chat membership/capability/messages, consent, and requested-versus-actual headcount behavior. It replaces the legacy application stores and static domain fallbacks, which must be removed, and is authoritative for the prototype only; its fields and transitions remain provisional pending the backend contract.

**Prototype Scenario**:
A hidden, route-addressable fixture in `questFixtures` for exercising one behavior without appearing in normal Quest Board discovery. The four scenarios are `team-forming-demo`, `team-selection-demo`, `single-candidate-demo`, and `partial-group-start-demo`.

**Prototype Persona**:
One of four deterministic scenario identities—Hirer, Applicant, Quest Team Leader, or Worker—used to exercise adapter actions against the hidden scenarios. Personas are fixture identities, not production accounts.

**Fixture Reset**:
The `questFixtureAdapter.reset()` operation that restores all four scenario personas and their Teams, Proposals, invitations, Assignments, consent, settlement, chat membership, and session messages to deterministic seed state. It does not create a second draft store.

**Quest Draft Persistence**:
Draft storage through SecureStore only, separate from fixture and adapter state. Drafts are not stored in `src/data/localDemo`, the Quest catalog, or adapter chat state; the `src/data/localDemo` path must be deleted rather than retained as a fallback.

**Quest Review Sheet**:
The shared existing bottom-sheet surface used to review a Quest summary and publish checks before publishing, without adding a new dependency.

**Recommended Ordering**:
The Quest Board ordering that prioritizes a KU Account Holder's declared interests, then earlier deadlines, then newer postings when the values are otherwise equal.
_Avoid_: Random order, popularity sort

**Quest Application**:
The transport-compatible persisted record for an individual Candidate Proposal in a `SINGLE + CANDIDATE` Quest. It may be pending, withdrawn before Selection and replaced by a new Proposal, selected, or rejected; a rejected Proposal cannot be resubmitted and Applications are not used for direct joins or team Proposals.
_Avoid_: Booking, acceptance

**Application Pending**:
The state in which an Applicant's individual Quest Application is awaiting the Hirer's Selection for a `SINGLE + CANDIDATE` Quest.
_Avoid_: Saved Quest, accepted Quest

**Accepted Participant**:
A Worker who joined directly under `NO_CANDIDATE` or was selected by the Hirer under `CANDIDATE`. A pending Applicant or invited team member is not an Accepted Participant.
_Avoid_: Applicant, assignee

**Quest Assignment**:
The Quest relationship created for every Worker admitted by direct join or Candidate Selection. Each Worker in a selected Quest Team receives a separate Quest Assignment, Actual Headcount counts the fixed roster, and a KU Account Holder may have at most one active membership or pending Candidate Proposal for a Quest; active Assignments are removed when a partial start is cancelled.

**CANCELLED Assignment**:
A retained historical record for a Quest Assignment that cannot proceed because its Quest became `CANCELLED`. A Worker with a CANCELLED Assignment does not perform that Quest.

**Quest Completion**:
The Hirer's confirmation that a specific Worker has completed their Quest Assignment. Group Workers may complete and receive confirmation independently.

**Quest Full**:
The availability state in which a direct or selected roster has reached Requested Headcount and cannot admit another Worker or selected team. A partial submitted Candidate Team is still selectable and does not make the Quest full before Selection.
_Avoid_: Closed Quest, completed Quest

**Applications Closed**:
The availability state in which a Quest's application deadline has passed and new Quest Applications or team Proposals cannot be submitted.
_Avoid_: Expired Quest, completed Quest

**Ending Soon**:
A discoverable Quest whose application deadline is within three days and therefore deserves heightened timing emphasis in the Board UI.
_Avoid_: Urgent Quest, overdue Quest
