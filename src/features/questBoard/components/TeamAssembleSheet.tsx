import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Check,
  CircleAlert,
  CircleX,
  Clock3,
  FileText,
  ImagePlus,
  Mail,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react-native";
import type { UploadAsset } from "@/api/fileUpload";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import { useLocale, type SupportedLocale } from "@/locales/LocaleProvider";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { colors } from "@/theme/colors";
import {
  QuestInvitationStatus,
  QuestTeamStatus,
  type QuestInvitation,
  type QuestTeam,
} from "../types";
import type { QuestV2Team } from "@/api/questV2Contracts";
import styles from "./groupQuestStyles";
import { QuestBottomSheet } from "./QuestBottomSheet";

export interface TeamDirectoryMember {
  id: string;
  workerId?: string;
  displayName: string;
  email?: string;
  kuEmail?: string;
  handle?: string;
}
export interface ProposalFileItem {
  id: string;
  name: string;
  sizeBytes?: number;
}

export type TeamAssembleSurfaceState =
  "ready" | "loading" | "error" | "empty" | "submitted";

export interface TeamAssembleSheetProps {
  visible: boolean;
  team?: QuestTeam | QuestV2Team | null;
  invitations?: readonly QuestInvitation[];
  eligibleMembers?: readonly TeamDirectoryMember[];
  requestedHeadcount?: number;
  viewerId?: string;
  /** Canonical v2 join code override; forming teams expose their server value by default. */
  joinCode?: string | null;
  joinCodeExpiresAt?: string | null;
  joinCodeInput?: string;
  onJoinCodeInputChange?: (joinCode: string) => void;
  onJoinTeam?: (joinCode: string) => void;
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
  onCreateTeam?: () => void;
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
  onClose: () => void;
  bottomInset?: number;
  locale?: SupportedLocale;
}

