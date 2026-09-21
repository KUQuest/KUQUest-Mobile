import { QueryClient } from "@tanstack/react-query";

import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { clearSessionCache, sessionKeys } from "../sessionQueries";

describe("session query owner", () => {
  it("removes all cached query data after sign-out", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionKeys.detail(), {
      user: { id: "signed-in-user" },
    });
    const privateKey = myQuestsKeys.worker("signed-in-user");
    queryClient.setQueryData(privateKey, { quests: ["private-data"] });

    clearSessionCache(queryClient);

    expect(queryClient.getQueryData(sessionKeys.detail())).toBeUndefined();
    expect(queryClient.getQueryData(privateKey)).toBeUndefined();
  });
});
