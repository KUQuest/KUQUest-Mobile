import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { create } from "zustand";

const SCROLL_DIRECTION_THRESHOLD = 8;

type NavigationScrollHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>
) => void;

interface NavigationUiState {
  navigationVisible: boolean;
  navigationCompact: boolean;
}

export const useNavigationUiStore = create<NavigationUiState>(() => ({
  navigationVisible: true,
  navigationCompact: false,
}));

let lastScrollOffset: number | null = null;
let accumulatedScrollDelta = 0;

function updateNavigationState(
  navigationVisible: boolean,
  navigationCompact: boolean
): void {
  const currentState = useNavigationUiStore.getState();
  if (
    currentState.navigationVisible !== navigationVisible ||
    currentState.navigationCompact !== navigationCompact
  ) {
    useNavigationUiStore.setState({ navigationVisible, navigationCompact });
  }
}

export const handleNavigationScroll: NavigationScrollHandler = (event) => {
  const offset = Math.max(event.nativeEvent.contentOffset.y, 0);

  if (offset === 0) {
    lastScrollOffset = 0;
    accumulatedScrollDelta = 0;
    updateNavigationState(true, false);
    return;
  }

  const previousOffset = lastScrollOffset;
  lastScrollOffset = offset;
  if (previousOffset === null) return;

  const delta = offset - previousOffset;
  if (Math.abs(delta) < 1) return;

  const sameDirection =
    accumulatedScrollDelta === 0 ||
    Math.sign(accumulatedScrollDelta) === Math.sign(delta);
  accumulatedScrollDelta = sameDirection
    ? accumulatedScrollDelta + delta
    : delta;

  if (accumulatedScrollDelta >= SCROLL_DIRECTION_THRESHOLD) {
    updateNavigationState(false, true);
    accumulatedScrollDelta = 0;
  } else if (accumulatedScrollDelta <= -SCROLL_DIRECTION_THRESHOLD) {
    updateNavigationState(true, false);
    accumulatedScrollDelta = 0;
  }
};

export const showNavigation = (): void => {
  lastScrollOffset = null;
  accumulatedScrollDelta = 0;
  updateNavigationState(true, false);
};

export function resetNavigationVisibility(): void {
  lastScrollOffset = null;
  accumulatedScrollDelta = 0;
  updateNavigationState(true, false);
}

export function useNavigationVisible(): boolean {
  return useNavigationUiStore((state) => state.navigationVisible);
}
export function useNavigationCompact(): boolean {
  return useNavigationUiStore((state) => state.navigationCompact);
}

export function useNavigationVisibility() {
  const navigationVisible = useNavigationVisible();
  return {
    navigationVisible,
    handleScroll: handleNavigationScroll,
    showNavigation,
  };
}
