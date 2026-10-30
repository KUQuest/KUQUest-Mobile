import { equalTeamPercentages, teamRewardPreview } from "../teamRewardPreview";

describe("Exact team reward previews", () => {
  it("keeps the entire pool for a 20-member equal split", () => {
    const members = Array.from({ length: 20 }, (_, index) => ({
      memberId: String(index),
      displayName: String(index),
      isLeader: index === 0,
      percentageBasisPoints: null,
      rewardSatang: null,
    }));
    const percentages = equalTeamPercentages(members);
    const shares = members.map(
      (member) => Number(percentages[member.memberId]) * 100
    );
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(10_000);
    const amounts = teamRewardPreview(101, shares);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(101);
    expect(amounts).toEqual([6, ...Array(19).fill(5)]);
  });

  it("does not give a satang to a zero share and resolves ties in roster order", () => {
    expect(teamRewardPreview(1, [0, 5000, 5000])).toEqual([0, 1, 0]);
    expect(teamRewardPreview(12345, [0, 10_000, 0])).toEqual([0, 12345, 0]);
    expect(teamRewardPreview(100, [3333, 3333, 3334])).toEqual([33, 33, 34]);
  });
});
