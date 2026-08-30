import React, { type ReactNode } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { CandidateReviewSheet } from '../CandidateReviewSheet';
import { PartialGroupStartConsentSheet } from '../PartialGroupStartConsentSheet';
import { TeamAssembleSheet } from '../TeamAssembleSheet';
import {
  QuestApplicationStatus,
  QuestPartialStartConsentStatus,
  QuestTeamStatus,
  type QuestApplication,
  type QuestInvitation,
  type QuestPartialStartConsent,
  type QuestTeam,
} from '../../types';

jest.mock('../../../..//locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) => visible ? <>{children}</> : null,
}));

const team: QuestTeam = {
  id: 'team-1',
  questId: 'quest-1',
  leaderId: 'leader-1',
  status: QuestTeamStatus.TEAM_FORMING,
  members: [{ workerId: 'leader-1', role: 'LEADER', displayName: 'Team Leader' }],
  requiredHeadcount: 3,
  createdAt: '2026-08-12T09:00:00.000Z',
};

const invitation: QuestInvitation = {
  id: 'invite-1',
  questId: 'quest-1',
  teamId: team.id,
  invitedWorkerId: 'worker-1',
  status: 'INVITATION_PENDING',
  createdAt: '2026-08-12T09:00:00.000Z',
  expiresAt: '2026-08-13T09:00:00.000Z',
};

function makeConsent(status: QuestPartialStartConsentStatus = QuestPartialStartConsentStatus.PARTIAL_START_PENDING): QuestPartialStartConsent {
  return {
    id: 'consent-1',
    questId: 'quest-1',
    status,
    requestedAt: '2026-08-12T09:00:00.000Z',
    responseDeadlineAt: '2026-08-12T09:05:00.000Z',
    requiredVoterIds: ['hirer-1', 'worker-1'],
    frozenWorkerIds: ['worker-1'],
    approvedVoterCount: 0,
    responses: [],
  };
}

