import { useLocalSearchParams } from "expo-router";

import EditQuestScreen from "@/features/createQuest/EditQuestScreen";

function routeValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value)
    ? value.length === 1
      ? value[0]
      : undefined
    : value;
}

export default function QuestEditRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <EditQuestScreen questId={routeValue(params.id)} />;
}
