import type { CertificateEntry, ExperienceEntry, PortfolioEntry, ProfileResponse } from '../../api/contracts';
import type { ProfileTagOption } from '../../api/ProfileApi';

export type EditSection = 'basics' | 'experience' | 'portfolio' | 'certificates';

export interface ProfileEditRouteData {
  profile: ProfileResponse;
  occupations: { id: string; name: string; requiresStudentId: boolean }[];
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
  tagOptions: ProfileTagOption[];
}

export interface BasicsForm {
  name: string;
  bio: string;
  occupationId: string;
  tagIds: string[];
  profileImage: string;
}

export interface ExperienceForm {
  title: string;
  employmentType: string;
  organization: string;
  description: string;
  startedAt: string;
  endedAt: string;
}

export interface PortfolioForm {
  title: string;
  description: string;
  imageUri: string;
}

export interface CertificateForm {
  name: string;
  issuer: string;
  issuedAt: string;
  imageUri: string;
}

export function toBasicsForm(profile: ProfileResponse): BasicsForm {
  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
    bio: profile.bio ?? '',
    occupationId: profile.occupation?.id ?? '',
    tagIds: profile.tags?.map((tag) => tag.id) ?? [],
    profileImage: profile.avatar?.url ?? '',
  };
}

export function toExperienceForm(entry?: ExperienceEntry): ExperienceForm {
  return {
    title: entry?.title ?? '',
    employmentType: entry?.employmentType ?? '',
    organization: entry?.organization ?? '',
    description: entry?.description ?? '',
    startedAt: entry?.startedAt ?? '',
    endedAt: entry?.endedAt ?? '',
  };
}

export function toPortfolioForm(entry?: PortfolioEntry): PortfolioForm {
  return {
    title: entry?.title ?? '',
    description: entry?.description ?? '',
    imageUri: entry?.images[0]?.url ?? '',
  };
}

export function toCertificateForm(entry?: CertificateEntry): CertificateForm {
  return {
    name: entry?.name ?? '',
    issuer: entry?.issuer ?? '',
    issuedAt: entry?.issuedAt ?? '',
    imageUri: entry?.image?.url ?? '',
  };
}

export function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}
