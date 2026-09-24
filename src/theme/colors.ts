import { Appearance } from "react-native";

/**
 * Organic Editorial brand ramps. `getThemeColors` resolves the app-wide palette
 * from the active workspace and appearance; `AppThemeProvider` publishes it
 * to React and NativeWind consumers.
 */
export const hirerRamp = {
  light: {
    primary: "#5F7655",
    primaryDark: "#465B3E",
    primarySubtle: "#EDF2EA",
    accentBorder: "#B6C4AF",
    onPrimary: "#FFFFFF",
  },
  dark: {
    primary: "#A9C79E",
    primaryDark: "#7FA273",
    primarySubtle: "#243128",
    accentBorder: "#526B58",
    onPrimary: "#142019",
  },
} as const;

export const workerRamp = {
  light: {
    primary: "#96533F",
    primaryDark: "#713D30",
    primarySubtle: "#F8ECE8",
    accentBorder: "#C9A79A",
    onPrimary: "#FFFFFF",
  },
  dark: {
    primary: "#E1A08C",
    primaryDark: "#C77B65",
    primarySubtle: "#3B2924",
    accentBorder: "#805044",
    onPrimary: "#241A17",
  },
} as const;

export const lightColors = {
  // Brand
  primary: "#5F7655",
  primaryDark: "#465B3E",
  primaryDeep: "#34462F",
  primarySubtle: "#EDF2EA",
  primaryBorder: "#B6C4AF",
  onPrimary: "#FFFFFF",

  support: "#755570",
  supportDark: "#5D4058",
  supportDeep: "#463143",
  supportSubtle: "#F3ECF2",
  supportBorder: "#B79AAF",
  onSupport: "#FFFFFF",

  // Role colors
  hirer: "#5F7655",
  hirerDark: "#465B3E",
  hirerDeep: "#34462F",
  hirerSubtle: "#EDF2EA",
  hirerBorder: "#B6C4AF",
  onHirer: "#FFFFFF",

  worker: "#96533F",
  workerDark: "#713D30",
  workerDeep: "#4F2A22",
  workerSubtle: "#F8ECE8",
  workerBorder: "#C9A79A",
  onWorker: "#FFFFFF",

  additional: "#7C4BA8",
  additionalDark: "#623784",
  additionalDeep: "#412357",
  additionalSubtle: "#F1EBF8",
  additionalBorder: "#C2AED7",
  onAdditional: "#FFFFFF",

  // Neutral
  background: "#F7F9F8",
  surface: "#FFFFFF",
  surfaceRaised: "#F0F3F1",
  surfaceHigh: "#E7ECE8",
  textStrong: "#18201B",
  text: "#273029",
  textSecondary: "#5F6962",
  textMuted: "#737D76",
  border: "#D5DDD7",
  divider: "#DDE3DF",

  // Supporting accents
  cream: "#F6EFE6",
  gold: "#C8953D",
  terracotta: "#9C634D",
  rose: "#C88C9B",

  // Semantic
  success: "#21864F",
  warning: "#B7791F",
  danger: "#C13D43",
  info: "#356CA5",

  // Compatibility aliases
  surfaceMuted: "#F0F3F1",
  surfaceSubtle: "#F0F3F1",
  surfaceAccent: "#EDF2EA",
  surfaceTerracotta: "#FAEEE7",
  terracottaDark: "#7A3D2B",
  surfaceSuccess: "#E2EEE7",
  surfaceDanger: "#F2E6E6",
  surfaceImage: "#DEEAE9",
  surfacePlaceholder: "#DDE3DF",
  surfaceNavTranslucent: "rgba(255, 255, 255, 0.92)",
  borderNav: "rgba(24, 32, 27, 0.14)",
  navIconMuted: "#89928C",
  textSubtle: "#737D76",
  textFaint: "#737D76",
  borderSubtle: "#D5DDD7",
  borderMuted: "#D5DDD7",
  borderAccent: "#B6C4AF",
  borderDanger: "#E6BDBE",
  borderSuccess: "#B3D4C2",
  dangerDark: "#8B2C30",
  dangerLight: "#E6BDBE",
  dangerIcon: "#C13D43",
  successBright: "#21864F",
  successLight: "#B3D4C2",
  warningDark: "#845716",
  surfaceWarning: "#F1ECE2",
  borderWarning: "#E3D0B3",
  disabled: "#C8CECA",
  black: "#18201B",
  white: "#FFFFFF",
  card: "#FFFFFF",
  overlay: "rgba(24, 32, 27, 0.4)",
} as const;

export const darkColors = {
  // Brand
  primary: "#A9C79E",
  primaryDark: "#7FA273",
  primaryDeep: "#5F7655",
  primarySubtle: "#243128",
  primaryBorder: "#526B58",
  onPrimary: "#142019",

  support: "#D8B4D0",
  supportDark: "#BE91B5",
  supportDeep: "#966B8F",
  supportSubtle: "#342832",
  supportBorder: "#72556D",
  onSupport: "#21171F",

  // Role colors
  hirer: "#A9C79E",
  hirerDark: "#7FA273",
  hirerDeep: "#5F7655",
  hirerSubtle: "#243128",
  hirerBorder: "#526B58",
  onHirer: "#142019",

  worker: "#E1A08C",
  workerDark: "#C77B65",
  workerDeep: "#A75D4B",
  workerSubtle: "#3B2924",
  workerBorder: "#805044",
  onWorker: "#241A17",

  additional: "#C7A3EA",
  additionalDark: "#A77ACF",
  additionalDeep: "#8759B0",
  additionalSubtle: "#302541",
  additionalBorder: "#735896",
  onAdditional: "#241B2B",

  // Neutral
  background: "#101713",
  surface: "#172019",
  surfaceRaised: "#1E2A22",
  surfaceHigh: "#27342B",
  textStrong: "#F2F5F2",
  text: "#E3E9E4",
  textSecondary: "#B4BDB6",
  textMuted: "#919C94",
  border: "#3A4940",
  divider: "#334039",

  // Supporting accents
  cream: "#302B24",
  gold: "#E3BB70",
  terracotta: "#DA9A80",
  rose: "#DBA7B4",

  // Semantic
  success: "#62C88B",
  warning: "#E4B45A",
  danger: "#EF777B",
  info: "#75A8DA",

  // Compatibility aliases
  surfaceMuted: "#1E2A22",
  surfaceSubtle: "#1E2A22",
  surfaceAccent: "#243128",
  surfaceTerracotta: "#35251F",
  terracottaDark: "#F2C0AA",
  surfaceSuccess: "#172E21",
  surfaceDanger: "#33211F",
  surfaceImage: "#142B27",
  surfacePlaceholder: "#303B34",
  surfaceNavTranslucent: "rgba(22, 28, 24, 0.94)",
  borderNav: "rgba(243, 246, 244, 0.16)",
  navIconMuted: "#7D8881",
  textSubtle: "#919C94",
  textFaint: "#919C94",
  borderSubtle: "#3A4940",
  borderMuted: "#3A4940",
  borderAccent: "#526B58",
  borderDanger: "#5B2F2F",
  borderSuccess: "#204C32",
  dangerDark: "#F4999C",
  dangerLight: "#5B2F2F",
  dangerIcon: "#EF6469",
  successBright: "#62C88B",
  successLight: "#204C32",
  warningDark: "#EDC67E",
  surfaceWarning: "#312C18",
  borderWarning: "#57461F",
  disabled: "#58615B",
  black: "#0F1411",
  white: "#F7FFFE",
  card: "#172019",
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

export function getThemeColors(colorScheme: AppColorScheme): ThemeColors {
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