describe('group Quest sheets', () => {
  it('supports a partial roster, directory search, multi-invite, and review before submit', async () => {
    const onInviteMembers = jest.fn();
    const onSubmit = jest.fn();
    const view = await render(
      <TeamAssembleSheet
        bottomInset={0}
        eligibleMembers={[
          { id: 'worker-1', displayName: 'Mali Worker', email: 'mali@ku.th' },
          { id: 'worker-2', displayName: 'Niran Worker', email: 'niran@ku.th' },
          { id: 'worker-3', displayName: 'Pim Worker', email: 'pim@ku.th' },
        ]}
        locale="en"
        onClose={() => undefined}
        onInviteMembers={onInviteMembers}
        onSubmit={onSubmit}
        team={team}
        visible
      />,
    );

    expect(view.getByTestId('team-assemble-sheet')).toBeTruthy();
    expect(view.getByTestId('team-assemble-roster-count')).toBeTruthy();
    expect(view.getByRole('search', { name: 'Search by name or @ku.th email' })).toBeTruthy();
    expect(view.queryByTestId('team-assemble-name-input')).toBeNull();

    await fireEvent.changeText(view.getByTestId('team-assemble-member-search'), '@ku.th');
    await fireEvent.press(view.getByTestId('team-assemble-select-member-worker-2'));
    await fireEvent.press(view.getByTestId('team-assemble-select-member-worker-3'));
    await fireEvent.press(view.getByTestId('team-assemble-invite-selected'));
    expect(onInviteMembers).toHaveBeenCalledWith(['worker-2', 'worker-3']);

    await fireEvent.press(view.getByTestId('team-assemble-review-roster'));
    expect(view.getByTestId('team-assemble-review')).toBeTruthy();
    await fireEvent.press(view.getByTestId('team-assemble-confirm-submit'));
    expect(onSubmit).toHaveBeenCalledWith(team.id);
  });

  it('shows pending invitations with accept and decline actions for the invited Worker', async () => {
    const onRespondInvitation = jest.fn();
    const view = await render(
      <TeamAssembleSheet
        invitations={[invitation]}
        locale="en"
        onClose={() => undefined}
        onRespondInvitation={onRespondInvitation}
        team={team}
        viewerId="worker-1"
        visible
      />,
    );

    expect(view.getAllByText('Invitation pending')).toHaveLength(2);
    await fireEvent.press(view.getByTestId('team-assemble-accept-invitation-invite-1'));
    expect(onRespondInvitation).toHaveBeenCalledWith('invite-1', true);
    await fireEvent.press(view.getByTestId('team-assemble-decline-invitation-invite-1'));
    expect(onRespondInvitation).toHaveBeenCalledWith('invite-1', false);
  });

  it('shows only submitted team proposals and exposes selection/status decisions', async () => {
    const forming: QuestTeam = { ...team, id: 'forming', leaderId: 'forming-leader', members: [{ workerId: 'forming-leader', role: 'LEADER', displayName: 'Forming Team' }] };
    const submitted: QuestTeam = { ...team, id: 'submitted', leaderId: 'submitted-leader', status: QuestTeamStatus.TEAM_SUBMITTED, members: [{ workerId: 'submitted-leader', role: 'LEADER', displayName: 'Submitted Leader' }, { workerId: 'member-1', role: 'MEMBER', displayName: 'Submitted Member' }] };
    const selected: QuestTeam = { ...team, id: 'selected', leaderId: 'selected-leader', status: QuestTeamStatus.TEAM_SELECTED, members: [{ workerId: 'selected-leader', role: 'LEADER', displayName: 'Selected Leader' }] };
    const rejected: QuestTeam = { ...team, id: 'rejected', leaderId: 'rejected-leader', status: QuestTeamStatus.TEAM_REJECTED, members: [{ workerId: 'rejected-leader', role: 'LEADER', displayName: 'Rejected Leader' }] };
    const applications: QuestApplication[] = [
      { id: 'proposal-submitted', questId: 'quest-1', teamId: submitted.id, status: QuestApplicationStatus.APPLICATION_APPLIED, submittedAt: team.createdAt },
      { id: 'proposal-selected', questId: 'quest-1', teamId: selected.id, status: QuestApplicationStatus.APPLICATION_SELECTED, submittedAt: team.createdAt },
      { id: 'proposal-rejected', questId: 'quest-1', teamId: rejected.id, status: QuestApplicationStatus.APPLICATION_REJECTED, submittedAt: team.createdAt },
    ];
    const onSelectProposal = jest.fn();
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const view = await render(
      <CandidateReviewSheet
        applications={applications}
        locale="en"
        mode="team"
        onAccept={onAccept}
        onClose={() => undefined}
        onReject={onReject}
        onSelectProposal={onSelectProposal}
        requestedHeadcount={3}
        rewardSatangPerWorker={10000}
        teams={[forming, submitted, selected, rejected]}
        visible
      />,
    );

    expect(view.queryByText('Forming Team')).toBeNull();
    expect(view.getByText('Submitted Leader')).toBeTruthy();
    expect(view.getByText('Selected')).toBeTruthy();
    expect(view.getByText('Rejected')).toBeTruthy();
    expect(view.getByText('Requested headcount')).toBeTruthy();
    expect(view.getByText('Actual headcount')).toBeTruthy();
    expect(view.getByTestId('candidate-review-settlement')).toBeTruthy();

    await fireEvent.press(view.getByTestId('candidate-review-select-proposal-submitted'));
    expect(onSelectProposal).toHaveBeenCalledWith('proposal-submitted');
    await fireEvent.press(view.getByTestId('candidate-review-accept-proposal-submitted'));
    await fireEvent.press(view.getByTestId('candidate-review-reject-proposal-submitted'));
    expect(onAccept).toHaveBeenCalledWith('proposal-submitted');
    expect(onReject).toHaveBeenCalledWith('proposal-submitted');
  });

  it('counts down the five-minute partial-start consent window and exposes voter actions', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-12T09:00:00.000Z'));
    const onVote = jest.fn();
    const view = await render(
      <PartialGroupStartConsentSheet
        actualHeadcount={1}
        consent={makeConsent()}
        hirerId="hirer-1"
        locale="en"
        onClose={() => undefined}
        onVote={onVote}
        requestedHeadcount={3}
        voters={[{ id: 'hirer-1', displayName: 'Quest Hirer', role: 'HIRER' }, { id: 'worker-1', displayName: 'Joined Worker', role: 'WORKER' }]}
        viewerId="hirer-1"
        visible
      />,
    );

    expect(view.getByTestId('partial-group-start-countdown')).toBeTruthy();
    expect(view.getByText('05:00')).toBeTruthy();
    expect(view.getByText('Quest Hirer')).toBeTruthy();
    expect(view.getAllByText('Joined Worker')).toHaveLength(2);
    expect(view.getByText('The existing Quest chat stays writable while this vote is pending.')).toBeTruthy();

    await fireEvent.press(view.getByTestId('partial-group-start-approve'));
    expect(onVote).toHaveBeenCalledWith(true);
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(view.getByText('04:00')).toBeTruthy();
    jest.useRealTimers();
  });

  it('shows approved and cancelled terminal consent states without vote actions', async () => {
    const approved = await render(
      <PartialGroupStartConsentSheet consent={makeConsent(QuestPartialStartConsentStatus.PARTIAL_START_APPROVED)} locale="en" onClose={() => undefined} visible />,
    );
    expect(approved.getByTestId('partial-group-start-approved')).toBeTruthy();
    expect(approved.queryByTestId('partial-group-start-approve')).toBeNull();

    const cancelled = await render(
      <PartialGroupStartConsentSheet consent={makeConsent(QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT)} locale="en" onClose={() => undefined} visible />,
    );
    expect(cancelled.getByTestId('partial-group-start-cancelled')).toBeTruthy();
    expect(cancelled.getByText('The five-minute consent window ended before everyone approved. Reserved rewards are fully refunded.')).toBeTruthy();
  });
});
