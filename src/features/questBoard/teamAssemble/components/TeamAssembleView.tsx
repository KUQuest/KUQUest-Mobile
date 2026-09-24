import { useEffect, useRef, useState } from "react";
import { Share } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  type QuestInvitation,
  QuestInvitationStatus,
  QuestTeamStatus,
  type QuestTeam,
} from "../../domain/types";
import type { QuestV2Team } from "@/api/questV2Contracts";
import type { UploadAsset } from "@/api/fileUpload";
import { useLocale } from "@/features/preferences/localeStore";
import type { SupportedLocale } from "@/locales/locale";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { TeamAssembleEmptyState } from "./TeamAssembleEmptyState";
import { TeamAssembleErrorState } from "./TeamAssembleErrorState";
import { TeamAssembleInvitations } from "./TeamAssembleInvitations";
import { TeamAssembleJoinCodePanel } from "./TeamAssembleJoinCodePanel";
import { TeamAssembleJoinTeamPanel } from "./TeamAssembleJoinTeamPanel";
import { TeamAssembleLoadingState } from "./TeamAssembleLoadingState";
import { TeamAssembleLockedState } from "./TeamAssembleLockedState";
import { TeamAssembleMemberPicker } from "./TeamAssembleMemberPicker";
import { TeamAssembleNameEditor } from "./TeamAssembleNameEditor";
import { TeamAssembleProposalPanel } from "./TeamAssembleProposalPanel";
import { TeamAssembleRoster } from "./TeamAssembleRoster";
import { TeamAssembleSubmissionPanel } from "./TeamAssembleSubmissionPanel";
import styles from "../groupQuestStyles";
import { spacing } from "@/theme/spacing";
import { ScrollView, Text } from "@/tw";
import type { ProposalFileItem, TeamDirectoryMember } from "../types";
import { createTeamInviteLink } from "../teamInvite";

export type TeamAssembleSurfaceState =
  "ready" | "loading" | "error" | "empty" | "submitted";

export interface TeamAssembleViewProps {
  team?: QuestTeam | QuestV2Team | null;
  invitations?: readonly QuestInvitation[];
  eligibleMembers?: readonly TeamDirectoryMember[];
  requestedHeadcount?: number;
  viewerId?: string;
  /** Team invite link opened or pasted by a Prospective Worker. */
  initialInvite?: string;
  /** Canonical v2 join code override; forming teams expose their server value by default. */
  joinCode?: string | null;
  joinCodeExpiresAt?: string | null;
  joinCodeInput?: string;
  onJoinCodeInputChange?: (joinCode: string) => void;
  onJoinTeam?: (teamId: string, joinCode: string) => void;
  teamName?: string | null;
  onUpdateTeamName?: (teamId: string, name: string) => void;
  canUpdateTeam?: boolean;
  onRegenerateJoinCode?: (teamId: string) => void;
  onLeaveTeam?: (teamId: string) => void;
  onRemoveMember?: (teamId: string, memberId: string) => void;
  canLeaveTeam?: boolean;
  canRemoveMember?: boolean;
  canRegenerateJoinCode?: boolean;
  submissionBlocker?: string;
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
  onCreateTeam?: (name: string) => void;
  onInviteMembers?: (memberIds: string[]) => void;
  onInviteMember?: (memberId: string) => void;
  onRespondInvitation?: (invitationId: string, accept: boolean) => void;
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
  onSubmit?: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
  onSubmitTeam?: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
  onUploadFile?: (asset: UploadAsset) => Promise<ProposalFileItem>;
  onUploadProposalFile?: (asset: UploadAsset) => Promise<ProposalFileItem>;
  onRetry?: () => void;
  locale?: SupportedLocale;
  /** Bottom safe-area inset reserved below the scrollable content. */
  bottomInset?: number;
}

function canonicalMemberRows(
  team: QuestV2Team,
  directory: readonly TeamDirectoryMember[]
): { workerId: string; displayName: string; role: "LEADER" | "MEMBER" }[] {
  return team.members.map((member) => ({
    workerId: member.memberId,
    displayName:
      directory.find((candidate) => memberId(candidate) === member.memberId)
        ?.displayName ?? member.memberId,
    role: member.memberId === team.leaderId ? "LEADER" : "MEMBER",
  }));
}

function isCanonicalTeam(team: QuestTeam | QuestV2Team): team is QuestV2Team {
  return "state" in team;
}
function memberId(member: TeamDirectoryMember): string {
  return member.workerId ?? member.id;
}

function isActiveInvitation(invitation: QuestInvitation): boolean {
  return (
    invitation.status === QuestInvitationStatus.INVITATION_PENDING ||
    invitation.status === QuestInvitationStatus.INVITATION_ACCEPTED
  );
}

