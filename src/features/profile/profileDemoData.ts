import type { ProfileCertificate, ProfileExperience, ProfileReview, ProfileStatsData, ProfileTag, ProfileWork } from './components/ProfileComponents';

const demoAvatar = require('../../../assets/images/profile/demo-avatar.svg');

export function isProfileDemoEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_PROFILE_DEMO === 'true';
}

export const demoProfileImage = demoAvatar;

export const demoProfileIdentity = {
  name: 'Siraphat THAPPHA',
  faculty: 'Engineering',
  occupation: 'Student',
  department: 'Software and Knowledge Engineering',
  about: 'A KU student building useful digital experiences, mentoring peers, and contributing to campus communities. I enjoy turning complex ideas into clear, accessible interfaces and collaborating with teams from concept to delivery. Outside coursework, I explore design systems, front-end engineering, and practical tools that make student life easier.',
};

export const demoProfileTags: ProfileTag[] = [
  { id: 'demo-technology', name: 'Technology', questCount: 2 },
  { id: 'demo-campus-life', name: 'Campus life', questCount: 2 },
  { id: 'demo-design-creative', name: 'Design & creative', questCount: 1 },
];

export const demoProfileStats: ProfileStatsData = {
  totalQuests: 68,
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
  { id: 'demo-certificate-accessibility', title: 'Accessible Web Foundations', issuer: 'W3C Training', issuedYear: '2024', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-figma', title: 'Figma Interface Design', issuer: 'Figma Academy', issuedYear: '2024', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-agile', title: 'Agile Project Management', issuer: 'Atlassian University', issuedYear: '2025', link: '', imageSource: demoCertificateImage },
  { id: 'demo-certificate-cloud', title: 'Cloud Computing Basics', issuer: 'Google Cloud Skills Boost', issuedYear: '2025', link: '', imageSource: demoCertificateImage },
];

export const demoWorks: ProfileWork[] = [
  { id: 'demo-work-portfolio', title: 'Student Quest Portfolio', detail: 'A responsive project showcase built for KU students.', imageUri: '', imageUris: [], imageSource: demoCertificateImage },
  { id: 'demo-work-dashboard', title: 'Campus Dashboard', detail: 'A dashboard for discovering useful campus services.', imageUri: '', imageUris: [], imageSource: demoCertificateImage },
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
  { id: 'demo-review-3', reviewerName: 'Krit S.', reviewerAvatar: '', rating: 5, comment: 'Reliable, punctual, and easy to work with.', createdAt: '2026-06-28T00:00:00Z', questTitle: 'Campus event setup' },
  { id: 'demo-review-4', reviewerName: 'Narin P.', reviewerAvatar: '', rating: 5, comment: 'Delivered excellent work and paid close attention to the details.', createdAt: '2026-06-15T00:00:00Z', questTitle: 'Student club website' },
  { id: 'demo-review-5', reviewerName: 'Ploy K.', reviewerAvatar: '', rating: 5, comment: 'Very helpful and explained every step clearly.', createdAt: '2026-06-03T00:00:00Z', questTitle: 'Programming tutoring' },
  { id: 'demo-review-6', reviewerName: 'Beam T.', reviewerAvatar: '', rating: 5, comment: 'Great communication from start to finish.', createdAt: '2026-05-24T00:00:00Z', questTitle: 'Faculty open house' },
  { id: 'demo-review-7', reviewerName: 'Fern L.', reviewerAvatar: '', rating: 5, comment: 'The final result was better than we expected.', createdAt: '2026-05-10T00:00:00Z', questTitle: 'Design system review' },
  { id: 'demo-review-8', reviewerName: 'Ton K.', reviewerAvatar: '', rating: 5, comment: 'Professional, friendly, and well prepared.', createdAt: '2026-04-29T00:00:00Z', questTitle: 'Workshop assistance' },
  { id: 'demo-review-9', reviewerName: 'Aom R.', reviewerAvatar: '', rating: 5, comment: 'Finished the task quickly with excellent quality.', createdAt: '2026-04-16T00:00:00Z', questTitle: 'Portfolio feedback' },
  { id: 'demo-review-10', reviewerName: 'Non P.', reviewerAvatar: '', rating: 5, comment: 'A thoughtful teammate who always follows through.', createdAt: '2026-04-02T00:00:00Z', questTitle: 'Student orientation' },
  { id: 'demo-review-11', reviewerName: 'Fah W.', reviewerAvatar: '', rating: 5, comment: 'Made a difficult task feel simple and manageable.', createdAt: '2026-03-18T00:00:00Z', questTitle: 'Research presentation' },
  { id: 'demo-review-12', reviewerName: 'Mew J.', reviewerAvatar: '', rating: 5, comment: 'Clear updates and a polished final delivery.', createdAt: '2026-03-05T00:00:00Z', questTitle: 'Mobile app prototype' },
  { id: 'demo-review-13', reviewerName: 'Mint S.', reviewerAvatar: '', rating: 5, comment: 'Kind, capable, and a pleasure to collaborate with.', createdAt: '2026-02-21T00:00:00Z', questTitle: 'Peer mentoring' },
  { id: 'demo-review-14', reviewerName: 'Game T.', reviewerAvatar: '', rating: 4, comment: 'Strong work overall and very responsive.', createdAt: '2026-02-08T00:00:00Z', questTitle: 'Event registration page' },
  { id: 'demo-review-15', reviewerName: 'Dao L.', reviewerAvatar: '', rating: 3, comment: 'The task was completed, with room for clearer progress updates.', createdAt: '2026-01-25T00:00:00Z', questTitle: 'Campus guide update' },
];
