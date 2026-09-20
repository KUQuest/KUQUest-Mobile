import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, ScrollView, Text } from "react-native";

import {
  handleNavigationScroll,
  resetNavigationVisibility,
  showNavigation,
  useNavigationCompact,
  useNavigationVisible,
} from "@/features/navigation/navigationUiStore";

function NavigationVisibilityProbe() {
  const navigationVisible = useNavigationVisible();
  const navigationCompact = useNavigationCompact();
  return (
    <>
      <Text testID="visibility">
        {navigationVisible ? "visible" : "hidden"}
      </Text>
      <Text testID="compact">{navigationCompact ? "compact" : "expanded"}</Text>
      <ScrollView testID="scroll" onScroll={handleNavigationScroll} />
      <Pressable testID="show" onPress={showNavigation} />
    </>
  );
}

describe("navigationUiStore", () => {
  beforeEach(() => {
    resetNavigationVisibility();
  });

  it("compacts after downward movement and expands after upward movement", async () => {
    const view = await render(<NavigationVisibilityProbe />);
    const scrollView = view.getByTestId("scroll");

    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 10 } },
    });
    expect(view.getByTestId("visibility").props.children).toBe("hidden");
    expect(view.getByTestId("compact").props.children).toBe("compact");

    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    expect(view.getByTestId("visibility").props.children).toBe("visible");
    expect(view.getByTestId("compact").props.children).toBe("expanded");
  });

  it("shows and expands immediately when requested", async () => {
    const view = await render(<NavigationVisibilityProbe />);
    const scrollView = view.getByTestId("scroll");

    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 10 } },
    });
    await fireEvent.press(view.getByTestId("show"));

    expect(view.getByTestId("visibility").props.children).toBe("visible");
    expect(view.getByTestId("compact").props.children).toBe("expanded");
  });
});
