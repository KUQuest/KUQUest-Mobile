import { useQuery } from "@tanstack/react-query";

import { questApi } from "@/api/QuestApi";

export const questTagsKeys = {
  all: ["questTags"] as const,
};

export function useQuestTagsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: questTagsKeys.all,
    queryFn: ({ signal }) => questApi.listTags({ signal }),
  });
}
