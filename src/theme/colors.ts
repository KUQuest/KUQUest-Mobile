import { Appearance } from "react-native";

/**
 * Persona ramps. `getThemeColors` resolves the app-wide palette from the
 * active workspace and appearance; `AppThemeProvider` publishes it to React
 * and NativeWind consumers.
 */
export const hirerRamp = {
  light: {
    primary: "#755570",
    primaryDark: "#5D4058",
    primarySubtle: "#F3ECF2",
    accentBorder: "#A06B95",
    onPrimary: "#FFFFFF",
  },
  dark: {
    primary: "#D8B4D0",
    primaryDark: "#C49DBB",
    primarySubtle: "#30232E",
    accentBorder: "#8B6985",
    onPrimary: "#30232E",
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
  surfaceTerracotta: "#FAEEE7",
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
  onPrimary: hirerRamp.light.onPrimary,
  terracotta: "#9C5238",
  terracottaDark: "#7A3D2B",
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
  white: "#FFFFFF",
  overlay: "rgba(24, 32, 27, 0.4)",
} as const;

export const darkColors = {
  background: "#0F1411",
  surface: "#161C18",
  surfaceMuted: "#1D2520",
  surfaceSubtle: "#1D2520",
  surfaceAccent: hirerRamp.dark.primarySubtle,
  surfaceTerracotta: "#35251F",
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
  onPrimary: hirerRamp.dark.onPrimary,
  terracotta: "#E9AB8F",
  terracottaDark: "#F2C0AA",
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
  white: "#F7FFFE",
  overlay: "rgba(0, 0, 0, 0.64)",
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof lightColors]: string;
};
export type AppColorScheme =
  "dark" | "light" | "unspecified" | null | undefined;

export const ramps = { hirer: hirerRamp, worker: workerRamp } as const;
export type RampName = keyof typeof ramps;
type Ramp = (typeof ramps)[RampName]["light" | "dark"];

function withRamp(
  base: ThemeColors,
  ramp: Ramp,
  scheme: "light" | "dark"
): ThemeColors {
  return {
    ...base,
    primary: ramp.primary,
    primaryDark: ramp.primaryDark,
    primaryDeep: scheme === "dark" ? ramp.primary : ramp.primaryDark,
    surfaceAccent: ramp.primarySubtle,
    borderAccent: ramp.accentBorder,
    onPrimary: ramp.onPrimary,
  };
}

// Four fixed combinations, resolved once, so the proxy below never allocates.
const palettes = {
  hirer: {
    light: withRamp(lightColors, hirerRamp.light, "light"),
    dark: withRamp(darkColors, hirerRamp.dark, "dark"),
  },
  worker: {
    light: withRamp(lightColors, workerRamp.light, "light"),
    dark: withRamp(darkColors, workerRamp.dark, "dark"),
  },
} as const;

let activeRamp: RampName = "hirer";

/** Called by `AppThemeProvider`; keeps imperative `colors` consumers in step
 * with the current workspace ramp. */
export function setActiveRamp(name: RampName) {
  activeRamp = name;
}

export function getThemeColors(colorScheme: AppColorScheme) {
  return palettes[activeRamp][colorScheme === "dark" ? "dark" : "light"];
}

// Existing consumers can keep reading `colors.foo`; the proxy resolves the
// current native appearance without requiring every caller to add a hook.
export const colors = new Proxy(lightColors, {
  get(_target, property: keyof ThemeColors) {
    const palette = getThemeColors(Appearance.getColorScheme());
    return palette[property];
  },
}) as ThemeColors;
