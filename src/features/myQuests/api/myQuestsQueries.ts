import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";
import { myQuestService } from "../myQuestService";
export const myQuestsKeys = {
  all: ["myQuests"] as const,
  hirer: () => [...myQuestsKeys.all, "hirer"] as const,
  worker: (viewerId: string) =>
    [...myQuestsKeys.all, "worker", viewerId] as const,
};

export function useMyHirerQuestsQuery(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled,
    queryKey: myQuestsKeys.hirer(),
    queryFn: ({ signal }) => myQuestService.listAllMyHirerQuests({ signal }),
  });
  const hasSnapshot = query.data !== undefined;

  useEffect(() => {
    if (!enabled || !hasSnapshot) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: myQuestsKeys.hirer() });
    };
    return subscribeToHirerQuestEvents(invalidate, invalidate);
  }, [enabled, hasSnapshot, queryClient]);

  return query;
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
