import { useLocale } from "@/features/preferences/localeStore";
import {
  localizeDepartmentName,
  localizeFacultyName,
} from "@/locales/academicUnits";
import { usePublicProfileQuery } from "@/features/profile/api/profileQueries";

export interface SelectRosterMemberProfile {
  displayName: string;
  avatarUri?: string;
  ratingAverage: number | null;
  faculty?: string;
  department?: string;
}

export function useSelectRosterMemberProfile(
  memberId: string
): SelectRosterMemberProfile | undefined {
  const { locale } = useLocale();
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
    faculty: data.department?.faculty.name
      ? localizeFacultyName(data.department.faculty.name, locale)
      : undefined,
    department: data.department?.name
      ? localizeDepartmentName(data.department.name, locale)
      : undefined,
  };
}
