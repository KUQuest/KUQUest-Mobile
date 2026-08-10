export const ProfileApi = {
  getProfile: async (): Promise<any> => {
    // Mock get profile
    return Promise.resolve({
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
    });
  },
  saveOnboardingProfile: async (data: any): Promise<void> => {
    // Mock save
    console.log('Saved onboarding profile', data);
    return Promise.resolve();
  },
  updateProfile: async (data: any): Promise<void> => {
    // Mock update
    console.log('Updated profile', data);
    return Promise.resolve();
  }
};
