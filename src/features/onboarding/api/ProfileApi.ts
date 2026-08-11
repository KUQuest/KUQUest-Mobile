export interface Certificate {
  link: string;
  detail: string;
}

export interface Experience {
  jobTitle: string;
  startDate: string;
  endDate: string;
  detail: string;
}

export interface Work {
  imageUri: string;
  title: string;
  detail: string;
}

export interface ProfileDraft {
  name: string;
  telephone: string;
  occupation: string;
  studentId: string;
  faculty: string;
  department: string;
  acceptedTerms: boolean;
  description: string;
  profileImage: string;
  certificates: Certificate[];
  experiences: Experience[];
  works: Work[];
}

const emptyProfile: ProfileDraft = {
  name: '',
  telephone: '',
  occupation: '',
  studentId: '',
  faculty: '',
  department: '',
  acceptedTerms: false,
  description: '',
  profileImage: '',
  certificates: [],
  experiences: [],
  works: [],
};

export const ProfileApi = {
  getProfile: async (): Promise<ProfileDraft> => {
    // Mock get profile
    return Promise.resolve({
      ...emptyProfile,
      certificates: [],
      experiences: [],
      works: [],
    });
  },
  saveOnboardingProfile: async (data: ProfileDraft): Promise<void> => {
    // Mock save
    return Promise.resolve();
  },
  updateProfile: async (data: ProfileDraft): Promise<void> => {
    // Mock update
    return Promise.resolve();
  }
};
