import type { QuestV2RewardAllocation } from "@/api/questV2Contracts";

export function equalTeamPercentages(
  members: QuestV2RewardAllocation["members"]
) {
  const base = Math.floor(10_000 / members.length);
  const remainder = 10_000 % members.length;
  return Object.fromEntries(
    members.map((member, index) => [
      member.memberId,
      ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2),
    ])
  );
}

/** Matches the Server's largest-remainder split, including roster-order ties. */
export function teamRewardPreview(total: number, basisPoints: number[]) {
  const amounts = basisPoints.map((share) =>
    Math.floor((total * share) / 10_000)
  );
  let remainder = total - amounts.reduce((sum, amount) => sum + amount, 0);
  const order = basisPoints
    .map((share, index) => ({ index, fraction: (total * share) % 10_000 }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remainder === 0) break;
    if (basisPoints[index] > 0) {
      amounts[index] += 1;
      remainder -= 1;
    }
  }
  return amounts;
}
