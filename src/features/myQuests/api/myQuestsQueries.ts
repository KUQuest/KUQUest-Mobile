import { useQuery } from "@tanstack/react-query";

import { myQuestService } from "../myQuestService";

export const myQuestsKeys = {
  all: ["myQuests"] as const,
  hirer: () => [...myQuestsKeys.all, "hirer"] as const,
  worker: (viewerId: string) =>
    [...myQuestsKeys.all, "worker", viewerId] as const,
};

export function useMyHirerQuestsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: myQuestsKeys.hirer(),
    queryFn: ({ signal }) => myQuestService.listAllMyHirerQuests({ signal }),
  });
}

export function useMyWorkerQuestSnapshotsQuery(
  viewerId: string | null,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(viewerId) && enabled,
    queryKey: myQuestsKeys.worker(viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!viewerId) {
        throw new Error("A viewer ID is required");
      }
      return myQuestService.listMyWorkerQuestSnapshots(viewerId, "all", {
        signal,
      });
    },
  });
}
