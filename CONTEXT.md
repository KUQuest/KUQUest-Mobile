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
A Quest setting that determines whether exactly one Worker (SINGLE) or multiple Workers (GROUP) may join. SINGLE always has one Worker; GROUP supports multiple Workers.

**Headcount**:
The maximum number of Workers a Quest can admit. Headcount is a capacity limit, not a minimum required number of Workers before the Quest can start.

**Mode**:
A Quest setting that determines whether Workers join directly in arrival order (FIRST_COME_FIRST_SERVED) or are selected by the Hirer after applying (CANDIDATE).

**Single Quest**:
A Quest with SINGLE Participation. It always has exactly one Worker.

**Group Quest**:
A Quest with GROUP Participation. It supports multiple Workers, with capacity and rewards counted per Worker. GROUP + CANDIDATE forms a Quest Team; GROUP + FIRST_COME_FIRST_SERVED does not create a team.

**First-Come-First-Served Mode**:
A Quest Mode in which eligible Workers join directly in arrival order until the headcount is reached. No application or team is needed.

**Candidate Mode**:
A Quest Mode in which individual KU Account Holders apply for a SINGLE Quest and the Hirer selects one Worker, or a Quest Team applies for a GROUP Quest and the Hirer selects one team.

**Quest Team**:
A group of KU Account Holders formed by a Quest Team Leader to submit one proposal for a GROUP + CANDIDATE Quest. The Hirer selects the team as one unit; after selection, every member becomes a Worker and receives a separate Quest Assignment.

**Quest Team Leader**:
The member of a Quest Team who creates the team. A Quest Team Leader exists only for GROUP + CANDIDATE; GROUP + FIRST_COME_FIRST_SERVED has no team or leader.

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
The current state of a Quest, which determines its visibility and whether it can accept additional Workers. The states are DRAFT, OPEN, ASSIGNED, AWAITING_CONSENT, IN_PROGRESS, and UNFILLED.

**DRAFT**:
The initial Quest Lifecycle State before the Hirer publishes the Quest. A DRAFT Quest is not shown on the Quest Board.

**OPEN**:
The Quest Lifecycle State after the Hirer publishes a Quest and before its start time, while it has available capacity. An OPEN Quest is shown on the Quest Board and can accept Workers; headcount is a maximum, not a minimum.

**ASSIGNED**:
The Quest Lifecycle State reached before the start time when the Quest has Workers equal to its headcount. An ASSIGNED Quest is hidden from the Quest Board and cannot accept additional Workers; it becomes IN_PROGRESS at the start time.

**AWAITING_CONSENT**:
The Quest Lifecycle State reached at the start time when the Quest has at least one Worker but fewer Workers than its headcount. The Quest is hidden from the Quest Board and waits up to 15 minutes for the existing Workers to give Consent to start with the incomplete headcount.

**IN_PROGRESS**:
The Quest Lifecycle State in which the existing Workers perform the Quest after the start time, either with a full headcount or after the required Consent to start with an incomplete headcount. An IN_PROGRESS Quest is hidden from the Quest Board and cannot accept additional Workers.

**UNFILLED**:
The Quest Lifecycle State in which a Quest cannot begin because it has no Worker at the start time, a Worker does not give Consent, or Consent is not complete within 15 minutes. An UNFILLED Quest is closed and does not begin; its existing Quest Assignments become cancelled.

**Worker Consent**:
A Worker's confirmation that the Quest may begin with the Workers currently assigned, even when the Quest has not reached its headcount.

**Quest Funding**:
The Hirer's reservation of the full per-Worker reward for every available place before a Quest becomes Discoverable. A Group Quest reserves a separate reward for each Worker place.

**Quest Cancellation**:
The ending of a Quest before its expected completion. Reserved funds for unfilled places or a cancelled Quest are returned to the Hirer unless a Worker has completed the Quest and earned that reward.

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
Deterministic local Quest data used to exercise the Quest Board's populated, filtered, empty, loading, and failure states before live Quest APIs are connected.
_Avoid_: Mock production Quest, fake Quest

**Recommended Ordering**:
The Quest Board ordering that prioritizes a KU Account Holder's declared interests, then earlier deadlines, then newer postings when the values are otherwise equal.
_Avoid_: Random order, popularity sort

**Quest Application**:
An individual Applicant's request to participate in a SINGLE + CANDIDATE Quest. It may be pending selection, selected, or unavailable because the Quest is full or closed; it is not used for other Participation + Mode combinations.
_Avoid_: Booking, acceptance

**Application Pending**:
The state in which an Applicant's Quest Application is awaiting the Hirer's selection for a SINGLE + CANDIDATE Quest.
_Avoid_: Saved Quest, accepted Quest

**Accepted Participant**:
A Worker who has joined directly under FIRST_COME_FIRST_SERVED or has been selected by the Hirer under CANDIDATE.
_Avoid_: Applicant, assignee

**Quest Assignment**:
The Quest relationship created immediately for every Worker who joins directly or is selected. Each Worker in a selected Quest Team receives a separate Quest Assignment, and a KU Account Holder may have at most one active membership or pending candidature for a Quest. Existing Quest Assignments become CANCELLED when the Quest becomes UNFILLED.

**CANCELLED Assignment**:
A Quest Assignment that cannot proceed because its Quest became UNFILLED. A Worker with a CANCELLED Assignment does not perform that Quest.

**Quest Completion**:
The Hirer's confirmation that a specific Worker has completed their Quest Assignment. Group Workers may complete and receive confirmation independently.

**Quest Full**:
The availability state in which a Quest has reached its accepted Worker capacity and cannot admit another Worker or selected team.
_Avoid_: Closed Quest, completed Quest

**Applications Closed**:
The availability state in which a Quest's application deadline has passed and new Quest Applications cannot be submitted.
_Avoid_: Expired Quest, completed Quest

**Ending Soon**:
A discoverable Quest whose application deadline is within three days and therefore deserves heightened timing emphasis in the Board UI.
_Avoid_: Urgent Quest, overdue Quest
