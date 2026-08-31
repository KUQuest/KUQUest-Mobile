import type {
  ProfileCertificate,
  ProfileExperience,
  ProfileReview,
  ProfileStatsData,
  ProfileTag,
  ProfileViewData,
  ProfileWork,
} from "./components/ProfileComponents";
import { authEnvironment } from "../auth/authEnvironment";
import type { PrototypePersonaId } from "../../components/ui/prototypeMenuData";

const demoAvatar = require("../../../assets/images/profile/demo-avatar.svg");

export function isProfileDemoEnabled(): boolean {
  return authEnvironment.isDemoEnabled();
}

export const demoProfileImage = demoAvatar;

export const demoProfileIdentity = {
  name: "Siraphat THAPPHA",
  faculty: "Engineering",
  university: "State University",
  occupation: "Student",
  department: "Software and Knowledge Engineering",
  about:
    "A KU student building useful digital experiences, mentoring peers, and contributing to campus communities. I enjoy turning complex ideas into clear, accessible interfaces and collaborating with teams from concept to delivery. Outside coursework, I explore design systems, front-end engineering, and practical tools that make student life easier.",
};

export const demoProfileTags: ProfileTag[] = [
  { id: "demo-technology", name: "Technology", questCount: 2 },
  { id: "demo-campus-life", name: "Campus life", questCount: 2 },
  { id: "demo-design-creative", name: "Design & creative", questCount: 1 },
];

export const demoProfileStats: ProfileStatsData = {
  totalQuests: 68,
  ratingAverage: 4.9,
  ratingCount: 15,
  distribution: { 5: 12, 4: 2, 3: 1, 2: 0, 1: 0 },
};

const demoCertificateImage = require("../../../assets/images/profile/demo-certificate.svg");

export const demoCertificates: ProfileCertificate[] = [
  {
    id: "demo-certificate-react",
    title: "Advanced React Patterns",
    issuer: "Frontend Masters",
    issuedYear: "2023",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-design",
    title: "UI/UX Design Specialization",
    issuer: "Coursera",
    issuedYear: "2022",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-python",
    title: "Python for Data Science",
    issuer: "IBM",
    issuedYear: "2023",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-google",
    title: "Google UX Design",
    issuer: "Google/Coursera",
    issuedYear: "2024",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-accessibility",
    title: "Accessible Web Foundations",
    issuer: "W3C Training",
    issuedYear: "2024",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-figma",
    title: "Figma Interface Design",
    issuer: "Figma Academy",
    issuedYear: "2024",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-agile",
    title: "Agile Project Management",
    issuer: "Atlassian University",
    issuedYear: "2025",
    link: "",
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-certificate-cloud",
    title: "Cloud Computing Basics",
    issuer: "Google Cloud Skills Boost",
    issuedYear: "2025",
    link: "",
    imageSource: demoCertificateImage,
  },
];

export const demoWorks: ProfileWork[] = [
  {
    id: "demo-work-portfolio",
    title: "Student Quest Portfolio",
    detail: "A responsive project showcase built for KU students.",
    imageUri: "",
    imageUris: [],
    imageSource: demoCertificateImage,
  },
  {
    id: "demo-work-dashboard",
    title: "Campus Dashboard",
    detail: "A dashboard for discovering useful campus services.",
    imageUri: "",
    imageUris: [],
    imageSource: demoCertificateImage,
  },
];

export const demoExperiences: ProfileExperience[] = [
  {
    id: "demo-experience-2",
    title: "Frontend Developer Intern",
    employmentType: "Internship",
    organization: "Tech Startup Inc.",
    description:
      "Developed responsive UI components using React and Tailwind CSS.",
    startedAt: "2023-06-01",
    endedAt: "2023-08-01",
  },
  {
    id: "demo-experience-1",
    title: "Senior Peer Tutor",
    employmentType: "Part-time",
    organization: "University Academic Center",
    description:
      "Assisted over 100 students in foundational programming courses.",
    startedAt: "2022-06-01",
    endedAt: null,
  },
];