export function TeamAssembleView({
  team = null,
  invitations = [],
  eligibleMembers = [],
  requestedHeadcount,
  viewerId,
  initialInvite,
  surfaceState = "ready",
  joinCode,
  joinCodeExpiresAt,
  joinCodeInput,
  onJoinCodeInputChange,
  onJoinTeam,
  teamName,
  onUpdateTeamName,
  canUpdateTeam,
  onRegenerateJoinCode,
  onLeaveTeam,
  onRemoveMember,
  canLeaveTeam,
  canRemoveMember,
  canRegenerateJoinCode,
  submissionBlocker,
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
  onUploadFile,
  onUploadProposalFile,
  onRetry,
  bottomInset = 0,
  locale: localeProp,
}: TeamAssembleViewProps) {
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = groupQuestMessages[locale];
  const [internalQuery, setInternalQuery] = useState("");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalReviewing, setInternalReviewing] = useState(false);
  const canonicalTeam = team && isCanonicalTeam(team) ? team : null;
  const initialDraft = teamName ?? canonicalTeam?.name ?? "";
  const [teamNameDraft, setTeamNameDraft] = useState(initialDraft);
  const lastSyncedTeamRef = useRef(initialDraft);
  const [internalJoinCode, setInternalJoinCode] = useState("");
  const query = searchQuery ?? internalQuery;
  const setQuery = (nextQuery: string) => {
    if (searchQuery === undefined) setInternalQuery(nextQuery);
    onSearchQueryChange?.(nextQuery);
  };
  const selectedIds = selectedMemberIds ?? internalSelectedIds;
  const [proposalText, setProposalText] = useState("");
  const [proposalFiles, setProposalFiles] = useState<ProposalFileItem[]>([]);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [filePickError, setFilePickError] = useState<string | null>(null);

  const handlePickFiles = async () => {
    if (isPickingFile) return;
    setIsPickingFile(true);
    setFilePickError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets) return;

      const newFiles: ProposalFileItem[] = [];
      for (const asset of result.assets) {
        const uploadAsset: UploadAsset = {
          uri: asset.uri,
          name: asset.fileName ?? `proposal-${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        };
        if (onUploadProposalFile) {
          const uploaded = await onUploadProposalFile(uploadAsset);
          newFiles.push(uploaded);
        } else if (onUploadFile) {
          const uploaded = await onUploadFile(uploadAsset);
          newFiles.push(uploaded);
        } else {
          const fileId =
            asset.fileName ??
            `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          newFiles.push({
            id: fileId,
            name: asset.fileName ?? "attachment.jpg",
            sizeBytes: asset.fileSize ?? undefined,
          });
        }
      }
      setProposalFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      setFilePickError(
        err instanceof Error ? err.message : "Failed to pick file"
      );
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setProposalFiles((prev) => prev.filter((file) => file.id !== fileId));
  };
  const isReviewing = reviewing ?? internalReviewing;
  const legacyTeam = team && !isCanonicalTeam(team) ? team : null;
  const canonical = canonicalTeam !== null;
  useEffect(() => {
    const currentName = teamName ?? canonicalTeam?.name ?? "";
    if (currentName !== lastSyncedTeamRef.current) {
      lastSyncedTeamRef.current = currentName;
      setTeamNameDraft(currentName);
    }
  }, [canonicalTeam?.id, canonicalTeam?.name, teamName]);
  const leaveLabel = locale === "th" ? "ออกจากทีม" : "Leave";
  const removeLabel = locale === "th" ? "นำออก" : "Remove";
  const canonicalMembers = canonicalTeam
    ? canonicalMemberRows(canonicalTeam, eligibleMembers)
    : [];
  const acceptedMembers = canonicalTeam
    ? canonicalMembers
    : (legacyTeam?.members ?? []);
  const requiredHeadcount =
    canonicalTeam?.headcount ??
    legacyTeam?.requiredHeadcount ??
    requestedHeadcount ??
    1;
  const teamStatus = canonicalTeam?.state ?? legacyTeam?.status;
  const isLocked =
    Boolean(team && teamStatus !== QuestTeamStatus.TEAM_FORMING) ||
    surfaceState === "submitted";
  const viewerIsMember = Boolean(
    team &&
    (!viewerId ||
      acceptedMembers.some((member) => member.workerId === viewerId))
  );
  const isLeader = Boolean(team && (!viewerId || team.leaderId === viewerId));
  const code = joinCode ?? canonicalTeam?.joinCode ?? null;
  const codeExpiry =
    joinCodeExpiresAt ?? canonicalTeam?.joinCodeExpiresAt ?? null;
  const shareInvite =
    canonicalTeam && code
      ? () =>
          void Share.share({
            message: messages.teamInviteMessage(
              teamName ?? canonicalTeam.name,
              createTeamInviteLink(
                canonicalTeam.questId,
                canonicalTeam.id,
                code
              )
            ),
          })
      : undefined;
  const canRenameTeam = Boolean(
    canonical &&
    teamStatus === QuestTeamStatus.TEAM_FORMING &&
    isLeader &&
    canUpdateTeam !== false &&
    onUpdateTeamName
  );
  const renameTeam = () => {
    if (!team || !canRenameTeam) return;
    const nextName = teamNameDraft.trim();
    const currentName = (teamName ?? canonicalTeam?.name ?? "").trim();
    if (!nextName || nextName === currentName) return;
    onUpdateTeamName?.(team.id, nextName);
  };
  const inputCode = joinCodeInput ?? internalJoinCode;
  const pendingInvitations = canonicalTeam
    ? []
    : invitations.filter(
        (invitation) =>
          invitation.status === QuestInvitationStatus.INVITATION_PENDING &&
          (!team || invitation.teamId === team.id)
      );
  const occupiedIds = new Set([
    ...acceptedMembers.map((member) => member.workerId),
    ...invitations
      .filter(
        (invitation) =>
          invitation.teamId === team?.id && isActiveInvitation(invitation)
      )
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
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
  const directoryNames = new Map(
    eligibleMembers.map((member) => [memberId(member), member.displayName])
  );
  const invitationResponder =
    onRespondInvitation ??
    ((invitationId: string, accept: boolean) => {
      if (accept) onAcceptInvitation?.(invitationId);
      else onDeclineInvitation?.(invitationId);
    });
  const canRespondToInvitations = Boolean(
    onRespondInvitation || onAcceptInvitation || onDeclineInvitation
  );
  const submissionReady = canonical
    ? acceptedMembers.length === requiredHeadcount
    : acceptedMembers.length > 0;
  const setSelected = (next: string[]) => {
    if (selectedMemberIds === undefined) setInternalSelectedIds(next);
    onSelectedMemberIdsChange?.(next);
  };

  const toggleMember = (id: string) => {
    setSelected(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const inviteMembers = (ids: readonly string[]) => {
    const availableSlots = Math.max(
      0,
      requiredHeadcount - acceptedMembers.length
    );
    const uniqueIds = [...new Set(ids)]
      .filter((id) => !occupiedIds.has(id))
      .slice(0, availableSlots);
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
    if (!team || !submissionReady || isLocked || submitting) return;
    const payload = {
      text: proposalText,
      fileIds: proposalFiles.map((f) => f.id),
    };
    if (onSubmitTeam) {
      onSubmitTeam(team.id, payload);
    } else if (onSubmit) {
      onSubmit(team.id);
    }
  };

  const teamStatusLabel =
    teamStatus === QuestTeamStatus.TEAM_SELECTED
      ? messages.teamSelected
      : teamStatus === QuestTeamStatus.TEAM_REJECTED
        ? messages.teamRejected
        : messages.teamSubmitted;
  if (loading || surfaceState === "loading") {
    return <TeamAssembleLoadingState label={messages.loading} />;
  }
  if (surfaceState === "error" || error) {
    return (
      <TeamAssembleErrorState
        message={error ?? messages.errorTitle}
        onRetry={onRetry}
        retryLabel={messages.retry}
      />
    );
  }

  return (
    <ScrollView
      className={styles.sheetScroll}
      contentContainerClassName={styles.sheetContent}
      contentContainerStyle={{ paddingBottom: bottomInset + spacing.md }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID="team-assemble-scroll"
    >
      <Text className={styles.sheetSubtitle}>{messages.teamSubtitle}</Text>
      {!team ? (
        <>
          <TeamAssembleEmptyState
            busy={submitting}
            createLabel={messages.createTeam}
            description={messages.noTeamDescription}
            onCreateTeam={onCreateTeam}
            teamNameLabel={messages.teamNameLabel}
            title={messages.noTeamTitle}
          />
          {onJoinTeam ? (
            <TeamAssembleJoinTeamPanel
              initialInvite={initialInvite}
              locale={locale}
              onJoinTeam={onJoinTeam}
              submitting={submitting}
            />
          ) : null}
        </>
      ) : (
        <>
          {isLocked ? (
            <TeamAssembleLockedState
              description={messages.lockedDescription}
              rejectedLabel={messages.teamRejected}
              selectedLabel={messages.teamSelected}
              status={teamStatus}
              submittedTitle={messages.submittedTitle}
            />
          ) : null}
          {canonical && teamStatus === "TEAM_FORMING" ? (
            <TeamAssembleJoinCodePanel
              canRegenerateJoinCode={canRegenerateJoinCode}
              code={code}
              codeExpiry={codeExpiry}
              inputCode={inputCode}
              isLeader={isLeader}
              locale={locale}
              onInputCodeChange={(value) => {
                if (joinCodeInput === undefined) setInternalJoinCode(value);
                onJoinCodeInputChange?.(value);
              }}
              onJoinTeam={
                onJoinTeam ? (code) => onJoinTeam(team.id, code) : undefined
              }
              onRegenerateJoinCode={onRegenerateJoinCode}
              onShareInvite={shareInvite}
              teamId={team.id}
              viewerIsMember={viewerIsMember}
            />
          ) : null}
          {canRenameTeam ? (
            <TeamAssembleNameEditor
              currentName={teamName ?? canonicalTeam?.name ?? ""}
              locale={locale}
              onChange={setTeamNameDraft}
              onSave={renameTeam}
              value={teamNameDraft}
            />
          ) : null}
          <TeamAssembleRoster
            acceptedLabel={messages.invitationAccepted}
            canonical={canonical}
            canLeaveTeam={canLeaveTeam}
            canRemoveMember={canRemoveMember}
            helper={
              canonical
                ? locale === "th"
                  ? `ต้องมีสมาชิกครบ ${requiredHeadcount} คนจึงจะส่งทีมได้`
                  : `Add exactly ${requiredHeadcount} members before submitting.`
                : messages.partialRosterHint
            }
            isLeader={isLeader}
            isLocked={isLocked}
            leaderLabel={messages.leader}
            leaveLabel={leaveLabel}
            memberLabel={messages.member}
            members={acceptedMembers}
            onLeaveTeam={
              onLeaveTeam && team ? () => onLeaveTeam(team.id) : undefined
            }
            onRemoveMember={
              onRemoveMember && team
                ? (memberId) => onRemoveMember(team.id, memberId)
                : undefined
            }
            removeLabel={removeLabel}
            rosterCountLabel={messages.rosterCount(
              acceptedMembers.length,
              requiredHeadcount
            )}
            rosterLabel={messages.roster}
            teamStatusLabel={teamStatusLabel}
            viewerId={viewerId}
          />
          {pendingInvitations.length > 0 ? (
            <TeamAssembleInvitations
              canRespond={canRespondToInvitations}
              directoryNames={directoryNames}
              invitations={pendingInvitations}
              locale={locale}
              messages={messages}
              onRespond={invitationResponder}
              title={messages.pendingInvitation}
              viewerId={viewerId}
            />
          ) : null}
          {!isLocked && !isReviewing && !canonical ? (
            <TeamAssembleMemberPicker
              acceptedCount={acceptedMembers.length}
              eligibleMemberCount={eligibleMembers.length}
              memberId={memberId}
              members={visibleMembers}
              messages={messages}
              onInvite={inviteMembers}
              onQueryChange={setQuery}
              onToggle={toggleMember}
              query={query}
              requiredHeadcount={requiredHeadcount}
              selectedIds={selectedIds}
            />
          ) : null}
          {canonical && isLeader && !isLocked ? (
            <TeamAssembleProposalPanel
              filePickError={filePickError}
              files={proposalFiles}
              isPickingFile={isPickingFile}
              locale={locale}
              onPickFiles={handlePickFiles}
              onRemoveFile={handleRemoveFile}
              onTextChange={setProposalText}
              text={proposalText}
            />
          ) : null}
          {!isLocked && (!canonical || isLeader) ? (
            <TeamAssembleSubmissionPanel
              acceptedCount={acceptedMembers.length}
              canonical={canonical}
              files={proposalFiles}
              isReviewing={isReviewing}
              locale={locale}
              messages={{
                attachedFiles: locale === "th" ? "ไฟล์แนบ" : "Attached files",
                cancel: messages.cancel,
                confirmSubmit: messages.confirmSubmit,
                partialRosterHint: messages.partialRosterHint,
                proposal: locale === "th" ? "ข้อเสนอ" : "Proposal",
                reviewDescription: messages.reviewDescription,
                reviewRoster: messages.reviewRoster,
                reviewTitle: messages.reviewTitle,
                roster: messages.roster,
                rosterCount: messages.rosterCount,
                submittingTeam: messages.submittingTeam,
                teamSubmissionUnavailable: "Team submission unavailable",
              }}
              onReviewChange={setReview}
              onSubmit={submit}
              requiredHeadcount={requiredHeadcount}
              submissionBlocker={submissionBlocker}
              submissionReady={submissionReady}
              submitting={submitting}
              text={proposalText}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

TeamAssembleView.displayName = "TeamAssembleView";
