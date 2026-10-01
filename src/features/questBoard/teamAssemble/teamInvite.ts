/**
 * The Join Code endpoint is Team-specific and a Prospective Worker cannot list
 * other Candidate Teams, so a Team invite carries both the Team id and code.
 */
export function createTeamInviteLink(
  questId: string,
  teamId: string,
  joinCode: string
): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is not configured");
  const apiOrigin = new URL(apiUrl);
  if (apiOrigin.protocol !== "https:") {
    throw new Error("Team invite links require an HTTPS API URL");
  }
  const inviteUrl = new URL("/invite/team", apiOrigin.origin);
  inviteUrl.searchParams.set("questId", questId);
  inviteUrl.searchParams.set("teamId", teamId);
  inviteUrl.searchParams.set("code", joinCode);
  return inviteUrl.toString();
}

/** Reads the Team id and Join Code from a pasted or opened Team invite link. */
export function parseTeamInvite(
  text: string
): { questId?: string; teamId: string; joinCode: string } | null {
  const questId = /[?&]questId=([0-9a-f-]{36})\b/i.exec(text)?.[1];
  const teamId = /[?&]teamId=([0-9a-f-]{36})\b/i.exec(text)?.[1];
  const joinCode = /[?&]code=([A-Z0-9]{8})\b/i.exec(text)?.[1];
  return teamId && joinCode
    ? {
        ...(questId ? { questId } : {}),
        teamId,
        joinCode: joinCode.toUpperCase(),
      }
    : null;
}
