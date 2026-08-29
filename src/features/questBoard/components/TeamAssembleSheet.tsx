import React, { useState } from 'react';
import { Check, CircleAlert, CircleX, Clock3, Mail, Plus, Search, UsersRound } from 'lucide-react-native';

import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { groupQuestMessages } from '@/locales/groupQuestMessages';
import { colors } from '@/theme/colors';
import { QuestInvitationStatus, QuestTeamStatus, type QuestInvitation, type QuestTeam } from '../types';
import styles from './groupQuestStyles';
import { QuestBottomSheet } from './QuestBottomSheet';

export interface TeamDirectoryMember {
  id: string;
  workerId?: string;
  displayName: string;
  email?: string;
  kuEmail?: string;
  handle?: string;
}

export type TeamAssembleSurfaceState = 'ready' | 'loading' | 'error' | 'empty' | 'submitted';

export interface TeamAssembleSheetProps {
  visible: boolean;
  team?: QuestTeam | null;
  invitations?: readonly QuestInvitation[];
  eligibleMembers?: readonly TeamDirectoryMember[];
  requestedHeadcount?: number;
  viewerId?: string;
  surfaceState?: TeamAssembleSurfaceState;
  loading?: boolean;
  error?: string;
  submitting?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  selectedMemberIds?: readonly string[];
  onSelectedMemberIdsChange?: (memberIds: string[]) => void;
  reviewing?: boolean;
  onReviewChange?: (reviewing: boolean) => void;
  onCreateTeam?: () => void;
  onInviteMembers?: (memberIds: string[]) => void;
  onInviteMember?: (memberId: string) => void;
  onRespondInvitation?: (invitationId: string, accept: boolean) => void;
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
  onSubmit?: (teamId: string) => void;
  onSubmitTeam?: (teamId: string) => void;
  onRetry?: () => void;
  onClose: () => void;
  bottomInset?: number;
  locale?: SupportedLocale;
}

function memberId(member: TeamDirectoryMember): string {
  return member.workerId ?? member.id;
}

function isActiveInvitation(invitation: QuestInvitation): boolean {
  return invitation.status === QuestInvitationStatus.INVITATION_PENDING
    || invitation.status === QuestInvitationStatus.INVITATION_ACCEPTED;
}

function initialsFor(value: string): string {
  const words = value.replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('');
}

