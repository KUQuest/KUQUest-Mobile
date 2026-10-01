import { secureStorage } from "@/infrastructure/storage/keyValueStorage";
import {
  consumePendingTeamInvite,
  storePendingTeamInvite,
} from "../pendingTeamInvite";

jest.mock("@/infrastructure/storage/keyValueStorage", () => ({
  secureStorage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

const storage = jest.mocked(secureStorage);
const invite = {
  questId: "123e4567-e89b-12d3-a456-426614174000",
  teamId: "987e6543-e21b-12d3-a456-426614174000",
  joinCode: "ABCD2345",
};

describe("pending Candidate Team invite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.get.mockResolvedValue(null);
    storage.set.mockResolvedValue(undefined);
    storage.remove.mockResolvedValue(undefined);
  });

  it("persists the invite and consumes it once after authentication", async () => {
    await storePendingTeamInvite(invite);
    await expect(consumePendingTeamInvite()).resolves.toEqual(invite);
    await expect(consumePendingTeamInvite()).resolves.toBeNull();

    expect(storage.set).toHaveBeenCalledWith(
      "pending-team-invite",
      JSON.stringify(invite)
    );
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });

  it("discards malformed persisted invite state", async () => {
    storage.get.mockResolvedValueOnce(
      JSON.stringify({ ...invite, joinCode: "bad" })
    );

    await expect(consumePendingTeamInvite()).resolves.toBeNull();
    expect(storage.remove).toHaveBeenCalledWith("pending-team-invite");
  });

  it("rejects an invalid invite before persistence", async () => {
    await expect(
      storePendingTeamInvite({ ...invite, joinCode: "bad" })
    ).rejects.toThrow("Invalid Candidate Team invite");
    expect(storage.set).not.toHaveBeenCalled();
  });
});
