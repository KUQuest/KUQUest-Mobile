import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AppearancePreference = "light" | "dark";

export const DEFAULT_APPEARANCE: AppearancePreference = "light";
export const APPEARANCE_STORAGE_KEY = "kuquest_appearance";

function isSupportedAppearance(
  value: string | null
): value is AppearancePreference {
  return value === "light" || value === "dark";
}

interface AppearanceContextValue {
  appearance: AppearancePreference;
  setAppearance: (appearance: AppearancePreference) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => undefined,
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] =
    useState<AppearancePreference>(DEFAULT_APPEARANCE);
  const hasManualSelection = useRef(false);

  useEffect(() => {
    Appearance.setColorScheme(DEFAULT_APPEARANCE);

    let mounted = true;
    void SecureStore.getItemAsync(APPEARANCE_STORAGE_KEY)
      .then((storedAppearance) => {
        if (
          mounted &&
          !hasManualSelection.current &&
          isSupportedAppearance(storedAppearance)
        ) {
          setAppearanceState(storedAppearance);
          Appearance.setColorScheme(storedAppearance);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const setAppearance = useCallback((nextAppearance: AppearancePreference) => {
    hasManualSelection.current = true;
    setAppearanceState(nextAppearance);
    Appearance.setColorScheme(nextAppearance);
    void SecureStore.setItemAsync(APPEARANCE_STORAGE_KEY, nextAppearance).catch(
      () => undefined
    );
  }, []);

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  return useContext(AppearanceContext);
}
