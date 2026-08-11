import { profileDraftSchema } from './profileSchema';
import type { ProfileDraft } from './profileSchema';

export type { Certificate, ProfileDraft, Work } from './profileSchema';

export interface ProfileIdentity {
  name: string;
  avatarUrl?: string;
}

export function createEmptyProfile(identity?: ProfileIdentity): ProfileDraft {
  return {
    name: identity?.name ?? '',
    telephone: '',
    occupation: '',
    studentId: '',
    faculty: '',
    department: '',
    acceptedTerms: false,
    description: '',
    profileImage: identity?.avatarUrl ?? '',
    certificates: [],
    works: [],
  };
}

export function isProfileDraft(value: unknown): value is ProfileDraft {
  return profileDraftSchema.safeParse(value).success;
}
