import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const SCROLL_DIRECTION_THRESHOLD = 8;

type NavigationScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

type NavigationVisibilityContextValue = {
  navigationVisible: boolean;
  handleScroll: NavigationScrollHandler;
  showNavigation: () => void;
};

const defaultNavigationVisibility: NavigationVisibilityContextValue = {
  navigationVisible: true,
  handleScroll: () => undefined,
  showNavigation: () => undefined,
};

const NavigationVisibilityContext = createContext<NavigationVisibilityContextValue>(defaultNavigationVisibility);

export function NavigationVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [navigationVisible, setNavigationVisible] = useState(true);
  const lastScrollOffset = useRef<number | null>(null);
  const accumulatedScrollDelta = useRef(0);

  const updateVisibility = useCallback((visible: boolean) => {
    setNavigationVisible((current) => current === visible ? current : visible);
  }, []);

  const handleScroll = useCallback<NavigationScrollHandler>((event) => {
    const offset = Math.max(event.nativeEvent.contentOffset.y, 0);

    if (offset === 0) {
      lastScrollOffset.current = 0;
      accumulatedScrollDelta.current = 0;
      updateVisibility(true);
      return;
    }

    const previousOffset = lastScrollOffset.current;
    lastScrollOffset.current = offset;
    if (previousOffset === null) return;

    const delta = offset - previousOffset;
    if (Math.abs(delta) < 1) return;

    const sameDirection = accumulatedScrollDelta.current === 0
      || Math.sign(accumulatedScrollDelta.current) === Math.sign(delta);
    accumulatedScrollDelta.current = sameDirection
      ? accumulatedScrollDelta.current + delta
      : delta;

    if (accumulatedScrollDelta.current >= SCROLL_DIRECTION_THRESHOLD) {
      updateVisibility(false);
      accumulatedScrollDelta.current = 0;
    } else if (accumulatedScrollDelta.current <= -SCROLL_DIRECTION_THRESHOLD) {
      updateVisibility(true);
      accumulatedScrollDelta.current = 0;
    }
  }, [updateVisibility]);

  const showNavigation = useCallback(() => {
    lastScrollOffset.current = null;
    accumulatedScrollDelta.current = 0;
    updateVisibility(true);
  }, [updateVisibility]);

  return (
    <NavigationVisibilityContext.Provider value={{ navigationVisible, handleScroll, showNavigation }}>
      {children}
    </NavigationVisibilityContext.Provider>
  );
}

export function useNavigationVisibility(): NavigationVisibilityContextValue {
  return useContext(NavigationVisibilityContext);
}
