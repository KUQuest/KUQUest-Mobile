import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import mockReact from 'react';
import { BackHandler } from 'react-native';

import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import { authService } from '../features/auth/AuthService';

jest.mock('../features/auth/AuthService', () => ({
  authService: {
    getSession: jest.fn(),
    getStudentApi: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock('react-native/Libraries/Modal/Modal', () => {
  return {
    __esModule: true,
    default: ({ visible, children }: { visible: boolean; children: mockReact.ReactNode }) =>
      visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: () => null,
}));

const mockedAuthService = authService as unknown as {
  getSession: jest.Mock;
  getStudentApi: jest.Mock;
  signOut: jest.Mock;
};
let mockRouteParams: { mode?: string; step?: string } = {};

const options = {
  occupations: [{ id: 'occupation-student', name: 'Student', requiresStudentId: true }],
  faculties: [
    {
      id: 'faculty-engineering',
      name: 'Faculty of Engineering',
      departments: [{ id: 'department-software', name: 'Software Engineering' }],
    },
    {
      id: 'faculty-science',
      name: 'Faculty of Science',
      departments: [{ id: 'department-mathematics', name: 'Mathematics' }],
    },
  ],
};

function createApi(overrides: Record<string, unknown> = {}) {
  return {
    getAcademicRegistrationOptions: jest.fn().mockResolvedValue(options),
    getAcademicRegistrationStatus: jest.fn().mockResolvedValue({
      firstName: '',
      lastName: '',
      telephone: null,
      occupationId: null,
      studentId: null,
      departmentId: null,
      termsAcceptedAt: null,
      termsVersion: null,
      completed: false,
    }),
    getProfile: jest.fn().mockResolvedValue({
      email: 'student@ku.th',
      firstName: '',
      lastName: '',
      bio: null,
      telephone: null,
      studentId: null,
      academicYear: null,
      department: null,
      avatar: null,
    }),
    listCertificates: jest.fn().mockResolvedValue([]),
    listPortfolio: jest.fn().mockResolvedValue([]),
    listExperience: jest.fn().mockResolvedValue([]),
    updateAcademicRegistration: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
    updateExperience: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
function createCompletedApi(overrides: Record<string, unknown> = {}) {
  return createApi({
    getAcademicRegistrationStatus: jest.fn().mockResolvedValue({
      firstName: 'KU',
      lastName: 'Student',
      telephone: '0812345678',
      occupationId: 'occupation-student',
      studentId: '6712345678',
      departmentId: 'department-software',
      termsAcceptedAt: '2026-08-11T00:00:00.000Z',
      termsVersion: '2026-08-11',
      completed: true,
    }),
    getProfile: jest.fn().mockResolvedValue({
      email: 'student@ku.th',
      firstName: 'KU',
      lastName: 'Student',
      bio: null,
      telephone: '0812345678',
      studentId: '6712345678',
      academicYear: 3,
      department: {
        id: 'department-software',
        name: 'Software Engineering',
        faculty: { name: 'Faculty of Engineering' },
      },
      avatar: null,
    }),
    ...overrides,
  });
}


function prepareAuth(api: ReturnType<typeof createApi>) {
  mockedAuthService.getSession.mockResolvedValue({
    user: { image: null },
  });
  mockedAuthService.getStudentApi.mockResolvedValue(api);
}

describe('OnboardingScreen Academic Registration selections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    process.env.EXPO_PUBLIC_TERMS_VERSION = '2026-08-11';
  });

  test('keeps Department disabled until Faculty is selected and clears it when Faculty changes', async () => {
    const api = createApi();
    prepareAuth(api);
    await render(<OnboardingScreen />);

    await waitFor(() => expect(screen.getAllByTestId('select-trigger')).toHaveLength(3));
    const triggers = () => screen.getAllByTestId('select-trigger');
    expect(triggers()[2].props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(triggers()[1]);
    await fireEvent.press(screen.getByText('Faculty of Engineering'));
    expect(triggers()[2].props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(triggers()[2]);
    await fireEvent.press(screen.getByText('Software Engineering'));
    expect(triggers()[2].props.accessibilityLabel).toBe('Software Engineering');

    await fireEvent.press(triggers()[1]);
    await fireEvent.press(screen.getByText('Faculty of Science'));

    expect(triggers()[2].props.accessibilityLabel).toBe('Enter your Department');
    expect(triggers()[2].props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(triggers()[2]);
    expect(screen.getByText('Mathematics')).toBeTruthy();
    expect(screen.queryByText('Software Engineering')).toBeNull();
  });

  test('submits canonical Occupation and Department IDs', async () => {
    const api = createApi({
      getAcademicRegistrationStatus: jest.fn().mockResolvedValue({
        firstName: 'KU',
        lastName: 'Student',
        telephone: '0812345678',
        occupationId: 'occupation-student',
        studentId: '6712345678',
        departmentId: 'department-software',
        termsAcceptedAt: '2026-08-11T00:00:00.000Z',
        termsVersion: '2026-08-11',
        completed: false,
      }),
      getProfile: jest.fn().mockResolvedValue({
        email: 'student@ku.th',
        firstName: 'KU',
        lastName: 'Student',
        bio: null,
        telephone: '0812345678',
        studentId: '6712345678',
        academicYear: null,
        department: {
          id: 'department-software',
          name: 'Software Engineering',
          faculty: { name: 'Faculty of Engineering' },
        },
        avatar: null,
      }),
    });
    prepareAuth(api);
    await render(<OnboardingScreen />);

    await waitFor(() => expect(screen.getByText('Faculty of Engineering')).toBeTruthy());
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Complete'));

    await waitFor(() => {
      expect(api.updateAcademicRegistration).toHaveBeenCalledWith(expect.objectContaining({
        occupationId: 'occupation-student',
        departmentId: 'department-software',
      }));
    });
  });

  test('edits an existing Experience without repeating Academic Registration writes', async () => {
    mockRouteParams = { mode: 'edit' };
    const api = createApi({
      getAcademicRegistrationStatus: jest.fn().mockResolvedValue({
        firstName: 'KU', lastName: 'Student', telephone: '0812345678', occupationId: 'occupation-student', studentId: '6712345678', departmentId: 'department-software', termsAcceptedAt: '2026-08-11T00:00:00.000Z', termsVersion: '2026-08-11', completed: true,
      }),
      getProfile: jest.fn().mockResolvedValue({
        email: 'student@ku.th', firstName: 'KU', lastName: 'Student', bio: null, telephone: '0812345678', studentId: '6712345678', academicYear: 3, department: { id: 'department-software', name: 'Software Engineering', faculty: { name: 'Faculty of Engineering' } }, avatar: null,
      }),
      listExperience: jest.fn().mockResolvedValue([{ id: 'experience-id', title: 'Tutor', employmentType: 'Part-time', organization: 'KU', description: 'Helps students', startedAt: '2024-01-01', endedAt: null }]),
      updateExperience: jest.fn().mockResolvedValue(undefined),
    });
    prepareAuth(api);
    await render(<OnboardingScreen />);

    await waitFor(() => expect(screen.getByText('Faculty of Engineering')).toBeTruthy());
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.changeText(screen.getByLabelText('Job title'), 'Lead Tutor');
    await fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() => expect(api.updateExperience).toHaveBeenCalledWith('experience-id', expect.objectContaining({ title: 'Lead Tutor' })));
    expect(api.updateAcademicRegistration).not.toHaveBeenCalled();
  });
  test('clears field and dependent validation errors as values change', async () => {
    const api = createApi();
    prepareAuth(api);
    await render(<OnboardingScreen />);

    await waitFor(() => expect(screen.getAllByTestId('select-trigger')).toHaveLength(3));
    await fireEvent.press(screen.getByText('Next'));

    const requiredErrorCount = screen.getAllByText('This field is required').length;
    await fireEvent.changeText(screen.getByLabelText('Telephone'), '0812345678');
    expect(screen.getAllByText('This field is required')).toHaveLength(requiredErrorCount - 1);

    await fireEvent.press(screen.getAllByTestId('select-trigger')[1]);
    await fireEvent.press(screen.getByText('Faculty of Engineering'));
    expect(screen.getAllByText('This field is required')).toHaveLength(requiredErrorCount - 3);
  });

  test('walks backward through onboarding steps on Android Back', async () => {
    mockRouteParams = { step: '3' };
    const api = createApi();
    prepareAuth(api);
    const addEventListener = jest.spyOn(BackHandler, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }) as never);

    await render(<OnboardingScreen />);
    await waitFor(() => expect(screen.getByText('Step 3 of 3')).toBeTruthy());

    const getBackHandler = () => {
      const lastCall = addEventListener.mock.calls[addEventListener.mock.calls.length - 1];
      return lastCall[1] as () => boolean;
    };
    let backHandler = getBackHandler();
    let handled = false;
    await act(() => {
      handled = backHandler();
    });
    expect(handled).toBe(true);
    await waitFor(() => expect(screen.getByText('Step 2 of 3')).toBeTruthy());
    backHandler = getBackHandler();
    handled = false;
    await act(() => {
      handled = backHandler();
    });
    expect(handled).toBe(true);
    await waitFor(() => expect(screen.getByText('Step 1 of 3')).toBeTruthy());

    addEventListener.mockRestore();
  });

  test('removes the final optional item to an empty section and localizes picker close actions', async () => {
    mockRouteParams = { step: '3' };
    const api = createApi();
    prepareAuth(api);
    await render(<OnboardingScreen />);
    await waitFor(() => expect(screen.getByText('Step 3 of 3')).toBeTruthy());

    await fireEvent.press(screen.getByText('+ Add more certificate'));
    expect(screen.getByLabelText('Remove certificate 1')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Remove certificate 1'));
    expect(screen.queryByLabelText('Remove certificate 1')).toBeNull();
    expect(screen.getAllByText('Nothing added yet — you can add this later.')).toHaveLength(3);

    await fireEvent.press(screen.getByText('+ Add more experience'));
    await fireEvent.press(screen.getByTestId('select-trigger'));
    expect(screen.getByTestId('close-select-button').props.accessibilityLabel).toBe('Close');
  });

  test('exposes semantic footer buttons and localized saving feedback', async () => {
    let resolveSave: () => void = () => undefined;
    const pendingSave = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const api = createCompletedApi({
      updateAcademicRegistration: jest.fn().mockReturnValue(pendingSave),
    });
    prepareAuth(api);
    mockRouteParams = { step: '3' };
    await render(<OnboardingScreen />);
    await waitFor(() => expect(screen.getByText('Step 3 of 3')).toBeTruthy());

    expect(screen.getByRole('button', { name: 'Complete' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Complete' }));
    await waitFor(() => expect(screen.getByText('Saving your registration')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Saving...' }).props.accessibilityState.disabled).toBe(true);

    resolveSave();
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalled());
  });
});
