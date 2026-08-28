import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  EDIT_CONSENT_WINDOW_MS,
  formatConsentCountdown,
  getConsentRemainingMs,
  PARTIAL_GROUP_START_CONSENT_WINDOW_MS,
  questFixtureAdapter,
  createQuestFixtureAdapter,
  type QuestFixtureCreateInput,
} from '../questFixtureAdapter';
import {
  QuestApplicationStatus,
  QuestEditRequestStatus,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
} from '../types';

describe('Quest fixture adapter', () => {
  const fixedNow = new Date('2026-08-12T09:00:00.000Z');
  const directGroupStart = new Date('2026-08-13T09:00:00.000Z');
  const createPayload: QuestFixtureCreateInput = {
    title: 'Organise the campus archive',
    tag: 'campus-life',
    description: 'Sort the archive boxes into the labelled shelves.',
    conditions: 'Every box is on the matching shelf.',
    proofRequired: 'optional',
    startDate: '2099-08-26',
    deadline: '2099-08-27',
    startTime: '09:00',
    endTime: '12:00',
    location: { label: 'Student activity building' },
    candidateMode: 'NO_CANDIDATE',
    participation: 'GROUP',
    headcount: 3,
    rewardSatang: 12550,
    imageUris: ['fixture://archive'],
  };

  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it('keeps raw lifecycle values and performs a direct solo join in the adapter', () => {
    const before = questFixtureAdapter.getState('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(before?.quest.status).toBe(QuestStatus.QUEST_OPEN);
    expect(before?.quest.reward.rewardSatang).toBe(8000);

    const result = questFixtureAdapter.joinDirect('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
      expect(result.state.assignments).toHaveLength(1);
      expect(result.state.conversation.conversationId).toBe('conversation-fixture-print-documents');
      expect(result.state.capabilities.canWriteConversation).toBe(true);
    }
  });

  it('keeps a partially filled direct group Quest open until capacity is reached', () => {
    const result = questFixtureAdapter.joinDirect('clean-fan', 'demo-worker-3', fixedNow);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
      expect(result.state.assignments).toHaveLength(1);
    }
  });

  it('creates and publishes a valid Quest into the Hirer state and removes it on reset', () => {
    const result = questFixtureAdapter.createAndPublishQuest(createPayload, 'demo-hirer', fixedNow);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.quest).toEqual(expect.objectContaining({
      status: QuestStatus.QUEST_OPEN,
      hirerId: 'demo-hirer',
      participation: 'GROUP',
      candidateMode: 'NO_CANDIDATE',
      headcount: 3,
      requestedHeadcount: 3,
      title: createPayload.title,
    }));
    expect(result.state.quest.reward.rewardSatang).toBe(createPayload.rewardSatang);
    expect(result.state.settlement).toBeUndefined();
    expect(questFixtureAdapter.getPublishCheck(result.state.quest.id, fixedNow)?.escrow).toEqual(expect.objectContaining({
      headcount: 3,
      rewardPoolSatang: 37650,
      platformFeeSatang: 1884,
      totalRequiredSatang: 39534,
    }));
    expect(questFixtureAdapter.getState(result.state.quest.id, 'demo-hirer', fixedNow)?.quest.status).toBe(QuestStatus.QUEST_OPEN);
    expect(questFixtureAdapter.listStates('demo-hirer', fixedNow).some((state) => state.quest.id === result.state.quest.id)).toBe(true);

    questFixtureAdapter.reset();
    expect(questFixtureAdapter.getState(result.state.quest.id, 'demo-hirer', fixedNow)).toBeNull();
  });

  it('keeps create and publish headcount invariants and blocks invalid payloads', () => {
    const validSingle = questFixtureAdapter.createAndPublishQuest({ ...createPayload, participation: 'SOLO', headcount: 1 }, 'demo-hirer', fixedNow);
    expect(validSingle.ok).toBe(true);
    if (validSingle.ok) {
      expect(validSingle.state.quest.participation).toBe('SINGLE');
      expect(validSingle.state.quest.headcount).toBe(1);
    }

    questFixtureAdapter.reset();
    const invalidSingle = questFixtureAdapter.createAndPublishQuest({ ...createPayload, participation: 'SOLO', headcount: 2 }, 'demo-hirer', fixedNow);
    expect(invalidSingle.ok).toBe(false);
    if (!invalidSingle.ok) expect(invalidSingle.error).toEqual(expect.objectContaining({ code: 'PUBLISH_BLOCKED' }));

    const invalidGroup = questFixtureAdapter.createAndPublishQuest({ ...createPayload, headcount: 0 }, 'demo-hirer', fixedNow);
    expect(invalidGroup.ok).toBe(false);
    if (!invalidGroup.ok) expect(invalidGroup.error).toEqual(expect.objectContaining({ code: 'PUBLISH_BLOCKED' }));

    expect(questFixtureAdapter.listStates('demo-hirer', fixedNow).some((state) => state.quest.title === createPayload.title)).toBe(false);
  });

  it('creates and publishes through the typed adapter action without storing a draft', () => {
    const created = questFixtureAdapter.createQuest(createPayload, 'demo-hirer', fixedNow);

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
    expect(created.state.capabilities.availableActions).toContain('CANCEL');

    questFixtureAdapter.reset();
    const dispatched = questFixtureAdapter.dispatch({ type: 'CREATE_AND_PUBLISH', payload: createPayload, hirerId: 'demo-hirer' }, fixedNow);
    expect(dispatched.ok).toBe(true);
    if (dispatched.ok) expect(dispatched.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
  });

  it('projects an assigned Quest into progress at start time without mutating the fixture', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const beforeStart = created.getState('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID, new Date('2026-08-13T09:59:59.999Z'));
    const atStart = created.getState('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID, new Date('2026-08-13T10:00:00.000Z'));

    expect(beforeStart?.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
    expect(atStart?.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
    expect(atStart?.assignments[0]?.startedAt).toBe(atStart?.quest.startAt);
    expect(atStart?.capabilities.availableActions).toContain('CONFIRM_COMPLETION');

    const stored = created.getState('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(stored?.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
    expect(stored?.assignments[0]?.startedAt).toBeUndefined();
  });

  it('opens canonical partial-start consent with a frozen direct-group roster', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const joined = created.joinDirect('clean-fan', 'demo-worker-3', fixedNow);
    expect(joined.ok).toBe(true);

    const atStart = created.getState('clean-fan', 'demo-worker-3', directGroupStart);
    expect(atStart?.quest.status).toBe(QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT);
    expect(atStart?.actualHeadcount).toBe(1);
    expect(atStart?.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_PENDING);
    expect(atStart?.partialStartConsent?.requiredVoterIds).toEqual(['student-creator-2', 'demo-worker-3']);
    expect(atStart?.partialStartConsent?.frozenWorkerIds).toEqual(['demo-worker-3']);
    expect(atStart?.partialStartConsent?.responseDeadlineAt).toBe('2026-08-13T09:05:00.000Z');
    expect(getConsentRemainingMs(atStart?.partialStartConsent, directGroupStart)).toBe(PARTIAL_GROUP_START_CONSENT_WINDOW_MS);
    expect(atStart?.conversation.canWrite).toBe(true);
    expect(atStart?.capabilities.availableActions).toContain('VOTE_PARTIAL_GROUP_START_CONSENT');
    expect(atStart?.capabilities.availableActions).not.toContain('DIRECT_JOIN');
    expect(created.listBoardQuests('demo-worker-3', directGroupStart).some((quest) => quest.id === 'clean-fan')).toBe(false);

    const lateJoin = created.joinDirect('clean-fan', 'demo-worker-4', new Date(directGroupStart.getTime() + 60_000));
    expect(lateJoin.ok).toBe(false);
    if (!lateJoin.ok) {
      expect(lateJoin.error.code).toBe('INVALID_STATUS');
      expect(lateJoin.state.quest.status).toBe(QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT);
      expect(lateJoin.state.assignments).toHaveLength(1);
      expect(lateJoin.state.partialStartConsent?.frozenWorkerIds).toEqual(['demo-worker-3']);
    }
  });

  it('starts a partial direct Group after unanimous Hirer and Worker approval', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const joined = created.joinDirect('clean-fan', 'demo-worker-3', fixedNow);
    expect(joined.ok).toBe(true);

    const hirerVote = created.votePartialGroupStartConsent('clean-fan', 'student-creator-2', true, directGroupStart);
    expect(hirerVote.ok).toBe(true);
    if (!hirerVote.ok) return;
    expect(hirerVote.state.quest.status).toBe(QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT);
    expect(hirerVote.state.partialStartConsent?.approvedVoterCount).toBe(1);
    expect(hirerVote.state.partialStartConsent?.responses[0]?.role).toBe('HIRER');

    const workerVote = created.votePartialGroupStartConsent('clean-fan', 'demo-worker-3', true, new Date(directGroupStart.getTime() + 4 * 60_000));
    expect(workerVote.ok).toBe(true);
    if (workerVote.ok) {
      expect(workerVote.state.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
      expect(workerVote.state.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_APPROVED);
      expect(workerVote.state.partialStartConsent?.approvedVoterCount).toBe(2);
      expect(workerVote.state.actualHeadcount).toBe(1);
      expect(workerVote.state.assignments).toHaveLength(1);
      expect(workerVote.state.assignments[0]?.startedAt).toBe('2026-08-13T09:00:00.000Z');
      expect(workerVote.state.settlement).toMatchObject({
        requestedHeadcount: 2,
        actualHeadcount: 1,
        rewardSatangPerWorker: 15000,
        reservedRewardSatang: 30000,
        settledRewardSatang: 15000,
        refundSatang: 15000,
        fullRefund: false,
      });
      expect(workerVote.state.conversation.canWrite).toBe(true);
    }
  });

  it('cancels a partial direct Group immediately on rejection with a full refund', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const joined = created.joinDirect('clean-fan', 'demo-worker-3', fixedNow);
    expect(joined.ok).toBe(true);

    const rejected = created.votePartialGroupStartConsent('clean-fan', 'demo-worker-3', false, directGroupStart);
    expect(rejected.ok).toBe(true);
    if (rejected.ok) {
      expect(rejected.state.quest.status).toBe(QuestStatus.QUEST_CANCELLED);
      expect(rejected.state.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_REJECTED);
      expect(rejected.state.assignments).toHaveLength(0);
      expect(rejected.state.actualHeadcount).toBe(0);
      expect(rejected.state.settlement).toMatchObject({
        requestedHeadcount: 2,
        actualHeadcount: 0,
        reservedRewardSatang: 30000,
        settledRewardSatang: 0,
        refundSatang: 30000,
        fullRefund: true,
      });
      expect(rejected.state.conversation.canRead).toBe(true);
      expect(rejected.state.conversation.canWrite).toBe(false);
      expect(rejected.state.conversation.readOnly).toBe(true);
      expect(rejected.state.conversation.readOnlyReason).toBe('TERMINAL');
    }

    const lateJoin = created.joinDirect('clean-fan', 'demo-worker-4', new Date(directGroupStart.getTime() + 60_000));
    expect(lateJoin.ok).toBe(false);
    if (!lateJoin.ok) {
      expect(lateJoin.error.code).toBe('INVALID_STATUS');
      expect(lateJoin.state.quest.status).toBe(QuestStatus.QUEST_CANCELLED);
      expect(lateJoin.state.assignments).toHaveLength(0);
    }
  });

  it('times out partial direct Group consent after exactly five minutes', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const joined = created.joinDirect('clean-fan', 'demo-worker-3', fixedNow);
    expect(joined.ok).toBe(true);
    const opened = created.votePartialGroupStartConsent('clean-fan', 'student-creator-2', true, directGroupStart);
    expect(opened.ok).toBe(true);

    const justBeforeTimeout = created.getState('clean-fan', 'demo-worker-3', new Date(directGroupStart.getTime() + PARTIAL_GROUP_START_CONSENT_WINDOW_MS - 1));
    expect(justBeforeTimeout?.quest.status).toBe(QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT);
    expect(justBeforeTimeout?.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_PENDING);
    const oneMillisecondRemaining = new Date(directGroupStart.getTime() + PARTIAL_GROUP_START_CONSENT_WINDOW_MS - 1);
    expect(getConsentRemainingMs(justBeforeTimeout?.partialStartConsent, oneMillisecondRemaining)).toBe(1);
    expect(formatConsentCountdown(justBeforeTimeout?.partialStartConsent, oneMillisecondRemaining)).toBe('00:01');

    const atTimeout = created.getState('clean-fan', 'demo-worker-3', new Date(directGroupStart.getTime() + PARTIAL_GROUP_START_CONSENT_WINDOW_MS));
    expect(atTimeout?.quest.status).toBe(QuestStatus.QUEST_CANCELLED);
    expect(atTimeout?.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT);
    expect(atTimeout?.assignments).toHaveLength(0);
    expect(atTimeout?.settlement).toMatchObject({ actualHeadcount: 0, refundSatang: 30000, fullRefund: true });
    expect(atTimeout?.conversation.canWrite).toBe(false);
    expect(atTimeout?.conversation.readOnlyReason).toBe('TERMINAL');

    const stored = created.getState('clean-fan', 'demo-worker-3', fixedNow);
    expect(stored?.quest.status).toBe(QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT);
    expect(stored?.assignments).toHaveLength(1);
    expect(stored?.partialStartConsent?.status).toBe(QuestPartialStartConsentStatus.PARTIAL_START_PENDING);
  });

  it('cancels an empty direct Group at start with no assignments or writable chat', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const atStart = created.getState('clean-fan', 'student-creator-2', directGroupStart);

    expect(atStart?.quest.status).toBe(QuestStatus.QUEST_CANCELLED);
    expect(atStart?.assignments).toHaveLength(0);
    expect(atStart?.actualHeadcount).toBe(0);
    expect(atStart?.settlement).toMatchObject({
      requestedHeadcount: 2,
      actualHeadcount: 0,
      reservedRewardSatang: 30000,
      settledRewardSatang: 0,
      refundSatang: 30000,
      fullRefund: true,
    });
    expect(atStart?.conversation.conversationId).toBeNull();
    expect(atStart?.conversation.canRead).toBe(false);
    expect(atStart?.conversation.canWrite).toBe(false);
    expect(atStart?.conversation.readOnly).toBe(true);

    const lateJoin = created.joinDirect('clean-fan', 'demo-worker-3', directGroupStart);
    expect(lateJoin.ok).toBe(false);
    if (!lateJoin.ok) expect(lateJoin.error.code).toBe('INVALID_STATUS');
  });

  it('projects a renamed edit-consent timeout back to its prior status without mutating it', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const beforeTimeout = created.getState('walk-together', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    const justBeforeTimeout = created.getState('walk-together', DEFAULT_PROTOTYPE_VIEWER_ID, new Date('2026-08-12T09:04:59.999Z'));
    const atTimeout = created.getState('walk-together', DEFAULT_PROTOTYPE_VIEWER_ID, new Date('2026-08-12T09:05:00.000Z'));

    expect(beforeTimeout?.quest.status).toBe(QuestStatus.QUEST_AWAITING_EDIT_CONSENT);
    expect(justBeforeTimeout?.quest.status).toBe(QuestStatus.QUEST_AWAITING_EDIT_CONSENT);
    expect(justBeforeTimeout?.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_PENDING);
    expect(beforeTimeout?.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_PENDING);
    expect(beforeTimeout?.capabilities.availableActions).toContain('VOTE_EDIT_CONSENT');
    expect(atTimeout?.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
    expect(atTimeout?.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_REJECTED);
    expect(atTimeout?.quest.location.label).toBe('สวนวชิรเบญจทัศ');
    expect(atTimeout?.capabilities.availableActions).not.toContain('VOTE_EDIT_CONSENT');

    const timedOutVote = created.voteEditConsent('walk-together', DEFAULT_PROTOTYPE_VIEWER_ID, true, new Date('2026-08-12T09:05:00.000Z'));
    expect(timedOutVote.ok).toBe(false);
    if (!timedOutVote.ok) {
      expect(timedOutVote.error.code).toBe('INVALID_STATUS');
      expect(timedOutVote.state.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
    }

    const stored = created.getState('walk-together', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(stored?.quest.status).toBe(QuestStatus.QUEST_AWAITING_EDIT_CONSENT);
    expect(stored?.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_PENDING);
  });

  it('keeps the exact start boundary inclusive for scheduled transitions', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const atStart = created.getState('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID, new Date('2026-08-13T10:00:00.000Z'));

    expect(atStart?.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
  });

  it('creates a pending Candidate application without creating Work Chat access', () => {
    const result = questFixtureAdapter.applyCandidate('move-boxes', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.applications.some((item) => item.applicantId === DEFAULT_PROTOTYPE_VIEWER_ID && item.status === QuestApplicationStatus.APPLICATION_APPLIED)).toBe(true);
      expect(result.state.conversation.canRead).toBe(false);
      expect(result.state.capabilities.canWriteConversation).toBe(false);
    }
  });

  it('manually rejects one individual Candidate Proposal without selecting or creating chat', () => {
    const target = questFixtureAdapter.getState('single-candidate-demo', 'demo-hirer', fixedNow)?.applications.find((item) => item.applicantId === 'single-applicant-b');
    expect(target?.status).toBe(QuestApplicationStatus.APPLICATION_APPLIED);
    if (!target) return;

    const rejected = questFixtureAdapter.dispatch({
      type: 'REJECT_CANDIDATE',
      questId: 'single-candidate-demo',
      applicationId: target.id,
      hirerId: 'demo-hirer',
    }, fixedNow);

    expect(rejected.ok).toBe(true);
    if (rejected.ok) {
      expect(rejected.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
      expect(rejected.state.applications.find((item) => item.id === target.id)).toEqual(expect.objectContaining({
        status: QuestApplicationStatus.APPLICATION_REJECTED,
        decidedAt: fixedNow.toISOString(),
      }));
      expect(rejected.state.applications.filter((item) => item.status === QuestApplicationStatus.APPLICATION_APPLIED)).toHaveLength(2);
      expect(rejected.state.assignments).toHaveLength(0);
      expect(rejected.state.conversation.conversationId).toBeNull();
      expect(rejected.state.conversation.canWrite).toBe(false);
    }

    expect(questFixtureAdapter.getState('single-candidate-demo', 'single-applicant-b', fixedNow)?.capabilities.availableActions).not.toContain('APPLY');
    const resubmitted = questFixtureAdapter.applyCandidate('single-candidate-demo', 'single-applicant-b', fixedNow);
    expect(resubmitted.ok).toBe(false);
    if (!resubmitted.ok) expect(resubmitted.error.code).toBe('DUPLICATE_ACTION');
  });

  it('manually rejects one submitted Team Proposal while preserving other proposals', () => {
    const before = questFixtureAdapter.getState('team-selection-demo', 'demo-hirer', fixedNow);
    const targetTeam = before?.teams.find((team) => team.id.endsWith('-a'));
    const otherTeam = before?.teams.find((team) => team.id.endsWith('-b'));
    const targetApplication = before?.applications.find((item) => item.teamId === targetTeam?.id);
    const otherApplication = before?.applications.find((item) => item.teamId === otherTeam?.id);
    expect(targetTeam?.status).toBe(QuestTeamStatus.TEAM_SUBMITTED);
    expect(otherTeam?.status).toBe(QuestTeamStatus.TEAM_SUBMITTED);
    expect(targetApplication?.status).toBe(QuestApplicationStatus.APPLICATION_APPLIED);
    expect(otherApplication?.status).toBe(QuestApplicationStatus.APPLICATION_APPLIED);
    if (!targetTeam || !otherTeam || !targetApplication || !otherApplication) return;

    const rejected = questFixtureAdapter.dispatch({
      type: 'REJECT_TEAM',
      questId: 'team-selection-demo',
      teamId: targetTeam.id,
      hirerId: 'demo-hirer',
    }, fixedNow);

    expect(rejected.ok).toBe(true);
    if (rejected.ok) {
      expect(rejected.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
      expect(rejected.state.teams.find((team) => team.id === targetTeam.id)?.status).toBe(QuestTeamStatus.TEAM_REJECTED);
      expect(rejected.state.teams.find((team) => team.id === otherTeam.id)?.status).toBe(QuestTeamStatus.TEAM_SUBMITTED);
      expect(rejected.state.applications.find((item) => item.id === targetApplication.id)).toEqual(expect.objectContaining({
        status: QuestApplicationStatus.APPLICATION_REJECTED,
        decidedAt: fixedNow.toISOString(),
      }));
      expect(rejected.state.applications.find((item) => item.id === otherApplication.id)?.status).toBe(QuestApplicationStatus.APPLICATION_APPLIED);
      expect(rejected.state.assignments).toHaveLength(0);
      expect(rejected.state.conversation.conversationId).toBeNull();
      expect(rejected.state.conversation.canWrite).toBe(false);
    }

    const resubmitted = questFixtureAdapter.submitTeam('team-selection-demo', targetTeam.leaderId, fixedNow);
    expect(resubmitted.ok).toBe(false);
    if (!resubmitted.ok) expect(resubmitted.error.code).toBe('IMMUTABLE_TEAM');
  });

  it('submits a non-empty partial Team roster and preserves invitation server states', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const team = created.createTeam('team-forming-demo', 'demo-worker-3', 'Campus crew', fixedNow);
    expect(team.ok).toBe(true);
    if (!team.ok) return;

    const invitation = created.inviteWorker('team-forming-demo', 'demo-worker-4', 'demo-worker-3', fixedNow);
    expect(invitation.ok).toBe(true);
    if (!invitation.ok) return;
    const pending = invitation.state.invitations[0];
    expect(pending?.status).toBe(QuestInvitationStatus.INVITATION_PENDING);

    const accepted = created.acceptInvitation('team-forming-demo', pending?.id ?? '', 'demo-worker-4', fixedNow);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.state.team?.members).toHaveLength(2);

    const submitted = created.submitTeam('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) {
      expect(submitted.state.team?.status).toBe(QuestTeamStatus.TEAM_SUBMITTED);
      expect(submitted.state.team?.members).toHaveLength(2);
      expect(submitted.state.applications).toHaveLength(1);
      expect(submitted.state.applications[0]?.teamId).toBe(submitted.state.team?.id);
    }
  });

  it('accepts multiple submitted Team Proposals and rejects a Worker joining two Teams', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const initialTeam = created.getState('team-forming-demo', 'demo-team-leader', fixedNow)?.teams.find((team) => team.leaderId === 'demo-team-leader');
    expect(initialTeam).toBeTruthy();
    if (!initialTeam) return;

    const duplicateLeader = created.createTeam('team-forming-demo', 'demo-team-leader', fixedNow);
    expect(duplicateLeader.ok).toBe(false);
    if (!duplicateLeader.ok) expect(duplicateLeader.error.code).toBe('DUPLICATE_ACTION');

    const firstInvitation = created.inviteWorker('team-forming-demo', 'demo-worker-4', 'demo-team-leader', fixedNow);
    expect(firstInvitation.ok).toBe(true);
    if (!firstInvitation.ok) return;
    const firstInvitationId = firstInvitation.state.invitations[0]?.id;
    expect(firstInvitationId).toBeTruthy();
    if (!firstInvitationId) return;
    const accepted = created.acceptInvitation('team-forming-demo', firstInvitationId, 'demo-worker-4', fixedNow);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;

    const secondTeam = created.createTeam('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(secondTeam.ok).toBe(true);
    if (!secondTeam.ok) return;
    const duplicateMembership = created.inviteWorker('team-forming-demo', 'demo-worker-4', 'demo-worker-3', fixedNow);
    expect(duplicateMembership.ok).toBe(false);
    if (!duplicateMembership.ok) expect(duplicateMembership.error.code).toBe('DUPLICATE_ACTION');

    const firstSubmitted = created.submitTeam('team-forming-demo', 'demo-team-leader', fixedNow);
    const secondSubmitted = created.submitTeam('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(firstSubmitted.ok).toBe(true);
    expect(secondSubmitted.ok).toBe(true);
    if (!firstSubmitted.ok || !secondSubmitted.ok) return;

    const hirerState = created.getState('team-forming-demo', 'demo-hirer', fixedNow);
    expect(hirerState?.applications).toHaveLength(2);
    expect(hirerState?.applications.every((proposal) => proposal.teamId)).toBe(true);
    expect(hirerState?.teams.filter((team) => team.status === QuestTeamStatus.TEAM_SUBMITTED)).toHaveLength(2);

    const selected = created.selectTeam('team-forming-demo', initialTeam.id, 'demo-hirer', fixedNow);
    expect(selected.ok).toBe(true);
    if (selected.ok) {
      expect(selected.state.teams.find((team) => team.id === initialTeam.id)?.status).toBe(QuestTeamStatus.TEAM_SELECTED);
      expect(selected.state.teams.find((team) => team.id === secondTeam.state.team?.id)?.status).toBe(QuestTeamStatus.TEAM_REJECTED);
      expect(selected.state.applications.filter((proposal) => proposal.status === QuestApplicationStatus.APPLICATION_SELECTED)).toHaveLength(1);
      expect(selected.state.assignments).toHaveLength(2);
    }
    const rejectedTeamView = created.getState('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(rejectedTeamView?.applications.filter((proposal) => proposal.status === QuestApplicationStatus.APPLICATION_REJECTED)).toHaveLength(1);
  });

  it('selects a partial submitted Team and settles by actual headcount', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const team = created.createTeam('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(team.ok).toBe(true);
    if (!team.ok) return;

    const invitation = created.inviteWorker('team-forming-demo', 'demo-worker-4', 'demo-worker-3', fixedNow);
    expect(invitation.ok).toBe(true);
    if (!invitation.ok) return;
    const invitationId = invitation.state.invitations[0]?.id;
    expect(invitationId).toBeTruthy();
    if (!invitationId) return;
    const accepted = created.acceptInvitation('team-forming-demo', invitationId, 'demo-worker-4', fixedNow);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;

    const submitted = created.submitTeam('team-forming-demo', 'demo-worker-3', fixedNow);
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    const submittedTeam = submitted.state.teams.find((candidate) => candidate.leaderId === 'demo-worker-3');
    expect(submittedTeam?.status).toBe(QuestTeamStatus.TEAM_SUBMITTED);
    expect(submittedTeam?.members).toHaveLength(2);
    if (!submittedTeam) return;

    const selected = created.selectTeam('team-forming-demo', submittedTeam.id, 'demo-hirer', fixedNow);
    expect(selected.ok).toBe(true);
    if (!selected.ok) return;
    expect(selected.state.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
    expect(selected.state.quest.headcount).toBe(3);
    expect(selected.state.actualHeadcount).toBe(2);
    expect(selected.state.assignments).toHaveLength(2);
    expect(selected.state.partialStartConsent).toBeUndefined();
    expect(selected.state.settlement).toMatchObject({
      requestedHeadcount: 3,
      actualHeadcount: 2,
      rewardSatangPerWorker: 20000,
      reservedRewardSatang: 60000,
      settledRewardSatang: 40000,
      refundSatang: 20000,
      fullRefund: false,
    });

    const atStart = created.getState('team-forming-demo', 'demo-worker-3', new Date('2026-08-20T10:00:00.000Z'));
    expect(atStart?.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
    expect(atStart?.actualHeadcount).toBe(2);
    expect(atStart?.settlement?.refundSatang).toBe(20000);
  });

  it('selects a Candidate and creates one Assignment per selected Team member', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const teamState = created.getState('play-badminton', 'student-creator-15', fixedNow);
    const teamApplication = teamState?.applications[0];
    const selected = created.selectCandidate('play-badminton', teamApplication?.id ?? '', 'student-creator-15', fixedNow);

    expect(selected.ok).toBe(true);
    if (selected.ok) {
      expect(selected.state.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
      expect(selected.state.team?.status).toBe('TEAM_SELECTED');
      expect(selected.state.assignments).toHaveLength(3);
      expect(selected.state.conversation.canWrite).toBe(true);
    }
  });

  it('applies unanimous edit consent and returns the prior Quest state', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const requested = created.requestEdit('buy-lunch', { description: 'Updated lunch instructions.' }, 'student-creator-4', fixedNow);
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    expect(requested.state.quest.status).toBe(QuestStatus.QUEST_AWAITING_EDIT_CONSENT);
    expect(requested.state.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_PENDING);
    expect(getConsentRemainingMs(requested.state.editConsent, fixedNow)).toBe(EDIT_CONSENT_WINDOW_MS);
    expect(formatConsentCountdown(requested.state.editConsent, fixedNow)).toBe('05:00');

    const voted = created.voteEditConsent('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID, true, fixedNow);
    expect(voted.ok).toBe(true);
    if (voted.ok) {
      expect(voted.state.quest.status).toBe(QuestStatus.QUEST_ASSIGNED);
      expect(voted.state.quest.description).toBe('Updated lunch instructions.');
      expect(voted.state.editConsent?.status).toBe(QuestEditRequestStatus.EDIT_REQUEST_APPROVED);
    }
  });

  it('waits for every direct-group proof before entering review', () => {
    const source = createQuestFixtureAdapter({ now: fixedNow }).getState('proof-in-progress-demo', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(source).toBeTruthy();
    if (!source) return;
    source.quest.id = 'direct-group-proof-demo';
    source.quest.participation = 'GROUP';
    source.quest.headcount = 2;
    const firstAssignment = source.assignments[0];
    source.assignments.push({ ...firstAssignment, id: 'fixture-assignment-direct-group-proof-demo-worker-2', workerId: 'demo-worker-2' });
    const created = createQuestFixtureAdapter({ now: fixedNow, states: [source] });

    const first = created.submitProof('direct-group-proof-demo', DEFAULT_PROTOTYPE_VIEWER_ID, ['fixture://first'], 'First', fixedNow);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.state.quest.status).toBe(QuestStatus.QUEST_IN_PROGRESS);
    const second = created.submitProof('direct-group-proof-demo', 'demo-worker-2', ['fixture://second'], 'Second', fixedNow);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.state.quest.status).toBe(QuestStatus.QUEST_SUBMITTED);
  });

  it('supports proof submission and proof-free completion through server state', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const submitted = created.submitProof('proof-in-progress-demo', DEFAULT_PROTOTYPE_VIEWER_ID, ['fixture://proof'], 'Done.', fixedNow);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) expect(submitted.state.quest.status).toBe(QuestStatus.QUEST_SUBMITTED);

    const proofFree = created.confirmCompletion('proof-free-in-progress-demo', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(proofFree.ok).toBe(true);
    if (proofFree.ok) expect(proofFree.state.quest.status).toBe(QuestStatus.QUEST_APPROVED);
  });

  it('moves proof through rejection, rework, review, and terminal read-only chat', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const rework = created.getState('move-club-equipment', 'demo-worker-3', fixedNow);
    const proof = rework?.proofs[0];
    expect(proof?.status).toBe(QuestProofStatus.PROOF_REJECTED);
    expect(rework?.quest.status).toBe(QuestStatus.QUEST_REWORK);

    const reworked = created.submitRework('move-club-equipment', proof?.id ?? '', 'demo-worker-3', ['fixture://new-proof'], 'Fixed.', fixedNow);
    expect(reworked.ok).toBe(true);
    if (!reworked.ok) return;
    expect(reworked.state.quest.status).toBe(QuestStatus.QUEST_SUBMITTED);

    const reviewed = created.approveProof('move-club-equipment', proof?.id ?? '', 'student-creator-7', fixedNow);
    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) return;
    expect(reviewed.state.quest.status).toBe(QuestStatus.QUEST_APPROVED);

    const completed = created.completeQuest('move-club-equipment', 'student-creator-7', fixedNow);
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.state.quest.status).toBe(QuestStatus.QUEST_COMPLETED);
      expect(completed.state.conversation.canRead).toBe(true);
      expect(completed.state.conversation.canWrite).toBe(false);
      expect(completed.state.conversation.readOnlyReason).toBe('TERMINAL');
    }
  });
});
