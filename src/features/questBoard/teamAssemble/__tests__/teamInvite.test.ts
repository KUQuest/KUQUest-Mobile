import { createTeamInviteLink, parseTeamInvite } from "../teamInvite";

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const questId = "123e4567-e89b-12d3-a456-426614174000";
const teamId = "987e6543-e21b-12d3-a456-426614174000";

describe("Candidate Team invite links", () => {
  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("creates an HTTPS landing URL with Quest, Team, and Join Code", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://kuquest-dev-api.kubits.org/api";

    const invite = new URL(createTeamInviteLink(questId, teamId, "ABCD2345"));

    expect(invite.origin).toBe("https://kuquest-dev-api.kubits.org");
    expect(invite.pathname).toBe("/invite/team");
    expect(invite.searchParams.get("questId")).toBe(questId);
    expect(invite.searchParams.get("teamId")).toBe(teamId);
    expect(invite.searchParams.get("code")).toBe("ABCD2345");
  });

  it("parses the invite from a complete HTTPS URL and normalizes the code", () => {
    expect(
      parseTeamInvite(
        `https://kuquest-dev-api.kubits.org/invite/team?questId=${questId}&teamId=${teamId}&code=abcd2345`
      )
    ).toEqual({ questId, teamId, joinCode: "ABCD2345" });
  });

  it("rejects non-HTTPS API URLs rather than sharing custom-scheme invites", () => {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:5000";

    expect(() => createTeamInviteLink(questId, teamId, "ABCD2345")).toThrow(
      "Team invite links require an HTTPS API URL"
    );
  });

  it("rejects links without a valid Join Code", () => {
    expect(
      parseTeamInvite(`https://example.test/?teamId=${teamId}&code=bad`)
    ).toBeNull();
  });
});
