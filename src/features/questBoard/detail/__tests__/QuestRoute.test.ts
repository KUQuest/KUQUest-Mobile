import {
  parseQuestDetailMode,
  parseQuestIntent,
  parseQuestJoinStatus,
  parseSingleRouteParam,
  resolveQuestDetailRoute,
} from "../questDetailRoute";

describe("Quest route parsing", () => {
  it("accepts only a single non-empty quest id", () => {
    expect(parseSingleRouteParam("quest-1")).toBe("quest-1");
    expect(parseSingleRouteParam(["quest-1"])).toBe("quest-1");
    expect(parseSingleRouteParam(" quest-1 ")).toBe("quest-1");
    expect(parseSingleRouteParam(["quest-1", "quest-2"])).toBeUndefined();
    expect(parseSingleRouteParam("")).toBeUndefined();
  });

  it("accepts only known intent values", () => {
    expect(parseQuestIntent("apply")).toBe("apply");
    expect(parseQuestIntent("unexpected")).toBeUndefined();
  });

  it("accepts only known Quest Detail modes and joined states", () => {
    expect(parseQuestDetailMode("join")).toBe("join");
    expect(parseQuestDetailMode("post")).toBe("post");
    expect(parseQuestDetailMode("unexpected")).toBe("public");
    expect(parseQuestJoinStatus("pending")).toBe("pending");
    expect(parseQuestJoinStatus("accepted")).toBe("accepted");
    expect(parseQuestJoinStatus("history")).toBe("history");
    expect(parseQuestJoinStatus("unexpected")).toBeUndefined();
  });
  it("resolves URL params and lets explicit screen props win", () => {
    expect(
      resolveQuestDetailRoute(
        {
          id: ["route-quest"],
          mode: "join",
          intent: "apply",
          studentId: "route-student",
        },
        {
          questId: "prop-quest",
          mode: "post",
          intent: "apply",
          studentId: "prop-student",
        }
      )
    ).toEqual({
      questId: "prop-quest",
      mode: "post",
      intent: "apply",
      studentId: "prop-student",
    });
  });
});
