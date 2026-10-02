import {
  parseQuestDetailMode,
  parseQuestIntent,
  parseQuestJoinStatus,
  parseSingleRouteParam,
  resolveQuestDetailRoute,
} from "../questDetailRoute";
import { parseBoardPreviewState } from "../../fixtures/questBoardHarness";
const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;

describe("Quest route parsing", () => {
  afterEach(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
  });
  it("accepts only a single non-empty quest id", () => {
    expect(parseSingleRouteParam("quest-1")).toBe("quest-1");
    expect(parseSingleRouteParam(["quest-1"])).toBe("quest-1");
    expect(parseSingleRouteParam(" quest-1 ")).toBe("quest-1");
    expect(parseSingleRouteParam(["quest-1", "quest-2"])).toBeUndefined();
    expect(parseSingleRouteParam("")).toBeUndefined();
  });

  it("accepts only known preview and intent values", () => {
    expect(parseQuestIntent("apply")).toBe("apply");
    expect(parseQuestIntent("unexpected")).toBeUndefined();
    expect(parseBoardPreviewState("application-pending")).toBe(
      "application-pending"
    );
    expect(parseBoardPreviewState("unexpected")).toBeUndefined();
    expect(
      parseBoardPreviewState(["application-pending", "full"])
    ).toBeUndefined();
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
  it("ignores URL preview outside development and honors it in development", () => {
    devFlag.__DEV__ = false;
    expect(
      resolveQuestDetailRoute({ id: "quest-1", preview: "full" }).previewState
    ).toBeUndefined();

    devFlag.__DEV__ = true;
    expect(
      resolveQuestDetailRoute({ id: "quest-1", preview: "full" }).previewState
    ).toBe("full");
  });

  it("lets an explicit preview prop win over URL preview state", () => {
    devFlag.__DEV__ = true;
    expect(
      resolveQuestDetailRoute(
        { id: "quest-1", preview: "full" },
        { previewState: "closed" }
      ).previewState
    ).toBe("closed");
  });
  it("resolves URL params and lets explicit screen props win", () => {
    expect(
      resolveQuestDetailRoute(
        {
          id: ["route-quest"],
          mode: "join",
          intent: "apply",
          preview: "full",
          studentId: "route-student",
        },
        {
          questId: "prop-quest",
          mode: "post",
          intent: "apply",
          previewState: "closed",
          studentId: "prop-student",
        }
      )
    ).toEqual({
      questId: "prop-quest",
      mode: "post",
      intent: "apply",
      previewState: "closed",
      studentId: "prop-student",
    });
  });
});
