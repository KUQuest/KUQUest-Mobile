import { create } from "zustand";
import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

const PENDING_TEAM_INVITE_KEY = "pending-team-invite";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const joinCodePattern = /^[A-Z0-9]{8}$/;

export interface PendingTeamInvite {
  questId: string;
  teamId: string;
  joinCode: string;
}

interface PendingTeamInviteState {
  pendingInvite: PendingTeamInvite | null;
  setPendingInvite: (invite: PendingTeamInvite | null) => void;
}

const usePendingTeamInviteStore = create<PendingTeamInviteState>((set) => ({
  pendingInvite: null,
  setPendingInvite: (pendingInvite) => set({ pendingInvite }),
}));

function isPendingTeamInvite(value: unknown): value is PendingTeamInvite {
  if (typeof value !== "object" || value === null) return false;
  const invite = value as Record<string, unknown>;
  return (
    typeof invite.questId === "string" &&
    uuidPattern.test(invite.questId) &&
    typeof invite.teamId === "string" &&
    uuidPattern.test(invite.teamId) &&
    typeof invite.joinCode === "string" &&
    joinCodePattern.test(invite.joinCode)
  );
}

export async function storePendingTeamInvite(
  invite: PendingTeamInvite
): Promise<void> {
  if (!isPendingTeamInvite(invite)) {
    throw new Error("Invalid Candidate Team invite");
  }
  await secureStorage.set(PENDING_TEAM_INVITE_KEY, JSON.stringify(invite));
  usePendingTeamInviteStore.getState().setPendingInvite(invite);
}

export async function consumePendingTeamInvite(): Promise<PendingTeamInvite | null> {
  const stored = usePendingTeamInviteStore.getState().pendingInvite;
  if (stored) {
    await secureStorage.remove(PENDING_TEAM_INVITE_KEY);
    usePendingTeamInviteStore.getState().setPendingInvite(null);
    return stored;
  }
  const rawInvite = await secureStorage.get(PENDING_TEAM_INVITE_KEY);
  if (rawInvite === null) return null;
  await secureStorage.remove(PENDING_TEAM_INVITE_KEY);
  try {
    const invite: unknown = JSON.parse(rawInvite);
    return isPendingTeamInvite(invite) ? invite : null;
  } catch {
    return null;
  }
}
