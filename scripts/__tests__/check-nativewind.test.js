const path = require("path");

const {
  auditNativeWind,
  findNativeClassNameViolations,
} = require("../check-nativewind");

describe("NativeWind audit", () => {
  test("the source tree keeps styled primitives on the @/tw path", () => {
    expect(
      auditNativeWind({ rootDir: path.resolve(__dirname, "../..") })
    ).toEqual([]);
  });

  test("detects className on a raw react-native component", () => {
    const violations = findNativeClassNameViolations(
      `import { View } from "react-native";\nexport function Example() { return <View className="p-ku-md" />; }`,
      "fixture.tsx"
    );

    expect(violations).toEqual([
      expect.objectContaining({ line: 2, tag: "View" }),
    ]);
  });

  test("detects className on wrapped-library components too", () => {
    const violations = findNativeClassNameViolations(
      `import Animated from "react-native-reanimated";\nexport function Example() { return <Animated.View className="p-ku-md" />; }`,
      "fixture.tsx"
    );

    expect(violations).toEqual([
      expect.objectContaining({ line: 2, tag: "Animated" }),
    ]);
  });
});
