import { formatTimestampDate } from "@/domain/datetime";
import type {
  QuestV2Application,
  QuestV2Participation,
  QuestV2Team,
} from "@/api/questV2Contracts";
import type { SupportedLocale } from "@/locales/locale";
import type { LiveQuestCapabilities } from "../live/liveQuestTypes";

export type SelectRosterCapabilitySet = Pick<
  LiveQuestCapabilities,
  | "canSelectCandidate"
  | "canRejectCandidate"
  | "canSelectTeam"
  | "canRejectTeam"
>;
export interface SelectRosterPermissions {
  canSelectCandidate: boolean;
  canRejectCandidate: boolean;
  canSelectTeam: boolean;
  canRejectTeam: boolean;
}

export function getSelectRosterPermissions(snapshot?: {
  participation: QuestV2Participation;
  capabilities: SelectRosterCapabilitySet;
}): SelectRosterPermissions {
  return {
    canSelectCandidate:
      snapshot?.participation === "SINGLE" &&
      snapshot.capabilities.canSelectCandidate,
    canRejectCandidate:
      snapshot?.participation === "SINGLE" &&
      snapshot.capabilities.canRejectCandidate,
    canSelectTeam:
      snapshot?.participation === "GROUP" &&
      snapshot.capabilities.canSelectTeam,
    canRejectTeam:
      snapshot?.participation === "GROUP" &&
      snapshot.capabilities.canRejectTeam,
  };
}

export function getPendingApplications(
  applications: readonly QuestV2Application[]
): QuestV2Application[] {
  return applications.filter(
    (application) => application.state === "APPLICATION_APPLIED"
  );
}

export function getPendingTeams(teams: readonly QuestV2Team[]): QuestV2Team[] {
  return teams.filter((team) => team.state === "TEAM_SUBMITTED");
}

export function getApplicationSubmissionDetail(
  appliedAt: string | undefined,
  locale: SupportedLocale,
  submittedLabel: string
): string {
  if (!appliedAt) return submittedLabel;
  const date = new Date(appliedAt);
  if (Number.isNaN(date.getTime())) return submittedLabel;
  const formattedDate = formatTimestampDate(date, locale) ?? submittedLabel;
  return `${submittedLabel} · ${formattedDate}`;
}
