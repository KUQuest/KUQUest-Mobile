import { QueryClient } from "@tanstack/react-query";

import { clearSessionCache, sessionKeys } from "../sessionQueries";

describe("session query owner", () => {
  it("removes the cached session after sign-out", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionKeys.detail(), {
      user: { id: "signed-in-user" },
    });

    clearSessionCache(queryClient);

    expect(queryClient.getQueryData(sessionKeys.detail())).toBeUndefined();
  });
});
