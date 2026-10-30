import {
  memberNotificationTypeSchema,
  type MemberPenaltyResult,
} from "@/api/NotificationApi";
import {
  notificationOpensProfile,
  notificationPresentation,
  notificationPresentationByType,
} from "../inbox/notificationPresentation";

describe("notificationPresentation", () => {
  it("assigns the intended tone to every known type", () => {
    expect(Object.keys(notificationPresentationByType).sort()).toEqual(
      [...memberNotificationTypeSchema.options].sort()
    );
    expect(
      Object.fromEntries(
        Object.entries(notificationPresentationByType).map(([type, p]) => [
          type,
          p.tone,
        ])
      )
    ).toEqual({
      PENALTY_RED_FLAG_APPLIED: "warning",
      PENALTY_RED_FLAG_EXPIRED: "success",
      PENALTY_BAN_APPLIED: "danger",
      PENALTY_BAN_ENDED: "success",
      CONDUCT_REPORT_UPHELD: "warning",
    });
  });

  it("tones an upheld Conduct Report by its result", () => {
    const tone = (result: MemberPenaltyResult | null) =>
      notificationPresentation({ type: "CONDUCT_REPORT_UPHELD", result }).tone;
    expect(tone("RED_FLAG")).toBe("warning");
    expect(tone(null)).toBe("warning");
    expect(tone("TEMPORARY_BAN")).toBe("danger");
    expect(tone("PERMANENT_BAN")).toBe("danger");
  });

  it("falls back to neutral for an unknown type", () => {
    expect(
      notificationPresentation({ type: "SOMETHING_NEW", result: null }).tone
    ).toBe("neutral");
  });

  it("opens the profile for penalty rows only", () => {
    expect(
      notificationOpensProfile({ type: "PENALTY_BAN_ENDED", result: null })
    ).toBe(false);
    expect(
      notificationOpensProfile({ type: "SOMETHING_NEW", result: null })
    ).toBe(false);
    expect(
      notificationOpensProfile({ type: "CONDUCT_REPORT_UPHELD", result: null })
    ).toBe(true);
    expect(
      notificationOpensProfile({
        type: "PENALTY_RED_FLAG_APPLIED",
        result: "RED_FLAG",
      })
    ).toBe(true);
  });
});
