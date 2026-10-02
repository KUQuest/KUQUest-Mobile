import type { ImageSourcePropType } from "react-native";

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
  sectionUnavailable: ProfileSectionErrors;
}

export type ProfileTab =
  "about" | "experience" | "works" | "certificates" | "reviews";
export type ProfileSection =
  "experience" | "works" | "certificates" | "reviews" | "reputation";
export type ProfileSectionErrors = Partial<Record<ProfileSection, true>>;

export interface ProfileAccessibilityLabels {
  profileImageLabel: (name: string) => string;
  questCategoriesLabel: string;
  sectionsLabel: string;
  statisticsLabel: string;
  ratingSummaryLabel: string;
  ratingDistributionLabel: string;
  reviewRatingLabel: (rating: number) => string;
  certificatePreviewLabel: (title: string) => string;
  certificateImageLabel: (title: string) => string;
  workImageLabel: (title: string) => string;
  reviewerAvatarLabel: (name: string) => string;
  reviewFilterLabel: (rating: number) => string;
}