export const demoReviews: ProfileReview[] = [
  {
    id: "demo-review-1",
    reviewerName: "Alex Smith",
    reviewerAvatar: "",
    rating: 5,
    comment: "Jane explained complex topics in a very simple way.",
    createdAt: "2026-07-29T00:00:00Z",
    questTitle: "React tutoring",
  },
  {
    id: "demo-review-2",
    reviewerName: "Mina Chen",
    reviewerAvatar: "",
    rating: 4,
    comment: "Great communication and thoughtful design feedback.",
    createdAt: "2026-07-12T00:00:00Z",
    questTitle: "Landing page review",
  },
  {
    id: "demo-review-3",
    reviewerName: "Krit S.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Reliable, punctual, and easy to work with.",
    createdAt: "2026-06-28T00:00:00Z",
    questTitle: "Campus event setup",
  },
  {
    id: "demo-review-4",
    reviewerName: "Narin P.",
    reviewerAvatar: "",
    rating: 5,
    comment:
      "Delivered excellent work and paid close attention to the details.",
    createdAt: "2026-06-15T00:00:00Z",
    questTitle: "Student club website",
  },
  {
    id: "demo-review-5",
    reviewerName: "Ploy K.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Very helpful and explained every step clearly.",
    createdAt: "2026-06-03T00:00:00Z",
    questTitle: "Programming tutoring",
  },
  {
    id: "demo-review-6",
    reviewerName: "Beam T.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Great communication from start to finish.",
    createdAt: "2026-05-24T00:00:00Z",
    questTitle: "Faculty open house",
  },
  {
    id: "demo-review-7",
    reviewerName: "Fern L.",
    reviewerAvatar: "",
    rating: 5,
    comment: "The final result was better than we expected.",
    createdAt: "2026-05-10T00:00:00Z",
    questTitle: "Design system review",
  },
  {
    id: "demo-review-8",
    reviewerName: "Ton K.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Professional, friendly, and well prepared.",
    createdAt: "2026-04-29T00:00:00Z",
    questTitle: "Workshop assistance",
  },
  {
    id: "demo-review-9",
    reviewerName: "Aom R.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Finished the task quickly with excellent quality.",
    createdAt: "2026-04-16T00:00:00Z",
    questTitle: "Portfolio feedback",
  },
  {
    id: "demo-review-10",
    reviewerName: "Non P.",
    reviewerAvatar: "",
    rating: 5,
    comment: "A thoughtful teammate who always follows through.",
    createdAt: "2026-04-02T00:00:00Z",
    questTitle: "Student orientation",
  },
  {
    id: "demo-review-11",
    reviewerName: "Fah W.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Made a difficult task feel simple and manageable.",
    createdAt: "2026-03-18T00:00:00Z",
    questTitle: "Research presentation",
  },
  {
    id: "demo-review-12",
    reviewerName: "Mew J.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Clear updates and a polished final delivery.",
    createdAt: "2026-03-05T00:00:00Z",
    questTitle: "Mobile app prototype",
  },
  {
    id: "demo-review-13",
    reviewerName: "Mint S.",
    reviewerAvatar: "",
    rating: 5,
    comment: "Kind, capable, and a pleasure to collaborate with.",
    createdAt: "2026-02-21T00:00:00Z",
    questTitle: "Peer mentoring",
  },
  {
    id: "demo-review-14",
    reviewerName: "Game T.",
    reviewerAvatar: "",
    rating: 4,
    comment: "Strong work overall and very responsive.",
    createdAt: "2026-02-08T00:00:00Z",
    questTitle: "Event registration page",
  },
  {
    id: "demo-review-15",
    reviewerName: "Dao L.",
    reviewerAvatar: "",
    rating: 3,
    comment: "The task was completed, with room for clearer progress updates.",
    createdAt: "2026-01-25T00:00:00Z",
    questTitle: "Campus guide update",
  },
];

