import {
  hasHandledTransition,
  localizedMemberPushCopy,
  localizedPushCopy,
  markTransitionHandled,
  parseMemberPushPayload,
  parsePushPayload,
  routeForPush,
} from "../push/pushPayload";
import type { KeyValueStorage } from "@/infrastructure/storage/keyValueStorage";

const questId = "5f0c7f58-3f7e-4f63-9d0b-0a4c3c1f7a11";
const now = Date.parse("2026-10-01T10:00:00.000Z");

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => void values.set(key, value),
    remove: async (key) => void values.delete(key),
  };
}

describe("push payload", () => {
  it("accepts a known data-only payload and rejects malformed ones", () => {
    const valid = {
      type: "UNDERFILLED_CANCELLED",
      questId,
      transitionId: "t-1",
      cancellationReason: "WORKER_DECLINED",
    };
    expect(parsePushPayload(valid)).toEqual(valid);
    expect(parsePushPayload({ ...valid, type: "OTHER" })).toBeNull();
    expect(parsePushPayload({ ...valid, questId: "nope" })).toBeNull();
    expect(parsePushPayload({ ...valid, transitionId: " " })).toBeNull();
    expect(parsePushPayload({ ...valid, cancellationReason: "X" })).toBeNull();
    expect(parsePushPayload(null)).toBeNull();
  });

  it("opens consent for the response window and Quest Detail otherwise", () => {
    expect(
      routeForPush({ type: "UNDERFILLED_CONSENT_PENDING", questId }).pathname
    ).toBe("/quest/[id]/partial-start");
    for (const type of [
      "UNDERFILLED_DECISION_PENDING",
      "UNDERFILLED_COMPLETED",
      "UNDERFILLED_CANCELLED",
      "QUEST_ASSIGNED",
    ] as const) {
      expect(routeForPush({ type, questId })).toEqual({
        pathname: "/quest/[id]",
        params: { id: questId },
      });
    }
  });

  it("accepts the per-Worker review pushes and words each failure reason", () => {
    const assignmentId = "6a1d7f58-3f7e-4f63-9d0b-0a4c3c1f7a22";
    const notApproved = {
      type: "PROOF_NOT_APPROVED",
      questId,
      transitionId: "t-4",
      assignmentId,
    };
    expect(parsePushPayload(notApproved)).toEqual(notApproved);
    expect(
      parsePushPayload({
        type: "QUEST_COMPLETED_DISPUTE_WINDOW_OPEN",
        questId,
        transitionId: "t-5",
        assignmentId,
      })
    ).not.toBeNull();
    expect(
      parsePushPayload({
        type: "QUEST_FAILED",
        questId,
        transitionId: "t-6",
        failureReason: "NOPE",
      })
    ).toBeNull();
    expect(routeForPush({ type: "PROOF_NOT_APPROVED", questId })).toEqual({
      pathname: "/quest/[id]",
      params: { id: questId },
    });
    const bodies = (["PROOF_NOT_APPROVED", "DUE_AT_MISSED"] as const).map(
      (failureReason) =>
        localizedPushCopy(
          { type: "QUEST_FAILED", questId, transitionId: "t-6", failureReason },
          "en",
          now
        )?.body
    );
    expect(new Set(bodies).size).toBe(2);
    expect(
      localizedPushCopy(
        { type: "QUEST_FAILED", questId, transitionId: "t-7" },
        "th",
        now
      )?.body
    ).toBeTruthy();
  });

  it("drops timed notices that are expired or lack a server expiry", () => {
    const base = {
      type: "UNDERFILLED_CONSENT_PENDING" as const,
      questId,
      transitionId: "t-2",
    };
    const future = new Date(now + 5 * 60_000).toISOString();
    expect(
      localizedPushCopy({ ...base, expiresAt: future }, "en", now)?.body
    ).toContain("5 min");
    expect(
      localizedPushCopy(
        { ...base, expiresAt: new Date(now - 1000).toISOString() },
        "en",
        now
      )
    ).toBeNull();
    expect(localizedPushCopy(base, "en", now)).toBeNull();
  });

  it("words each cancellation reason without implying a Worker refund", () => {
    const reasons = [
      "HIRER_CANCELLED",
      "HIRER_NO_DECISION",
      "WORKER_DECLINED",
      "CONSENT_TIMEOUT",
    ] as const;
    const bodies = reasons.map(
      (cancellationReason) =>
        localizedPushCopy(
          {
            type: "UNDERFILLED_CANCELLED",
            questId,
            transitionId: "t-3",
            cancellationReason,
          },
          "th",
          now
        )?.body
    );
    expect(new Set(bodies).size).toBe(4);
    expect(bodies.join(" ")).not.toMatch(/refund|คืนเงิน/i);
  });

  it("remembers handled transitions across calls with a bounded history", async () => {
    const storage = memoryStorage();
    expect(await hasHandledTransition(storage, "t-1")).toBe(false);
    await markTransitionHandled(storage, "t-1");
    expect(await hasHandledTransition(storage, "t-1")).toBe(true);
    for (let i = 0; i < 150; i += 1) {
      await markTransitionHandled(storage, `bulk-${i}`);
    }
    expect(await hasHandledTransition(storage, "t-1")).toBe(false);
    expect(await hasHandledTransition(storage, "bulk-149")).toBe(true);
  });
});

describe("member penalty push", () => {
  const base = {
    type: "PENALTY_BAN_APPLIED",
    eventKey: "penalty-applied:p-1",
    transitionId: "t-9",
    result: "TEMPORARY_BAN",
    ladder: "MISCONDUCT",
    expiresAt: "2026-11-06T10:00:00.000Z",
  };

  it("accepts a payload without questId or notificationId", () => {
    const parsed = parseMemberPushPayload(base);
    expect(parsed).toMatchObject({
      type: "PENALTY_BAN_APPLIED",
      eventKey: "penalty-applied:p-1",
    });
    expect(parsePushPayload(base)).toBeNull();
    expect(
      parseMemberPushPayload({ type: "CONDUCT_REPORT_UPHELD", eventKey: "c-1" })
    ).not.toBeNull();
    expect(parseMemberPushPayload({ ...base, eventKey: " " })).toBeNull();
  });

  it("words the ban by result with the app's own copy", () => {
    const temporary = parseMemberPushPayload(base);
    const permanent = parseMemberPushPayload({
      type: "PENALTY_BAN_APPLIED",
      eventKey: "k",
      result: "PERMANENT_BAN",
    });
    expect(temporary && localizedMemberPushCopy(temporary, "en").body).toMatch(
      /cannot sign in until/
    );
    expect(permanent && localizedMemberPushCopy(permanent, "en").title).toBe(
      "Your account is permanently banned"
    );
    expect(permanent && localizedMemberPushCopy(permanent, "th").title).toBe(
      "บัญชีของคุณถูกแบนถาวร"
    );
  });
});
