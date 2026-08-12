# KUQuest Mobile

Mobile app for KU (Kasetsart University) students.

## Language

**Student**:
Authenticated app user — a KU student identified by a verified `@ku.th` Google account.
_Avoid_: User, account, customer

**Sign-in**:
Single action that authenticates a Student via Google OAuth (Better Auth), restricted to the `ku.th` email domain. There is no separate registration step — the first successful sign-in creates the Student record automatically.
_Avoid_: Sign-up, login, register

**Onboarding**:
Legacy name for the first-run experience after a Student's first sign-in. The canonical user-facing term is Academic Registration.
_Avoid_: Using Onboarding for the canonical Academic Registration flow.

**Academic Registration**:
The canonical first-run flow and resulting academic record where a Student supplies the academic and contact details needed before using the main app. It is not a separate sign-up step.
_Avoid_: Onboarding, setup, sign-up

**Student Profile**:
The Student's biographical and publicly useful information, including profile text, avatar, portfolio work, and certificates. Academic Registration supplies the required academic identity fields but is a separate record.
_Avoid_: Account profile, registration profile

**Experience**:
A chronological record of a Student's work, tutoring, internship, or other background entries shown on the Student Profile. Experience is distinct from Portfolio Work, which showcases individual projects.
_Avoid_: Work, portfolio item, job history

**Portfolio Work**:
A project or achievement showcased by a Student as part of their Student Profile, optionally with an image and description.
_Avoid_: Experience, job, task

**Review**:
Feedback associated with an eligible completed Quest relationship and displayed as public Student Profile information. Reviews contribute to the Student's aggregate Profile Rating when the review is eligible.
_Avoid_: Comment, testimonial, message

**Profile Rating**:
An aggregate score and count derived from eligible Quest Reviews and displayed on the Student Profile.
_Avoid_: Quest score, user score

**Certificate Preview**:
The touch interaction that opens a certificate image from its green certificate icon without replacing the certificate summary row.
_Avoid_: Hover preview, certificate attachment

**Faculty** / **Department**:
A Department belongs to exactly one Faculty. Both are seeded server-side and picked from a fixed list during Academic Registration.

**Academic Year**:
The numeric year of study/admission entered during Academic Registration — not a calendar year.

**Quest**:
A work opportunity posted for a Student to discover, accept, and complete under the app's quest rules.
_Avoid_: Job, task, gig

**Quest Board**:
The main discovery area where available Quests are presented to Students.
_Avoid_: Home, marketplace, feed

**My Quests**:
The area where a Student tracks Quests they have created, accepted, or otherwise have a relationship with.
_Avoid_: My jobs, saved quests, quest history

**Quest Card**:
A compact Quest Board summary that lets a Student compare a Quest's title, reward, timing, tags, and participation mode before opening its details.
_Avoid_: Quest preview, job card

**Quest Detail**:
The focused view for one Quest, where a Student can review its complete requirements and lifecycle-appropriate next action before committing to participate.
_Avoid_: Quest modal, job detail

**Quest Board Filter**:
A temporary constraint applied to the Quest Board results, such as category, reward range, deadline, or participation mode.
_Avoid_: Quest search, Quest sort

**Quest Board Sort**:
The ordering rule applied to visible Quest Board results, such as recommendation, recency, deadline, or reward.
_Avoid_: Quest filter, ranking

**Discoverable Quest**:
A published Quest that is still within its participation window and is eligible to appear in the Quest Board for a Student.
_Avoid_: Open job, active task

**Quest Board Fixture**:
Deterministic local Quest data used to exercise the Quest Board's populated, filtered, empty, loading, and failure states before live Quest APIs are connected.
_Avoid_: Mock production Quest, fake Quest

**Recommended Ordering**:
The Quest Board ordering that prioritizes a Student's declared interests, then earlier deadlines, then newer postings when the values are otherwise equal.
_Avoid_: Random order, popularity sort

**Quest Application**:
A Student's request to participate in a Quest. An application may be pending review, accepted according to the Quest's candidate mode, or unavailable because the Quest is full or closed.
_Avoid_: Booking, acceptance

**Application Pending**:
The state in which a Student has submitted a Quest Application but the Quest creator or its first-come rule has not produced a final participation outcome.
_Avoid_: Saved Quest, accepted Quest

**Accepted Participant**:
A Student whose Quest Application has been admitted to participate in the Quest under its capacity and candidate rules.
_Avoid_: Applicant, assignee

**Quest Full**:
The availability state in which a Quest has reached its accepted participant capacity and cannot admit another Student.
_Avoid_: Closed Quest, completed Quest

**Applications Closed**:
The availability state in which a Quest's application deadline has passed and new Quest Applications cannot be submitted.
_Avoid_: Expired Quest, completed Quest

**Ending Soon**:
A discoverable Quest whose application deadline is within three days and therefore deserves heightened timing emphasis in the Board UI.
_Avoid_: Urgent Quest, overdue Quest