type DemoPersonaProfile = Readonly<{
  identity: typeof demoProfileIdentity;
  tags: readonly ProfileTag[];
  stats: ProfileStatsData;
}>;

/** Display data for the same four identities used by the prototype adapter. */
export const demoProfilePersonas: Record<
  PrototypePersonaId,
  DemoPersonaProfile
> = {
  "demo-hirer": {
    identity: {
      name: "Demo Hirer",
      faculty: "Business Administration",
      university: "State University",
      occupation: "Staff",
      department: "Student Affairs",
      about:
        "I create and fund Quests for KU Account Holders, then coordinate the work from selection through completion.",
    },
    tags: [
      { id: "demo-campus-events", name: "Campus events", questCount: 4 },
      { id: "demo-research", name: "Research", questCount: 3 },
      { id: "demo-operations", name: "Operations", questCount: 2 },
    ],
    stats: {
      totalQuests: 12,
      ratingAverage: 4.8,
      ratingCount: 9,
      distribution: { 5: 7, 4: 2, 3: 0, 2: 0, 1: 0 },
    },
  },
  "student-demo": {
    identity: demoProfileIdentity,
    tags: demoProfileTags,
    stats: demoProfileStats,
  },
  "demo-worker-2": {
    identity: {
      name: "Demo Worker 2",
      faculty: "Science",
      university: "State University",
      occupation: "Student",
      department: "Applied Science",
      about:
        "I enjoy practical campus work, clear communication, and helping Quest teams deliver reliable results.",
    },
    tags: [
      { id: "demo-media", name: "Media", questCount: 3 },
      { id: "demo-campus-life-worker", name: "Campus life", questCount: 2 },
      { id: "demo-event-support", name: "Event support", questCount: 2 },
    ],
    stats: {
      totalQuests: 8,
      ratingAverage: 4.7,
      ratingCount: 6,
      distribution: { 5: 4, 4: 2, 3: 0, 2: 0, 1: 0 },
    },
  },
  "demo-worker-3": {
    identity: {
      name: "Demo Worker 3",
      faculty: "Humanities",
      university: "State University",
      occupation: "Student",
      department: "Digital Media",
      about:
        "I lead collaborative Quest teams, keep rosters organized, and turn shared plans into finished work.",
    },
    tags: [
      { id: "demo-teamwork", name: "Teamwork", questCount: 5 },
      { id: "demo-digital-media", name: "Digital media", questCount: 4 },
      { id: "demo-projects", name: "Projects", questCount: 3 },
    ],
    stats: {
      totalQuests: 15,
      ratingAverage: 4.9,
      ratingCount: 11,
      distribution: { 5: 9, 4: 2, 3: 0, 2: 0, 1: 0 },
    },
  },
};

function cloneStats(stats: ProfileStatsData): ProfileStatsData {
  return { ...stats, distribution: { ...stats.distribution } };
}

export function getDemoProfileViewData(
  personaId: PrototypePersonaId = authEnvironment.getActivePersonaId()
): ProfileViewData {
  const persona = demoProfilePersonas[personaId];
  return {
    name: persona.identity.name,
    faculty: persona.identity.faculty,
    university: persona.identity.university,
    occupation: persona.identity.occupation,
    academicYear: "",
    department: persona.identity.department,
    tags: persona.tags.map((tag) => ({ ...tag })),
    profileImage: demoProfileImage,
    about: persona.identity.about,
    stats: cloneStats(persona.stats),
    experiences: demoExperiences.map((experience) => ({ ...experience })),
    certificates: demoCertificates.map((certificate) => ({ ...certificate })),
    works: demoWorks.map((work) => ({
      ...work,
      imageUris: work.imageUris ? [...work.imageUris] : undefined,
    })),
    reviews: demoReviews.map((review) => ({ ...review })),
    sectionErrors: {},
  };
}
