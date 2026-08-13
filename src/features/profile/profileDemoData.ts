import type { ProfileCertificate, ProfileExperience, ProfileReview, ProfileStatsData, ProfileTag, ProfileWork } from './components/ProfileComponents';

const demoAvatar = require('../../../assets/images/profile/demo-avatar.svg');

export function isProfileDemoEnabled(): boolean {
  return process.env.EXPO_PUBLIC_PROFILE_DEMO === 'true';
}

export const demoProfileImage = demoAvatar;

export const demoProfileIdentity = {
  name: 'Siraphat THAPPHA',
  faculty: 'Engineering',
  occupation: 'Student',
  department: 'Software and Knowledge Engineering',
  about: 'A KU student building useful digital experiences and helping other students learn.',
};

export const demoProfileTags: ProfileTag[] = [
  { id: 'demo-web-dev', name: 'Web Dev', questCount: 8 },
  { id: 'demo-design', name: 'Design', questCount: 5 },
  { id: 'demo-tutor', name: 'Tutor', questCount: 3 },
];

export const demoProfileStats: ProfileStatsData = {
  totalQuests: 42,
  ratingAverage: 4.9,
  ratingCount: 15,
  distribution: { 5: 12, 4: 2, 3: 1, 2: 0, 1: 0 },
};

const demoCertificateImage = require('../../../assets/images/profile/demo-certificate.svg');

export const demoCertificates: ProfileCertificate[] = [
  { id: 'demo-certificate-react', title: 'Advanced React Patterns', issuer: 'Frontend Masters', issuedYear: '2023', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-design', title: 'UI/UX Design Specialization', issuer: 'Coursera', issuedYear: '2022', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-python', title: 'Python for Data Science', issuer: 'IBM', issuedYear: '2023', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-google', title: 'Google UX Design', issuer: 'Google/Coursera', issuedYear: '2024', link: '', imageSource: demoCertificateImage },
];

export const demoWorks: ProfileWork[] = [
  { id: 'demo-work-portfolio', title: 'Student Quest Portfolio', detail: 'A responsive project showcase built for KU students.', imageUri: '', imageSource: demoCertificateImage },
  { id: 'demo-work-dashboard', title: 'Campus Dashboard', detail: 'A dashboard for discovering useful campus services.', imageUri: '', imageSource: demoCertificateImage },
];

export const demoExperiences: ProfileExperience[] = [
  {
    id: 'demo-experience-2',
    title: 'Frontend Developer Intern',
    employmentType: 'Internship',
    organization: 'Tech Startup Inc.',
    description: 'Developed responsive UI components using React and Tailwind CSS.',
    startedAt: '2023-06-01',
    endedAt: '2023-08-01',
  },
  {
    id: 'demo-experience-1',
    title: 'Senior Peer Tutor',
    employmentType: 'Part-time',
    organization: 'University Academic Center',
    description: 'Assisted over 100 students in foundational programming courses.',
    startedAt: '2022-06-01',
    endedAt: null,
  },
];

export const demoReviews: ProfileReview[] = [
  {
    id: 'demo-review-1',
    reviewerName: 'Alex Smith',
    reviewerAvatar: '',
    rating: 5,
    comment: 'Jane explained complex topics in a very simple way.',
    createdAt: '2026-07-29T00:00:00Z',
    questTitle: 'React tutoring',
  },
  {
    id: 'demo-review-2',
    reviewerName: 'Mina Chen',
    reviewerAvatar: '',
    rating: 4,
    comment: 'Great communication and thoughtful design feedback.',
    createdAt: '2026-07-12T00:00:00Z',
    questTitle: 'Landing page review',
  },
];
