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
One-time flow after a Student's first sign-in that collects academic details (telephone, major, student ID, academic year) before the Student can use the main app. Gated by the onboarding status flag.
_Avoid_: Setup, registration

**Academic Registration**:
The server-side record of the academic details that complete Onboarding. It is not a separate user-facing step.
_Avoid_: Registration flow, sign-up

**Student Profile**:
The Student's biographical and publicly useful information, including profile text, avatar, portfolio work, and certificates. Academic Registration supplies the required academic identity fields but is a separate record.
_Avoid_: Account profile, registration profile

**Faculty** / **Major**:
A Major belongs to exactly one Faculty. Both are seeded server-side and picked from a fixed list during onboarding.

**Academic Year**:
The numeric year of study/admission entered during onboarding — not a calendar year.
