import { usePublicProfileQuery } from "@/features/profile/api/profileQueries";

export interface SelectRosterMemberProfile {
  displayName: string;
  avatarUri?: string;
  ratingAverage: number | null;
}

export function useSelectRosterMemberProfile(
  memberId: string
): SelectRosterMemberProfile | undefined {
  const { data, error } = usePublicProfileQuery(memberId);
  if (!data) {
    return error
      ? { displayName: "KU Student", ratingAverage: null }
      : undefined;
  }

  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  return {
    displayName: name || "KU Student",
    avatarUri: data.avatar?.url,
    ratingAverage: data.reputation.rating.average,
  };
}
