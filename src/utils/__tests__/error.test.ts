import { getErrorMessage } from "../error";

describe("error utils — getErrorMessage", () => {
  it("extracts message from standard Error instance", () => {
    const error = new Error("Network timeout");
    expect(getErrorMessage(error)).toBe("Network timeout");
  });

  it("extracts message from string error", () => {
    expect(getErrorMessage("Direct error text")).toBe("Direct error text");
  });

  it("extracts message from object containing message property", () => {
    const errorObj = { message: "API failure payload" };
    expect(getErrorMessage(errorObj)).toBe("API failure payload");
  });

  it("falls back to default message for empty or invalid errors", () => {
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
    expect(getErrorMessage("")).toBe("An unexpected error occurred");
    expect(getErrorMessage(new Error("   "))).toBe(
      "An unexpected error occurred"
    );
    expect(getErrorMessage({})).toBe("An unexpected error occurred");
  });

  it("uses provided fallback message", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });
});
