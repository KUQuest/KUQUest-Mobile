const React = require("react");
const { jest } = require("@jest/globals");
const { View, Pressable, Text } = require("react-native");


// reanimated 4 / worklets 0.10's official jest mocks still hit native-module
// init code outside a real app runtime (upstream immaturity, both packages
// are brand new). Stub the minimal surface the generated template uses
// instead of pulling in react-native-reanimated/mock.
jest.mock("react-native-worklets", () => ({
  scheduleOnRN: (fn, ...args) => fn(...args),
  scheduleOnUI: (fn, ...args) => fn(...args),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View },
  Easing: { elastic: () => (t) => t },
  Keyframe: class Keyframe {
    constructor() {}
    duration() {
      return this;
    }
    withCallback() {
      return this;
    }
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  isSuccessResponse: (response) => response.type === 'success',
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: {
        idToken: 'mock_id_token',
        user: { email: 'student.test@ku.th', name: 'Test Student' },
      },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn(),
  },
}));

jest.mock('./src/features/auth/authClient', () => ({
  authClient: {
    getCookie: jest.fn().mockReturnValue(''),
    signIn: { social: jest.fn() },
    getSession: jest.fn().mockResolvedValue({ data: null, error: null }),
    signOut: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => {
      return store.get(key) || null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

jest.mock('@expo/ui', () => ({
  Host: ({ children, ...props }) => React.createElement(View, props, children),
  Switch: ({ value, onValueChange, testID, disabled, ...props }) => React.createElement(Pressable, { accessibilityRole: 'switch', accessibilityState: { checked: value, disabled }, onPress: () => onValueChange(!value), testID, disabled, ...props }),
  Button: ({ label, onPress, testID, disabled, accessibilityLabel, style, ...props }) =>
    React.createElement(
      Pressable,
      { onPress, testID, disabled, accessibilityLabel, style, ...props },
      React.createElement(Text, null, label)
    ),
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props) => React.createElement(View, props);

  return {
    Check: Icon,
    Bell: Icon,
    CheckSquare: Icon,
    BriefcaseBusiness: Icon,
    CalendarDays: Icon,
    CalendarClock: Icon,
    ArrowDownUp: Icon,
    AlertCircle: Icon,
    ChevronDown: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    ChevronUp: Icon,
    ArrowLeft: Icon,
    Clock3: Icon,
    CircleAlert: Icon,
    CircleUserRound: Icon,
    ClipboardCheck: Icon,
    CircleHelp: Icon,
    Mail: Icon,
    FileText: Icon,
    Globe2: Icon,
    LockKeyhole: Icon,
    Moon: Icon,
    CircleX: Icon,
    Grid2X2: Icon,
    Image: Icon,
    ImageIcon: Icon,
    ImagePlus: Icon,
    Info: Icon,
    LayoutDashboard: Icon,
    MapPin: Icon,
    MessageSquare: Icon,
    Pencil: Icon,
    Plus: Icon,
    Settings2: Icon,
    Star: Icon,
    RefreshCw: Icon,
    Search: Icon,
    SlidersHorizontal: Icon,
    Sparkles: Icon,
    Tag: Icon,
    TriangleAlert: Icon,
    Trash2: Icon,
    UserRound: Icon,
    UserRoundCheck: Icon,
    Users: Icon,
    UsersRound: Icon,
    X: Icon,
    GraduationCap: Icon,
    Award: Icon,
    Building2: Icon,
    Code2: Icon,
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: (props) => React.createElement(View, props),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
  SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
