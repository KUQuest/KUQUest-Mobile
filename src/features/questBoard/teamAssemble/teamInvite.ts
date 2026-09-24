import * as Linking from "expo-linking";

/**
 * The Join Code endpoint is Team-specific and a Prospective Worker cannot list
 * other Candidate Teams, so a Team invite carries both the Team id and code.
 */
export function createTeamInviteLink(
  questId: string,
  teamId: string,
  joinCode: string
): string {
  return Linking.createURL(`quest/${questId}/team`, {
    queryParams: { teamId, code: joinCode },
  });
}

/** Reads the Team id and Join Code from a pasted or opened Team invite link. */
export function parseTeamInvite(
  text: string
): { teamId: string; joinCode: string } | null {
  const teamId = /[?&]teamId=([0-9a-f-]{36})\b/i.exec(text)?.[1];
  const joinCode = /[?&]code=([A-Z0-9]{8})\b/i.exec(text)?.[1];
  return teamId && joinCode
    ? { teamId, joinCode: joinCode.toUpperCase() }
    : null;
}
