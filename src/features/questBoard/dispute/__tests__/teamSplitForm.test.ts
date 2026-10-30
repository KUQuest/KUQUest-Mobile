import {
  basisPointsToPercent,
  equalPercentDraft,
  percentToBasisPoints,
  validateTeamSplitDraft,
} from "../teamSplitForm";

describe("team split form", () => {
  it("converts percent with up to two decimals to basis points", () => {
    expect(percentToBasisPoints("50")).toBe(5000);
    expect(percentToBasisPoints("33.33")).toBe(3333);
    expect(percentToBasisPoints("0.5")).toBe(50);
    expect(percentToBasisPoints("100")).toBe(10000);
    expect(percentToBasisPoints("0")).toBe(0);
    for (const bad of ["", " ", "100.01", "1.234", "-1", "abc", "1e2"]) {
      expect(percentToBasisPoints(bad)).toBeNull();
    }
  });

  it("formats basis points back to percent", () => {
    expect(basisPointsToPercent(5000)).toBe("50");
    expect(basisPointsToPercent(3333)).toBe("33.33");
    expect(basisPointsToPercent(3350)).toBe("33.5");
    expect(basisPointsToPercent(3305)).toBe("33.05");
  });

  it("drafts an equal split that sums to exactly 100%", () => {
    const draft = equalPercentDraft(["a", "b", "c"]);
    expect(draft).toEqual({ a: "33.34", b: "33.33", c: "33.33" });
    expect(validateTeamSplitDraft(["a", "b", "c"], draft).ok).toBe(true);
  });

  it("requires every member and a 10000 basis point total", () => {
    expect(validateTeamSplitDraft(["a", "b"], { a: "50", b: "50" })).toEqual({
      ok: true,
      totalBasisPoints: 10000,
      shares: [
        { memberId: "a", percentageBasisPoints: 5000 },
        { memberId: "b", percentageBasisPoints: 5000 },
      ],
    });
    expect(validateTeamSplitDraft(["a", "b"], { a: "100", b: "0" }).ok).toBe(
      true
    );
    expect(validateTeamSplitDraft(["a", "b"], { a: "60", b: "30" })).toEqual({
      ok: false,
      invalidMemberIds: [],
      totalBasisPoints: 9000,
    });
    expect(validateTeamSplitDraft(["a", "b"], { a: "100" })).toMatchObject({
      ok: false,
      invalidMemberIds: ["b"],
    });
  });
});
