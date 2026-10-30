import type { TeamSplitShare } from "@/api/DisputeApi";

export const TOTAL_BASIS_POINTS = 10000;
const PERCENT_PATTERN = /^\d{1,3}(?:\.\d{0,2})?$/;

/** "33.33" → 3333. Null for blank, malformed, more than two decimals, or > 100. */
export function percentToBasisPoints(text: string): number | null {
  const value = text.trim();
  if (!PERCENT_PATTERN.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return basisPoints <= TOTAL_BASIS_POINTS ? basisPoints : null;
}

/** 3333 → "33.33", 5000 → "50". */
export function basisPointsToPercent(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = basisPoints % 100;
  return fraction === 0
    ? String(whole)
    : `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}`;
}

/**
 * Equal percentages as a starting point for the form; the leftover basis
 * points go to the earliest members. Amounts stay server-computed.
 */
export function equalPercentDraft(memberIds: string[]): Record<string, string> {
  const base = Math.floor(TOTAL_BASIS_POINTS / memberIds.length);
  const leftover = TOTAL_BASIS_POINTS - base * memberIds.length;
  return Object.fromEntries(
    memberIds.map((id, index) => [
      id,
      basisPointsToPercent(base + (index < leftover ? 1 : 0)),
    ])
  );
}

export type TeamSplitDraftResult =
  | { ok: true; shares: TeamSplitShare[]; totalBasisPoints: number }
  | {
      ok: false;
      invalidMemberIds: string[];
      totalBasisPoints: number;
    };

/** Every member once, each a valid percent, summing to exactly 100%. */
export function validateTeamSplitDraft(
  memberIds: string[],
  draft: Record<string, string>
): TeamSplitDraftResult {
  const invalidMemberIds: string[] = [];
  const shares: TeamSplitShare[] = [];
  for (const memberId of memberIds) {
    const basisPoints = percentToBasisPoints(draft[memberId] ?? "");
    if (basisPoints === null) invalidMemberIds.push(memberId);
    else shares.push({ memberId, percentageBasisPoints: basisPoints });
  }
  const totalBasisPoints = shares.reduce(
    (sum, share) => sum + share.percentageBasisPoints,
    0
  );
  return invalidMemberIds.length === 0 &&
    totalBasisPoints === TOTAL_BASIS_POINTS
    ? { ok: true, shares, totalBasisPoints }
    : { ok: false, invalidMemberIds, totalBasisPoints };
}
