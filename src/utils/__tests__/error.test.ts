import { ApiError } from "@/api/ApiClient";
import { alertMessages } from "@/locales/alertMessages";
import { getLocalizedErrorMessage } from "../error";

const th = alertMessages.th;

describe("getLocalizedErrorMessage", () => {
  it("never shows raw server or exception text", () => {
    expect(
      getLocalizedErrorMessage(
        new ApiError(400, "BAD_INPUT", "Validation failed: title"),
        "th"
      )
    ).toBe(th.errorFallback);
    expect(getLocalizedErrorMessage(new Error("boom"), "th")).toBe(
      th.errorFallback
    );
  });

  it("prefers feature copy for a known code over the fallback", () => {
    const error = new ApiError(409, "QUEST_FULL", "Quest is full");
    expect(
      getLocalizedErrorMessage(error, "th", { codes: { QUEST_FULL: "เต็ม" } })
    ).toBe("เต็ม");
    expect(
      getLocalizedErrorMessage(error, "th", { fallback: "ไม่สำเร็จ" })
    ).toBe("ไม่สำเร็จ");
  });

  it("maps status classes, network failures, and the feature fallback", () => {
    const status = (code: number) =>
      getLocalizedErrorMessage(new ApiError(code, `HTTP_${code}`, "x"), "en");
    const en = alertMessages.en;
    expect(status(401)).toBe(en.sessionExpired);
    expect(status(403)).toBe(en.forbidden);
    expect(status(404)).toBe(en.notFound);
    expect(status(429)).toBe(en.rateLimited);
    expect(status(503)).toBe(en.serverError);
    expect(
      getLocalizedErrorMessage(new TypeError("Network request failed"), "en")
    ).toBe(en.networkError);
    expect(
      getLocalizedErrorMessage(new ApiError(422, "X", "x"), "en", {
        fallback: "Could not save",
      })
    ).toBe("Could not save");
  });
});
