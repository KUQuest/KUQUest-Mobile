import { ApiError } from "@/api/ApiClient";

import { shouldRetryRequest } from "../queryClient";

describe("query retry policy", () => {
  it("skips 4xx API errors and bounds transient retries", () => {
    const unauthorized = new ApiError(401, "UNAUTHORIZED", "No session");
    const serverError = new ApiError(500, "SERVER_ERROR", "Unavailable");

    expect(shouldRetryRequest(0, unauthorized)).toBe(false);
    expect(shouldRetryRequest(0, serverError)).toBe(true);
    expect(shouldRetryRequest(1, new Error("Network unavailable"))).toBe(true);
    expect(shouldRetryRequest(2, new Error("Network unavailable"))).toBe(false);
  });
});