function canonicalMemberRows(
  team: QuestV2Team,
  directory: readonly TeamDirectoryMember[]
): Array<{ workerId: string; displayName: string; role: "LEADER" | "MEMBER" }> {
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

function initialsFor(value: string): string {
  const words = value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatExpiry(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function LoadingState({ label }: { label: string }) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className={styles.emptyState}
      testID="team-assemble-loading"
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}

function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={`${styles.notice} ${styles.noticeDanger}`}
      testID="team-assemble-error"
    >
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}>
        <CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} />
      </View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            className={styles.retryButton}
            onPress={onRetry}
            testID="team-assemble-retry"
          >
            <Text className={styles.retryButtonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function RosterRow({
  member,
  role,
  acceptedLabel,
  canLeave,
  canRemove,
  onLeave,
  onRemove,
  leaveLabel = "Leave",
  removeLabel = "Remove",
}: {
  member: { workerId: string; displayName?: string };
  role: string;
  acceptedLabel: string;
  canLeave?: boolean;
  canRemove?: boolean;
  onLeave?: () => void;
  onRemove?: () => void;
  leaveLabel?: string;
  removeLabel?: string;
}) {
  const name = member.displayName ?? member.workerId;
  return (
    <View
      accessibilityLabel={`${name}. ${role}. ${acceptedLabel}`}
      className={styles.rosterRow}
      testID={`team-assemble-roster-member-${member.workerId}`}
    >
      <View className={styles.rosterAvatar}>
        <Text className={styles.rosterAvatarText}>{initialsFor(name)}</Text>
      </View>
      <View className={styles.rosterCopy}>
        <Text className={styles.rosterName} numberOfLines={1}>
          {name}
        </Text>
        <Text className={styles.rosterRole}>{role}</Text>
      </View>
      {canRemove && onRemove ? (
        <Pressable
          accessibilityLabel={`${removeLabel}: ${name}`}
          accessibilityRole="button"
          className={styles.searchClear}
          onPress={onRemove}
          testID={`team-assemble-remove-member-${member.workerId}`}
        >
          <CircleX color={colors.dangerDark} size={18} strokeWidth={2} />
        </Pressable>
      ) : canLeave && onLeave ? (
        <Pressable
          accessibilityLabel={`${leaveLabel}: ${name}`}
          accessibilityRole="button"
          className={styles.memberInvite}
          onPress={onLeave}
          testID={`team-assemble-leave-team-${member.workerId}`}
        >
          <Text className={styles.memberInviteText}>{leaveLabel}</Text>
        </Pressable>
      ) : null}
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
    <View
      className={styles.invitationRow}
      testID={`team-assemble-invitation-${invitation.id}`}
    >
      <View className={styles.invitationHeader}>
        <View className={styles.invitationCopy}>
          <Text className={styles.invitationName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className={styles.invitationStatus}>
            {messages.pendingInvitation}
          </Text>
          <Text className={styles.invitationExpiry}>
            {messages.invitationExpires(
              formatExpiry(invitation.expiresAt, locale)
            )}
          </Text>
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
            <Text
              className={`${styles.invitationActionText} ${styles.invitationActionTextAccept}`}
            >
              {messages.acceptInvitation}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${messages.declineInvitation}: ${displayName}`}
            accessibilityRole="button"
            className={`${styles.invitationAction} ${styles.invitationActionDecline}`}
            onPress={() => respond(false)}
            testID={`team-assemble-decline-invitation-${invitation.id}`}
          >
            <Text
              className={`${styles.invitationActionText} ${styles.invitationActionTextDecline}`}
            >
              {messages.declineInvitation}
            </Text>
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
  onClose,
  bottomInset,
  locale: localeProp,
}: TeamAssembleSheetProps) {
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = getMessages(locale);
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
  const sheetContent =
    loading || surfaceState === "loading" ? (
      <LoadingState label={messages.loading} />
    ) : surfaceState === "error" || error ? (
      <ErrorState
        message={error ?? messages.errorTitle}
        onRetry={onRetry}
        retryLabel={messages.retry}
      />
    ) : !team ? (
      <View className={styles.emptyState} testID="team-assemble-empty">
        <View className={styles.emptyIcon}>
          <UsersRound color={colors.primary} size={26} strokeWidth={1.9} />
        </View>
        <Text className={styles.emptyTitle}>{messages.noTeamTitle}</Text>
        <Text className={styles.emptyText}>{messages.noTeamDescription}</Text>
        {onCreateTeam ? (
          <Pressable
            accessibilityLabel={messages.createTeam}
            accessibilityRole="button"
            className={styles.retryButton}
            onPress={onCreateTeam}
            testID="team-assemble-create"
          >
            <Plus color={colors.white} size={18} strokeWidth={2.5} />
            <Text className={styles.retryButtonText}>
              {messages.createTeam}
            </Text>
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
          <View
            accessibilityLiveRegion="polite"
            className={`${styles.notice} ${teamStatus === QuestTeamStatus.TEAM_REJECTED ? styles.noticeDanger : styles.noticeSuccess}`}
            testID="team-assemble-locked-state"
          >
            <View
              className={`${styles.noticeIcon} ${teamStatus === QuestTeamStatus.TEAM_REJECTED ? styles.noticeIconDanger : ""}`}
            >
              {teamStatus === QuestTeamStatus.TEAM_REJECTED ? (
                <CircleX
                  color={colors.dangerDark}
                  size={18}
                  strokeWidth={2.1}
                />
              ) : (
                <Check color={colors.success} size={18} strokeWidth={2.4} />
              )}
            </View>
            <View className={styles.noticeCopy}>
              <Text className={styles.noticeTitle}>
                {teamStatus === QuestTeamStatus.TEAM_REJECTED
                  ? messages.teamRejected
                  : teamStatus === QuestTeamStatus.TEAM_SELECTED
                    ? messages.teamSelected
                    : messages.submittedTitle}
              </Text>
              <Text className={styles.noticeText}>
                {messages.lockedDescription}
              </Text>
            </View>
          </View>
        ) : null}
        {canonical && teamStatus === "TEAM_FORMING" ? (
          <View className={styles.section} testID="team-assemble-join-code">
            <View className={styles.sectionHeader}>
              <Text accessibilityRole="header" className={styles.sectionTitle}>
                {locale === "th" ? "รหัสเข้าร่วมทีม" : "Team Join Code"}
              </Text>
              {codeExpiry ? (
                <Text className={styles.sectionMeta}>
                  {locale === "th"
                    ? `หมดอายุ ${formatExpiry(codeExpiry, locale)}`
                    : `Expires ${formatExpiry(codeExpiry, locale)}`}
                </Text>
              ) : null}
            </View>
            {viewerIsMember ? (
              <View className={styles.reviewCard}>
                <Text
                  selectable
                  accessibilityLabel={
                    code
                      ? `${locale === "th" ? "รหัสเข้าร่วมทีม" : "Team Join Code"}: ${code}`
                      : undefined
                  }
                  className={styles.proposalSummaryTitle}
                >
                  {code ??
                    (locale === "th" ? "ยังไม่มีรหัส" : "No code available")}
                </Text>
                {isLeader &&
                canRegenerateJoinCode !== false &&
                onRegenerateJoinCode ? (
                  <Pressable
                    accessibilityLabel={
                      locale === "th" ? "สร้างรหัสใหม่" : "Regenerate join code"
                    }
                    accessibilityRole="button"
                    className={styles.memberInvite}
                    onPress={() => onRegenerateJoinCode(team.id)}
                    testID="team-assemble-regenerate-join-code"
                  >
                    <Text className={styles.memberInviteText}>
                      {locale === "th" ? "สร้างรหัสใหม่" : "Regenerate"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : onJoinTeam ? (
              <View className={styles.searchField}>
                <TextInput
                  accessibilityLabel={
                    locale === "th"
                      ? "กรอกรหัสเข้าร่วมทีม"
                      : "Enter team join code"
                  }
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className={styles.searchInput}
                  onChangeText={(value) => {
                    if (joinCodeInput === undefined) setInternalJoinCode(value);
                    onJoinCodeInputChange?.(value);
                  }}
                  placeholder={
                    locale === "th"
                      ? "กรอกรหัสเข้าร่วมทีม"
                      : "Enter team join code"
                  }
                  placeholderTextColor={colors.textFaint}
                  testID="team-assemble-join-code-input"
                  value={inputCode}
                />
                <Pressable
                  accessibilityLabel={
                    locale === "th" ? "เข้าร่วมทีม" : "Join team"
                  }
                  accessibilityRole="button"
                  className={styles.memberInvite}
                  disabled={!inputCode.trim()}
                  onPress={() => onJoinTeam(inputCode.trim())}
                  testID="team-assemble-join"
                >
                  <Text className={styles.memberInviteText}>
                    {locale === "th" ? "เข้าร่วม" : "Join"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
        {canRenameTeam ? (
          <View className={styles.section} testID="team-assemble-name-editor">
            <Text accessibilityRole="header" className={styles.sectionTitle}>
              {locale === "th" ? "ชื่อทีม" : "Team name"}
            </Text>
            <View className={styles.searchField}>
              <TextInput
                accessibilityLabel={locale === "th" ? "ชื่อทีม" : "Team name"}
                autoCapitalize="sentences"
                autoCorrect
                className={styles.searchInput}
                maxLength={120}
                onChangeText={setTeamNameDraft}
                placeholder={locale === "th" ? "ชื่อทีม" : "Team name"}
                placeholderTextColor={colors.textFaint}
                testID="team-assemble-name-input"
                value={teamNameDraft}
              />
              <Pressable
                accessibilityLabel={
                  locale === "th" ? "บันทึกชื่อทีม" : "Save team name"
                }
                accessibilityRole="button"
                className={styles.memberInvite}
                disabled={
                  !teamNameDraft.trim() ||
                  teamNameDraft.trim() ===
                    (teamName ?? canonicalTeam?.name ?? "").trim()
                }
                onPress={renameTeam}
                testID="team-assemble-save-name"
              >
                <Text className={styles.memberInviteText}>
                  {locale === "th" ? "บันทึก" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View className={`${styles.section} ${styles.sectionFirst}`}>
          <View className={styles.sectionHeader}>
            <Text accessibilityRole="header" className={styles.sectionTitle}>
              {messages.roster}
            </Text>
            <Text
              accessibilityLabel={messages.rosterCount(
                acceptedMembers.length,
                requiredHeadcount
              )}
              className={styles.sectionMeta}
              testID="team-assemble-roster-count"
            >
              {messages.rosterCount(acceptedMembers.length, requiredHeadcount)}
            </Text>
          </View>
          <View
            accessibilityLabel={messages.rosterCount(
              acceptedMembers.length,
              requiredHeadcount
            )}
            className={styles.rosterCard}
            testID="team-assemble-roster"
          >
            <View className={styles.rosterHeader}>
              <Text className={styles.rosterCount}>
                {messages.rosterCount(
                  acceptedMembers.length,
                  requiredHeadcount
                )}
              </Text>
              {isLocked ? (
                <Text className={styles.rosterStatus}>{teamStatusLabel}</Text>
              ) : null}
            </View>
            <View className={styles.rosterList}>
              {acceptedMembers.map((member) => (
                <RosterRow
                  acceptedLabel={messages.invitationAccepted}
                  canLeave={
                    canonical &&
                    !isLocked &&
                    canLeaveTeam !== false &&
                    member.workerId === viewerId &&
                    Boolean(onLeaveTeam)
                  }
                  canRemove={
                    canonical &&
                    !isLocked &&
                    isLeader &&
                    canRemoveMember !== false &&
                    member.workerId !== viewerId &&
                    Boolean(onRemoveMember)
                  }
                  key={member.workerId}
                  member={member}
                  leaveLabel={leaveLabel}
                  removeLabel={removeLabel}
                  onLeave={
                    onLeaveTeam && team ? () => onLeaveTeam(team.id) : undefined
                  }
                  onRemove={
                    onRemoveMember && team
                      ? () => onRemoveMember(team.id, member.workerId)
                      : undefined
                  }
                  role={
                    member.role === "LEADER" ? messages.leader : messages.member
                  }
                />
              ))}
            </View>
            {!isLocked ? (
              <Text className={styles.helper}>
                {canonical
                  ? locale === "th"
                    ? `ต้องมีสมาชิกครบ ${requiredHeadcount} คนจึงจะส่งทีมได้`
                    : `Add exactly ${requiredHeadcount} members before submitting.`
                  : messages.partialRosterHint}
              </Text>
            ) : null}
          </View>
        </View>

        {pendingInvitations.length > 0 ? (
          <View
            className={styles.section}
            testID="team-assemble-pending-invitations"
          >
            <View className={styles.sectionHeader}>
              <Text accessibilityRole="header" className={styles.sectionTitle}>
                {messages.pendingInvitation}
              </Text>
              <Text className={styles.sectionMeta}>
                {pendingInvitations.length}
              </Text>
            </View>
            <View className={styles.invitationList}>
              {pendingInvitations.map((invitation) => (
                <InvitationRow
                  canRespond={
                    canRespondToInvitations &&
                    Boolean(
                      !viewerId || viewerId === invitation.invitedWorkerId
                    )
                  }
                  displayName={
                    directoryNames.get(invitation.invitedWorkerId) ??
                    invitation.invitedWorkerId
                  }
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

        {!isLocked && !isReviewing && !canonical ? (
          <View className={styles.section}>
            <Text accessibilityRole="header" className={styles.sectionTitle}>
              {messages.searchMembers}
            </Text>
            <Text className={styles.helper}>{messages.searchMembersHint}</Text>
            <View className={styles.searchField}>
              <Search
                color={colors.textSecondary}
                size={20}
                strokeWidth={2.1}
              />
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
                <Pressable
                  accessibilityLabel={messages.clearSearch}
                  accessibilityRole="button"
                  className={styles.searchClear}
                  onPress={() => setQuery("")}
                  testID="team-assemble-clear-search"
                >
                  <CircleX color={colors.textMuted} size={18} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
            {eligibleMembers.length === 0 ? (
              <View
                className={styles.emptyState}
                testID="team-assemble-members-empty"
              >
                <View className={styles.emptyIcon}>
                  <Mail color={colors.primary} size={24} strokeWidth={1.9} />
                </View>
                <Text className={styles.emptyTitle}>
                  {messages.noEligibleMembers}
                </Text>
              </View>
            ) : visibleMembers.length === 0 ? (
              <View
                className={styles.emptyState}
                testID="team-assemble-search-empty"
              >
                <Text className={styles.emptyTitle}>
                  {messages.noSearchResults}
                </Text>
              </View>
            ) : (
              <View className={styles.memberList}>
                {visibleMembers.map((member) => {
                  const id = memberId(member);
                  const selected = selectedIds.includes(id);
                  const handle =
                    member.email ??
                    member.kuEmail ??
                    member.handle ??
                    member.workerId ??
                    member.id;
                  return (
                    <View
                      className={`${styles.memberRow} ${selected ? styles.memberRowSelected : ""}`}
                      key={id}
                    >
                      <Pressable
                        accessibilityLabel={`${member.displayName}. ${handle}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        className={styles.memberSelect}
                        onPress={() => toggleMember(id)}
                        testID={`team-assemble-select-member-${id}`}
                      >
                        <View
                          className={`${styles.memberSelectionBox} ${selected ? styles.memberSelectionBoxSelected : ""}`}
                        >
                          {selected ? (
                            <Check
                              color={colors.white}
                              size={15}
                              strokeWidth={3}
                            />
                          ) : null}
                        </View>
                        <View className={styles.memberAvatar}>
                          <Text className={styles.memberAvatarText}>
                            {initialsFor(member.displayName)}
                          </Text>
                        </View>
                        <View className={styles.memberCopy}>
                          <Text className={styles.memberName} numberOfLines={1}>
                            {member.displayName}
                          </Text>
                          <Text
                            className={styles.memberHandle}
                            numberOfLines={1}
                          >
                            {handle}
                          </Text>
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
                        <Text className={styles.memberInviteText}>
                          {messages.invite}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
            {selectedIds.length > 0 ? (
              <View
                className={styles.bulkInviteBar}
                testID="team-assemble-bulk-invite"
              >
                <View className={styles.bulkInviteCopy}>
                  <Text className={styles.bulkInviteText}>
                    {messages.inviteSelected(selectedIds.length)}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={messages.inviteSelected(
                    selectedIds.length
                  )}
                  accessibilityRole="button"
                  className={styles.bulkInviteButton}
                  onPress={() => inviteMembers(selectedIds)}
                  testID="team-assemble-invite-selected"
                >
                  <Text className={styles.bulkInviteButtonText}>
                    {messages.inviteSelected(selectedIds.length)}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
        {canonical && isLeader && !isLocked ? (
          <View
            className={styles.section}
            testID="team-assemble-proposal-section"
          >
            <View className={styles.sectionHeader}>
              <Text accessibilityRole="header" className={styles.sectionTitle}>
                {locale === "th"
                  ? "ข้อเสนอและเอกสารแนบ"
                  : "Proposal & Supporting Files"}
              </Text>
              {proposalFiles.length > 0 ? (
                <Text className={styles.sectionMeta}>
                  {locale === "th"
                    ? `${proposalFiles.length} ไฟล์`
                    : `${proposalFiles.length} files`}
                </Text>
              ) : null}
            </View>
            <Text className={styles.helper}>
              {locale === "th"
                ? "เพิ่มรายละเอียดหรือแนบเอกสารเพื่อประกอบการพิจารณา"
                : "Add a proposal note and supporting documents or images"}
            </Text>
            <View className="mt-[8px] rounded-[18px] border border-ku-border bg-ku-surface p-[12px]">
              <TextInput
                accessibilityLabel={
                  locale === "th" ? "ข้อความเสนอตัว" : "Proposal note"
                }
                className="min-h-[72px] font-ku-regular text-ku-body text-ku-text-strong"
                multiline
                numberOfLines={3}
                onChangeText={setProposalText}
                placeholder={
                  locale === "th"
                    ? "ข้อความเสนอตัวหรือรายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    : "Proposal note or message (optional)"
                }
                placeholderTextColor={colors.textFaint}
                testID="team-proposal-text-input"
                textAlignVertical="top"
                value={proposalText}
              />
            </View>
            <View className="mt-[10px] gap-[8px]">
              {proposalFiles.map((file) => (
                <View
                  key={file.id}
                  className="flex-row items-center justify-between rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted px-[12px] py-[8px]"
                  testID={`team-proposal-file-${file.id}`}
                >
                  <View className="min-w-0 flex-1 flex-row items-center pr-[8px]">
                    <FileText
                      color={colors.primary}
                      size={18}
                      strokeWidth={2}
                    />
                    <View className="ml-[8px] min-w-0 flex-1">
                      <Text
                        className="font-ku-medium text-ku-body-small text-ku-text-strong"
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      {file.sizeBytes ? (
                        <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
                          {Math.round(file.sizeBytes / 1024)} KB
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel={
                      locale === "th"
                        ? `ลบไฟล์ ${file.name}`
                        : `Remove file ${file.name}`
                    }
                    accessibilityRole="button"
                    className="items-center justify-center p-[6px]"
                    onPress={() => handleRemoveFile(file.id)}
                    testID={`team-remove-file-${file.id}`}
                  >
                    <Trash2
                      color={colors.dangerDark}
                      size={16}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityLabel={
                  locale === "th" ? "แนบไฟล์หรือรูปภาพ" : "Attach file or image"
                }
                accessibilityRole="button"
                className="min-h-[44px] flex-row items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-ku-primary px-[12px] py-[8px]"
                disabled={isPickingFile}
                onPress={handlePickFiles}
                testID="team-pick-file-button"
              >
                {isPickingFile ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <ImagePlus
                      color={colors.primary}
                      size={18}
                      strokeWidth={2.2}
                    />
                    <Text className="font-ku-semibold text-ku-label text-ku-primary">
                      {locale === "th"
                        ? "แนบเอกสารหรือรูปภาพ"
                        : "Attach file or image"}
                    </Text>
                  </>
                )}
              </Pressable>
              {filePickError ? (
                <Text className="mt-[2px] font-ku-regular text-ku-label text-ku-danger-dark">
                  {filePickError}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {!isLocked && (!canonical || isLeader) ? (
          submissionBlocker && canonical && submissionReady ? (
            <View
              accessibilityRole="alert"
              className={`${styles.notice} ${styles.noticeDanger}`}
              testID="team-assemble-submission-blocked"
            >
              <View
                className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}
              >
                <CircleAlert
                  color={colors.dangerDark}
                  size={18}
                  strokeWidth={2.1}
                />
              </View>
              <View className={styles.noticeCopy}>
                <Text className={styles.noticeTitle}>
                  {locale === "th"
                    ? "ยังส่งทีมไม่ได้"
                    : "Team submission unavailable"}
                </Text>
                <Text className={styles.noticeText}>{submissionBlocker}</Text>
              </View>
            </View>
          ) : isReviewing ? (
            <View className={styles.reviewCard} testID="team-assemble-review">
              <View className={styles.reviewHeader}>
                <View className={styles.reviewIcon}>
                  <Check color={colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <View className={styles.reviewHeaderCopy}>
                  <Text
                    accessibilityRole="header"
                    className={styles.reviewHeading}
                  >
                    {messages.reviewTitle}
                  </Text>
                  <Text className={styles.reviewCopy}>
                    {messages.reviewDescription}
                  </Text>
                </View>
              </View>
              <View className={styles.reviewRows}>
                <View className={styles.reviewRow}>
                  <Text className={styles.reviewLabel}>{messages.roster}</Text>
                  <Text className={styles.reviewValue}>
                    {messages.rosterCount(
                      acceptedMembers.length,
                      requiredHeadcount
                    )}
                  </Text>
                </View>
                <View className={styles.reviewRow}>
                  <Text className={styles.reviewLabel}>
                    {messages.partialRosterHint}
                  </Text>
                </View>
                {proposalFiles.length > 0 ? (
                  <View className={styles.reviewRow}>
                    <Text className={styles.reviewLabel}>
                      {locale === "th" ? "ไฟล์แนบ" : "Attached files"}
                    </Text>
                    <Text className={styles.reviewValue}>
                      {proposalFiles.length}
                    </Text>
                  </View>
                ) : null}
                {proposalText.trim() ? (
                  <View className={styles.reviewRow}>
                    <Text className={styles.reviewLabel}>
                      {locale === "th" ? "ข้อเสนอ" : "Proposal"}
                    </Text>
                    <Text className={styles.reviewValue} numberOfLines={2}>
                      {proposalText.trim()}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel={
                  submitting ? messages.submittingTeam : messages.confirmSubmit
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled: submitting || !submissionReady,
                }}
                className={`${styles.submitButton} ${submitting || !submissionReady ? styles.submitButtonDisabled : ""}`}
                disabled={submitting || !submissionReady}
                onPress={submit}
                testID="team-assemble-confirm-submit"
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Check
                    color={!submissionReady ? colors.textMuted : colors.white}
                    size={18}
                    strokeWidth={2.7}
                  />
                )}
                <Text
                  className={`${styles.submitButtonText} ${!submissionReady ? styles.submitButtonTextDisabled : ""}`}
                >
                  {submitting
                    ? messages.submittingTeam
                    : messages.confirmSubmit}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={messages.cancel}
                accessibilityRole="button"
                className={styles.searchClear}
                onPress={() => setReview(false)}
                testID="team-assemble-review-cancel"
              >
                <Text className={styles.memberInviteText}>
                  {messages.cancel}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={messages.reviewRoster}
              accessibilityRole="button"
              accessibilityState={{ disabled: !submissionReady }}
              className={`${styles.submitButton} ${!submissionReady ? styles.submitButtonDisabled : ""}`}
              disabled={!submissionReady}
              onPress={() => setReview(true)}
              testID="team-assemble-review-roster"
            >
              <UsersRound
                color={!submissionReady ? colors.textMuted : colors.white}
                size={18}
                strokeWidth={2.3}
              />
              <Text
                className={`${styles.submitButtonText} ${!submissionReady ? styles.submitButtonTextDisabled : ""}`}
              >
                {messages.reviewRoster}
              </Text>
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

TeamAssembleSheet.displayName = "TeamAssembleSheet";

export default TeamAssembleSheet;
