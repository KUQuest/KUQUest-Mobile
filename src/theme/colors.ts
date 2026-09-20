import { Appearance } from "react-native";

/**
 * Persona ramps. `hirer` is what the app-wide `primary` tokens resolve to today;
 * `worker` is defined so the worker workspace can adopt it without inventing values.
 */
export const hirerRamp = {
  light: {
    primary: "#006664",
    primaryDark: "#004D4B",
    primarySubtle: "#E5F1F0",
    accentBorder: "#B9D5D2",
    onPrimary: "#FFFFFF",
  },
  dark: {
    primary: "#2FA39B",
    primaryDark: "#25847E",
    primarySubtle: "#153B39",
    accentBorder: "#2E5753",
    onPrimary: "#F7FFFE",
  },
} as const;

export const workerRamp = {
  light: {
    primary: "#B2BB1E",
    primaryDark: "#7D8615",
    primarySubtle: "#F4F5DF",
    accentBorder: "#D9DDA5",
    onPrimary: "#1B2106",
  },
  dark: {
    primary: "#C8D34A",
    primaryDark: "#A7B12F",
    primarySubtle: "#343817",
    accentBorder: "#555B27",
    onPrimary: "#171A05",
  },
} as const;

export const lightColors = {
  background: "#F7F9F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F3F1",
  surfaceSubtle: "#F0F3F1",
  surfaceAccent: hirerRamp.light.primarySubtle,
  surfaceSuccess: "#E2EEE7",
  surfaceDanger: "#F2E6E6",
  surfaceImage: "#DEEAE9",
  surfacePlaceholder: "#DDE3DF",
  surfaceNavTranslucent: "rgba(255, 255, 255, 0.92)",
  borderNav: "rgba(24, 32, 27, 0.14)",
  navIconMuted: "#89928C",
  primary: hirerRamp.light.primary,
  primaryDark: hirerRamp.light.primaryDark,
  primaryDeep: hirerRamp.light.primaryDark,
  hirerPrimary: hirerRamp.light.primary,
  hirerPrimaryDark: hirerRamp.light.primaryDark,
  hirerPrimarySubtle: hirerRamp.light.primarySubtle,
  hirerAccentBorder: hirerRamp.light.accentBorder,
  hirerOnPrimary: hirerRamp.light.onPrimary,
  workerPrimary: workerRamp.light.primary,
  workerPrimaryDark: workerRamp.light.primaryDark,
  workerPrimarySubtle: workerRamp.light.primarySubtle,
  workerAccentBorder: workerRamp.light.accentBorder,
  workerOnPrimary: workerRamp.light.onPrimary,
  text: "#18201B",
  textStrong: "#18201B",
  textSecondary: "#5F6962",
  textMuted: "#5F6962",
  textSubtle: "#89928C",
  textFaint: "#89928C",
  border: "#DDE3DF",
  borderSubtle: "#DDE3DF",
  borderMuted: "#DDE3DF",
  borderAccent: hirerRamp.light.accentBorder,
  borderDanger: "#E6BDBE",
  borderSuccess: "#B3D4C2",
  danger: "#C13D43",
  dangerDark: "#8B2C30",
  dangerLight: "#E6BDBE",
  dangerIcon: "#C13D43",
  success: "#21864F",
  successBright: "#21864F",
  successLight: "#B3D4C2",
  warning: "#B7791F",
  warningDark: "#845716",
  surfaceWarning: "#F1ECE2",
  borderWarning: "#E3D0B3",
  info: "#356CA5",
  disabled: "#C8CECA",
  black: "#18201B",
  white: hirerRamp.light.onPrimary,
  overlay: "rgba(24, 32, 27, 0.4)",
} as const;

export const darkColors = {
  background: "#0F1411",
  surface: "#161C18",
  surfaceMuted: "#1D2520",
  surfaceSubtle: "#1D2520",
  surfaceAccent: hirerRamp.dark.primarySubtle,
  surfaceSuccess: "#172E21",
  surfaceDanger: "#33211F",
  surfaceImage: "#142B27",
  surfacePlaceholder: "#303B34",
  surfaceNavTranslucent: "rgba(22, 28, 24, 0.94)",
  borderNav: "rgba(243, 246, 244, 0.16)",
  navIconMuted: "#7D8881",
  primary: hirerRamp.dark.primary,
  primaryDark: hirerRamp.dark.primaryDark,
  primaryDeep: hirerRamp.dark.primary,
  hirerPrimary: hirerRamp.dark.primary,
  hirerPrimaryDark: hirerRamp.dark.primaryDark,
  hirerPrimarySubtle: hirerRamp.dark.primarySubtle,
  hirerAccentBorder: hirerRamp.dark.accentBorder,
  hirerOnPrimary: hirerRamp.dark.onPrimary,
  workerPrimary: workerRamp.dark.primary,
  workerPrimaryDark: workerRamp.dark.primaryDark,
  workerPrimarySubtle: workerRamp.dark.primarySubtle,
  workerAccentBorder: workerRamp.dark.accentBorder,
  workerOnPrimary: workerRamp.dark.onPrimary,
  text: "#F3F6F4",
  textStrong: "#F3F6F4",
  textSecondary: "#AAB4AD",
  textMuted: "#AAB4AD",
  textSubtle: "#7D8881",
  textFaint: "#7D8881",
  border: "#303B34",
  borderSubtle: "#303B34",
  borderMuted: "#303B34",
  borderAccent: hirerRamp.dark.accentBorder,
  borderDanger: "#5B2F2F",
  borderSuccess: "#204C32",
  danger: "#EF6469",
  dangerDark: "#F4999C",
  dangerLight: "#5B2F2F",
  dangerIcon: "#EF6469",
  success: "#42B873",
  successBright: "#42B873",
  successLight: "#204C32",
  warning: "#E4A83B",
  warningDark: "#EDC67E",
  surfaceWarning: "#312C18",
  borderWarning: "#57461F",
  info: "#659AD0",
  disabled: "#58615B",
  black: "#0F1411",
  white: hirerRamp.dark.onPrimary,
  overlay: "rgba(0, 0, 0, 0.64)",
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;
export type AppColorScheme =
  "dark" | "light" | "unspecified" | null | undefined;

export function getThemeColors(colorScheme: AppColorScheme) {
  return colorScheme === "dark" ? darkColors : lightColors;
}

// Existing consumers can keep reading `colors.foo`; the proxy resolves the
// current native appearance without requiring every caller to add a hook.
export const colors = new Proxy(lightColors, {
  get(_target, property: keyof ThemeColors) {
    const palette = getThemeColors(Appearance.getColorScheme());
    return palette[property];
  },
}) as ThemeColors;
