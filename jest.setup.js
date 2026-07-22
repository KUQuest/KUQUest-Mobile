const { jest } = require("@jest/globals");
const { View } = require("react-native");

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