function formatExpiry(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function LoadingState({ label }: { label: string }) {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" className={styles.emptyState} testID="team-assemble-loading">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}

function ErrorState({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" className={`${styles.notice} ${styles.noticeDanger}`} testID="team-assemble-error">
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}>
        <CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} />
      </View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" accessibilityLabel={retryLabel} className={styles.retryButton} onPress={onRetry} testID="team-assemble-retry">
            <Text className={styles.retryButtonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function RosterRow({ member, role, acceptedLabel }: { member: { workerId: string; displayName?: string }; role: string; acceptedLabel: string }) {
  const name = member.displayName ?? member.workerId;
  return (
    <View accessibilityLabel={`${name}. ${role}. ${acceptedLabel}`} className={styles.rosterRow} testID={`team-assemble-roster-member-${member.workerId}`}>
      <View className={styles.rosterAvatar}>
        <Text className={styles.rosterAvatarText}>{initialsFor(name)}</Text>
      </View>
      <View className={styles.rosterCopy}>
        <Text className={styles.rosterName} numberOfLines={1}>{name}</Text>
        <Text className={styles.rosterRole}>{role}</Text>
      </View>
      <Text className={styles.rosterStatus}>{acceptedLabel}</Text>
    </View>
  );
}

function InvitationRow({
  invitation,
  displayName,
  messages,
  locale,
  canRespond,
  onRespond,
}: {
  invitation: QuestInvitation;
  displayName: string;
  messages: ReturnType<typeof getMessages>;
  locale: SupportedLocale;
  canRespond: boolean;
  onRespond?: (invitationId: string, accept: boolean) => void;
}) {
  const respond = (accept: boolean) => onRespond?.(invitation.id, accept);
  return (
    <View className={styles.invitationRow} testID={`team-assemble-invitation-${invitation.id}`}>
      <View className={styles.invitationHeader}>
        <View className={styles.invitationCopy}>
          <Text className={styles.invitationName} numberOfLines={1}>{displayName}</Text>
          <Text className={styles.invitationStatus}>{messages.pendingInvitation}</Text>
          <Text className={styles.invitationExpiry}>{messages.invitationExpires(formatExpiry(invitation.expiresAt, locale))}</Text>
        </View>
        <Clock3 color={colors.textMuted} size={18} strokeWidth={2} />
      </View>
      {canRespond && onRespond ? (
        <View className={styles.invitationActions}>
          <Pressable
            accessibilityLabel={`${messages.acceptInvitation}: ${displayName}`}
            accessibilityRole="button"
            className={`${styles.invitationAction} ${styles.invitationActionAccept}`}
            onPress={() => respond(true)}
            testID={`team-assemble-accept-invitation-${invitation.id}`}
          >
            <Text className={`${styles.invitationActionText} ${styles.invitationActionTextAccept}`}>{messages.acceptInvitation}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${messages.declineInvitation}: ${displayName}`}
            accessibilityRole="button"
            className={`${styles.invitationAction} ${styles.invitationActionDecline}`}
            onPress={() => respond(false)}
            testID={`team-assemble-decline-invitation-${invitation.id}`}
          >
            <Text className={`${styles.invitationActionText} ${styles.invitationActionTextDecline}`}>{messages.declineInvitation}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function getMessages(locale: SupportedLocale) {
  return groupQuestMessages[locale];
}

export function TeamAssembleSheet({
  visible,
  team = null,
  invitations = [],
  eligibleMembers = [],
  requestedHeadcount,
  viewerId,
  surfaceState = 'ready',
  loading = false,
  error,
  submitting = false,
  searchQuery,
  onSearchQueryChange,
  selectedMemberIds,
  onSelectedMemberIdsChange,
  reviewing,
  onReviewChange,
  onCreateTeam,
  onInviteMembers,
  onInviteMember,
  onRespondInvitation,
  onAcceptInvitation,
  onDeclineInvitation,
  onSubmit,
  onSubmitTeam,
  onRetry,
  onClose,
  bottomInset,
  locale: localeProp,
}: TeamAssembleSheetProps) {
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = getMessages(locale);
  const [internalQuery, setInternalQuery] = useState('');
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalReviewing, setInternalReviewing] = useState(false);
  const query = searchQuery ?? internalQuery;
  const selectedIds = selectedMemberIds ?? internalSelectedIds;
  const isReviewing = reviewing ?? internalReviewing;
  const requiredHeadcount = team?.requiredHeadcount ?? requestedHeadcount ?? 1;
  const acceptedMembers = team?.members ?? [];
  const pendingInvitations = invitations.filter((invitation) => (
    invitation.status === QuestInvitationStatus.INVITATION_PENDING
      && (!team || invitation.teamId === team.id)
  ));
  const isLocked = Boolean(team && team.status !== QuestTeamStatus.TEAM_FORMING) || surfaceState === 'submitted';
  const occupiedIds = new Set([
    ...acceptedMembers.map((member) => member.workerId),
    ...invitations
      .filter((invitation) => invitation.teamId === team?.id && isActiveInvitation(invitation))
      .map((invitation) => invitation.invitedWorkerId),
    ...(team ? [team.leaderId] : []),
  ]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleMembers = eligibleMembers.filter((member) => {
    const id = memberId(member);
    if (occupiedIds.has(id) || (team && id === team.leaderId)) return false;
    if (!normalizedQuery) return true;
    return [member.displayName, member.email, member.kuEmail, member.handle, id]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
  const directoryNames = new Map(eligibleMembers.map((member) => [memberId(member), member.displayName]));
  const invitationResponder = onRespondInvitation
    ?? ((invitationId: string, accept: boolean) => {
      if (accept) onAcceptInvitation?.(invitationId);
      else onDeclineInvitation?.(invitationId);
    });
  const canRespondToInvitations = Boolean(onRespondInvitation || onAcceptInvitation || onDeclineInvitation);

  const setQuery = (nextQuery: string) => {
    if (searchQuery === undefined) setInternalQuery(nextQuery);
    onSearchQueryChange?.(nextQuery);
  };

  const setSelected = (next: string[]) => {
    if (selectedMemberIds === undefined) setInternalSelectedIds(next);
    onSelectedMemberIdsChange?.(next);
  };

  const toggleMember = (id: string) => {
    setSelected(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const inviteMembers = (ids: readonly string[]) => {
    const availableSlots = Math.max(0, requiredHeadcount - acceptedMembers.length);
    const uniqueIds = [...new Set(ids)].filter((id) => !occupiedIds.has(id)).slice(0, availableSlots);
    if (uniqueIds.length === 0 || isLocked) return;
    if (onInviteMembers) onInviteMembers(uniqueIds);
    else uniqueIds.forEach((id) => onInviteMember?.(id));
    setSelected(selectedIds.filter((id) => !uniqueIds.includes(id)));
  };

  const setReview = (next: boolean) => {
    if (reviewing === undefined) setInternalReviewing(next);
    onReviewChange?.(next);
  };

  const submit = () => {
    if (!team || acceptedMembers.length === 0 || isLocked || submitting) return;
    (onSubmit ?? onSubmitTeam)?.(team.id);
  };

  const teamStatusLabel = team?.status === QuestTeamStatus.TEAM_SELECTED
    ? messages.teamSelected
    : team?.status === QuestTeamStatus.TEAM_REJECTED
      ? messages.teamRejected
      : messages.teamSubmitted;
  const sheetContent = loading || surfaceState === 'loading' ? (
    <LoadingState label={messages.loading} />
  ) : surfaceState === 'error' || error ? (
    <ErrorState message={error ?? messages.errorTitle} onRetry={onRetry} retryLabel={messages.retry} />
  ) : !team ? (
    <View className={styles.emptyState} testID="team-assemble-empty">
      <View className={styles.emptyIcon}><UsersRound color={colors.primary} size={26} strokeWidth={1.9} /></View>
      <Text className={styles.emptyTitle}>{surfaceState === 'empty' ? messages.noTeamTitle : messages.noTeamTitle}</Text>
      <Text className={styles.emptyText}>{messages.noTeamDescription}</Text>
      {onCreateTeam ? (
        <Pressable accessibilityLabel={messages.createTeam} accessibilityRole="button" className={styles.retryButton} onPress={onCreateTeam} testID="team-assemble-create">
          <Plus color={colors.white} size={18} strokeWidth={2.5} />
          <Text className={styles.retryButtonText}>{messages.createTeam}</Text>
        </Pressable>
      ) : null}
    </View>
  ) : (
    <ScrollView
      className={styles.sheetScroll}
      contentContainerClassName={styles.sheetContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID="team-assemble-scroll"
    >
      {isLocked ? (
        <View accessibilityLiveRegion="polite" className={`${styles.notice} ${team.status === QuestTeamStatus.TEAM_REJECTED ? styles.noticeDanger : styles.noticeSuccess}`} testID="team-assemble-locked-state">
          <View className={`${styles.noticeIcon} ${team.status === QuestTeamStatus.TEAM_REJECTED ? styles.noticeIconDanger : ''}`}>
            {team.status === QuestTeamStatus.TEAM_REJECTED ? <CircleX color={colors.dangerDark} size={18} strokeWidth={2.1} /> : <Check color={colors.success} size={18} strokeWidth={2.4} />}
          </View>
          <View className={styles.noticeCopy}>
            <Text className={styles.noticeTitle}>{team.status === QuestTeamStatus.TEAM_REJECTED ? messages.teamRejected : team.status === QuestTeamStatus.TEAM_SELECTED ? messages.teamSelected : messages.submittedTitle}</Text>
            <Text className={styles.noticeText}>{messages.lockedDescription}</Text>
          </View>
        </View>
      ) : null}

      <View className={`${styles.section} ${styles.sectionFirst}`}>
        <View className={styles.sectionHeader}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>{messages.roster}</Text>
          <Text accessibilityLabel={messages.rosterCount(acceptedMembers.length, requiredHeadcount)} className={styles.sectionMeta} testID="team-assemble-roster-count">{messages.rosterCount(acceptedMembers.length, requiredHeadcount)}</Text>
        </View>
        <View accessibilityLabel={messages.rosterCount(acceptedMembers.length, requiredHeadcount)} className={styles.rosterCard} testID="team-assemble-roster">
          <View className={styles.rosterHeader}>
            <Text className={styles.rosterCount}>{messages.rosterCount(acceptedMembers.length, requiredHeadcount)}</Text>
            {isLocked ? <Text className={styles.rosterStatus}>{teamStatusLabel}</Text> : null}
          </View>
          <View className={styles.rosterList}>
            {acceptedMembers.map((member) => <RosterRow acceptedLabel={messages.invitationAccepted} key={member.workerId} member={member} role={member.role === 'LEADER' ? messages.leader : messages.member} />)}
          </View>
        </View>
        {!isLocked ? <Text className={styles.helper}>{messages.partialRosterHint}</Text> : null}
      </View>

      {pendingInvitations.length > 0 ? (
        <View className={styles.section} testID="team-assemble-pending-invitations">
          <View className={styles.sectionHeader}>
            <Text accessibilityRole="header" className={styles.sectionTitle}>{messages.pendingInvitation}</Text>
            <Text className={styles.sectionMeta}>{pendingInvitations.length}</Text>
          </View>
          <View className={styles.invitationList}>
            {pendingInvitations.map((invitation) => (
              <InvitationRow
                canRespond={canRespondToInvitations && Boolean(!viewerId || viewerId === invitation.invitedWorkerId)}
                displayName={directoryNames.get(invitation.invitedWorkerId) ?? invitation.invitedWorkerId}
                invitation={invitation}
                key={invitation.id}
                locale={locale}
                messages={messages}
                onRespond={invitationResponder}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!isLocked && !isReviewing ? (
        <View className={styles.section}>
          <Text accessibilityRole="header" className={styles.sectionTitle}>{messages.searchMembers}</Text>
          <Text className={styles.helper}>{messages.searchMembersHint}</Text>
          <View className={styles.searchField}>
            <Search color={colors.textSecondary} size={20} strokeWidth={2.1} />
            <TextInput
              accessibilityLabel={messages.searchMembersHint}
              accessibilityRole="search"
              autoCapitalize="none"
              autoCorrect={false}
              className={styles.searchInput}
              onChangeText={setQuery}
              placeholder={messages.searchMembersHint}
              placeholderTextColor={colors.textFaint}
              testID="team-assemble-member-search"
              value={query}
            />
            {query ? (
              <Pressable accessibilityLabel={messages.clearSearch} accessibilityRole="button" className={styles.searchClear} onPress={() => setQuery('')} testID="team-assemble-clear-search">
                <CircleX color={colors.textMuted} size={18} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          {eligibleMembers.length === 0 ? (
            <View className={styles.emptyState} testID="team-assemble-members-empty">
              <View className={styles.emptyIcon}><Mail color={colors.primary} size={24} strokeWidth={1.9} /></View>
              <Text className={styles.emptyTitle}>{messages.noEligibleMembers}</Text>
            </View>
          ) : visibleMembers.length === 0 ? (
            <View className={styles.emptyState} testID="team-assemble-search-empty">
              <Text className={styles.emptyTitle}>{messages.noSearchResults}</Text>
            </View>
          ) : (
            <View className={styles.memberList}>
              {visibleMembers.map((member) => {
                const id = memberId(member);
                const selected = selectedIds.includes(id);
                const handle = member.email ?? member.kuEmail ?? member.handle ?? member.workerId ?? member.id;
                return (
                  <View className={`${styles.memberRow} ${selected ? styles.memberRowSelected : ''}`} key={id}>
                    <Pressable
                      accessibilityLabel={`${member.displayName}. ${handle}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      className={styles.memberSelect}
                      onPress={() => toggleMember(id)}
                      testID={`team-assemble-select-member-${id}`}
                    >
                      <View className={`${styles.memberSelectionBox} ${selected ? styles.memberSelectionBoxSelected : ''}`}>
                        {selected ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}
                      </View>
                      <View className={styles.memberAvatar}><Text className={styles.memberAvatarText}>{initialsFor(member.displayName)}</Text></View>
                      <View className={styles.memberCopy}>
                        <Text className={styles.memberName} numberOfLines={1}>{member.displayName}</Text>
                        <Text className={styles.memberHandle} numberOfLines={1}>{handle}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`${messages.invite}: ${member.displayName}`}
                      accessibilityRole="button"
                      className={styles.memberInvite}
                      disabled={acceptedMembers.length >= requiredHeadcount}
                      onPress={() => inviteMembers([id])}
                      testID={`team-assemble-invite-member-${id}`}
                    >
                      <Text className={styles.memberInviteText}>{messages.invite}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          {selectedIds.length > 0 ? (
            <View className={styles.bulkInviteBar} testID="team-assemble-bulk-invite">
              <View className={styles.bulkInviteCopy}><Text className={styles.bulkInviteText}>{messages.inviteSelected(selectedIds.length)}</Text></View>
              <Pressable accessibilityLabel={messages.inviteSelected(selectedIds.length)} accessibilityRole="button" className={styles.bulkInviteButton} onPress={() => inviteMembers(selectedIds)} testID="team-assemble-invite-selected">
                <Text className={styles.bulkInviteButtonText}>{messages.inviteSelected(selectedIds.length)}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {!isLocked ? (
        isReviewing ? (
          <View className={styles.reviewCard} testID="team-assemble-review">
            <View className={styles.reviewHeader}>
              <View className={styles.reviewIcon}><Check color={colors.primary} size={20} strokeWidth={2.5} /></View>
              <View className={styles.reviewHeaderCopy}>
                <Text accessibilityRole="header" className={styles.reviewHeading}>{messages.reviewTitle}</Text>
                <Text className={styles.reviewCopy}>{messages.reviewDescription}</Text>
              </View>
            </View>
            <View className={styles.reviewRows}>
              <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.roster}</Text><Text className={styles.reviewValue}>{messages.rosterCount(acceptedMembers.length, requiredHeadcount)}</Text></View>
              <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.partialRosterHint}</Text></View>
            </View>
            <Pressable accessibilityLabel={submitting ? messages.submittingTeam : messages.confirmSubmit} accessibilityRole="button" accessibilityState={{ disabled: submitting || acceptedMembers.length === 0 }} className={`${styles.submitButton} ${submitting || acceptedMembers.length === 0 ? styles.submitButtonDisabled : ''}`} disabled={submitting || acceptedMembers.length === 0} onPress={submit} testID="team-assemble-confirm-submit">
              {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Check color={acceptedMembers.length === 0 ? colors.textMuted : colors.white} size={18} strokeWidth={2.7} />}
              <Text className={`${styles.submitButtonText} ${acceptedMembers.length === 0 ? styles.submitButtonTextDisabled : ''}`}>{submitting ? messages.submittingTeam : messages.confirmSubmit}</Text>
            </Pressable>
            <Pressable accessibilityLabel={messages.cancel} accessibilityRole="button" className={styles.searchClear} onPress={() => setReview(false)} testID="team-assemble-review-cancel">
              <Text className={styles.memberInviteText}>{messages.cancel}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityLabel={messages.reviewRoster} accessibilityRole="button" accessibilityState={{ disabled: acceptedMembers.length === 0 }} className={`${styles.submitButton} ${acceptedMembers.length === 0 ? styles.submitButtonDisabled : ''}`} disabled={acceptedMembers.length === 0} onPress={() => setReview(true)} testID="team-assemble-review-roster">
            <UsersRound color={acceptedMembers.length === 0 ? colors.textMuted : colors.white} size={18} strokeWidth={2.3} />
            <Text className={`${styles.submitButtonText} ${acceptedMembers.length === 0 ? styles.submitButtonTextDisabled : ''}`}>{messages.reviewRoster}</Text>
          </Pressable>
        )
      ) : null}
    </ScrollView>
  );

  return (
    <QuestBottomSheet
      bottomInset={bottomInset}
      closeLabel={messages.close}
      onClose={onClose}
      subtitle={messages.teamSubtitle}
      testID="team-assemble-sheet"
      title={messages.teamTitle}
      visible={visible}
    >
      {sheetContent}
    </QuestBottomSheet>
  );
}

TeamAssembleSheet.displayName = 'TeamAssembleSheet';

export default TeamAssembleSheet;
