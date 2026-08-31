import { z } from "zod";
import type { ImageSourcePropType } from "react-native";

import type {
  AcademicRegistrationOptions,
  AcademicRegistrationStatus,
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
} from "../../api/contracts";
import type {
  CertificateCreate,
  ExperienceCreate,
  PortfolioCreate,
  ProfileUpdate,
  UploadAsset,
} from "../../api/StudentApi";
import type { SupportedLocale } from "../../locales/LocaleProvider";
import type { PrototypePersonaId } from "../../components/ui/prototypeMenuData";

// --- Zod Schemas for Profile Drafts & Entities ---

export const certificateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  issuer: z.string(),
  issuedAt: z.string(),
  imageUri: z.string(),
});

export const workSchema = z.object({
  id: z.string().optional(),
  imageUri: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  employmentType: z.string(),
  organization: z.string(),
  description: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
});

export const profileDraftSchema = z.object({
  name: z.string(),
  telephone: z.string(),
  occupation: z.string(),
  studentId: z.string(),
  faculty: z.string(),
  department: z.string(),
  acceptedTerms: z.boolean(),
  description: z.string(),
  profileImage: z.string(),
  certificates: z.array(certificateSchema),
  works: z.array(workSchema),
  experiences: z.array(experienceSchema),
});

export type Certificate = z.infer<typeof certificateSchema>;
export type Work = z.infer<typeof workSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ProfileDraft = z.infer<typeof profileDraftSchema>;

// --- Domain & View Models ---

export interface ProfileTag {
  id?: string;
  name: string;
  questCount?: number;
}

export interface ProfileCertificate {
  id?: string;
  title: string;
  issuer: string;
  issuedYear: string;
  link: string;
  imageSource?: ImageSourcePropType;
}

export interface ProfileWork {
  id?: string;
  title: string;
  detail: string;
  imageUri: string;
  imageUris?: string[];
  imageSource?: ImageSourcePropType;
}

export interface ProfileExperience {
  id?: string;
  title: string;
  employmentType: string;
  organization: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ProfileStatsData {
  totalQuests: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProfileReview {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  questTitle: string;
}

export interface ProfileImageSource {
  uri: string;
  cacheKey?: string;
}

export type ProfileSection =
  "experience" | "works" | "certificates" | "reviews" | "reputation";
export type ProfileSectionErrors = Partial<Record<ProfileSection, true>>;

export interface ProfileViewData {
  name: string;
  faculty: string;
  university: string;
  occupation: string;
  academicYear: string;
  department: string;
  tags: ProfileTag[];
  profileImage: string | ImageSourcePropType | ProfileImageSource;
  about: string;
  stats: ProfileStatsData;
  experiences: ProfileExperience[];
  certificates: ProfileCertificate[];
  works: ProfileWork[];
  reviews: ProfileReview[];
  sectionErrors: ProfileSectionErrors;
}

export type ProfileAggregate = ProfileViewData;

export type ProfileEditSection = "experience" | "portfolio" | "certificates";
export type ProfileEditSectionErrors = Partial<
  Record<ProfileEditSection, true>
>;

export interface ProfileEditData {
  profile: ProfileResponse;
  occupations: AcademicRegistrationOptions["occupations"];
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
  sectionErrors: ProfileEditSectionErrors;
}

export type ProfileBasicsUpdate = Pick<
  ProfileUpdate,
  "firstName" | "lastName" | "bio" | "occupationId"
>;

export interface ProfileIdentity {
  name: string;
  avatarUrl?: string;
}

export interface ProfileDraftMapperInput {
  profile: ProfileResponse;
  status: AcademicRegistrationStatus;
  options: AcademicRegistrationOptions;
  certificates: CertificateEntry[];
  portfolio: PortfolioEntry[];
  experiences: ExperienceEntry[];
  fallbackName: string;
  fallbackImage: string;
}

// --- Helper Functions ---

export function createEmptyProfile(identity?: ProfileIdentity): ProfileDraft {
  return {
    name: identity?.name ?? "",
    telephone: "",
    occupation: "",
    studentId: "",
    faculty: "",
    department: "",
    acceptedTerms: false,
    description: "",
    profileImage: identity?.avatarUrl ?? "",
    certificates: [],
    works: [],
    experiences: [],
  };
}

export function isProfileDraft(value: unknown): value is ProfileDraft {
  return profileDraftSchema.safeParse(value).success;
}

// --- Profile Adapter Interface (Internal Seam) ---

export interface ProfileAdapter {
  loadProfile(
    locale: SupportedLocale,
    personaId?: PrototypePersonaId
  ): Promise<ProfileViewData>;
  getEditData(personaId?: PrototypePersonaId): Promise<ProfileEditData>;
  updateBasics(
    update: ProfileBasicsUpdate,
    personaId?: PrototypePersonaId
  ): Promise<ProfileResponse>;
  uploadAvatar(
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<string>;
  createExperience(
    entry: ExperienceCreate,
    personaId?: PrototypePersonaId
  ): Promise<ExperienceEntry | undefined>;
  updateExperience(
    id: string,
    update: Partial<ExperienceCreate>,
    personaId?: PrototypePersonaId
  ): Promise<ExperienceEntry | undefined>;
  deleteExperience(id: string, personaId?: PrototypePersonaId): Promise<void>;
  createPortfolio(
    entry: PortfolioCreate,
    personaId?: PrototypePersonaId
  ): Promise<string>;
  updatePortfolio(
    id: string,
    update: { title?: string; description?: string | null },
    personaId?: PrototypePersonaId
  ): Promise<void>;
  uploadPortfolioImage(
    id: string,
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<void>;
  deletePortfolioImage(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void>;
  deletePortfolio(id: string, personaId?: PrototypePersonaId): Promise<void>;
  createCertificate(
    entry: CertificateCreate,
    personaId?: PrototypePersonaId
  ): Promise<string>;
  updateCertificate(
    id: string,
    update: CertificateCreate,
    personaId?: PrototypePersonaId
  ): Promise<void>;
  uploadCertificateImage(
    id: string,
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<void>;
  deleteCertificateImage(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void>;
  deleteCertificate(id: string, personaId?: PrototypePersonaId): Promise<void>;
}
