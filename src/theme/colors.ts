import { Appearance } from "react-native";

export const lightColors = {
  background: "#FFFCFA",
  surface: "#FCF9F8",
  surfaceMuted: "#F5F2F0",
  surfaceSubtle: "#F9F9F9",
  surfaceAccent: "#F0F4F1",
  surfaceSuccess: "#EAF6ED",
  surfaceDanger: "#FDECEF",
  surfaceImage: "#DDE9D9",
  surfacePlaceholder: "#E8E8E8",
  surfaceNavTranslucent: "rgba(252, 249, 248, 0.92)",
  borderNav: "rgba(64, 73, 65, 0.14)",
  navIconMuted: "#66716A",
  primary: "#014925",
  primaryDark: "#004D25",
  primaryDeep: "#003417",
  text: "#1B1B1B",
  textStrong: "#111111",
  textSecondary: "#404941",
  textMuted: "#666666",
  textSubtle: "#5F6B62",
  textFaint: "#626D65",
  border: "#C0C9BE",
  borderSubtle: "#E5E2E1",
  borderMuted: "#E0E0E0",
  borderAccent: "#D0E3D5",
  borderDanger: "#F5C2C7",
  borderSuccess: "#C5E1C9",
  danger: "#D32F2F",
  dangerDark: "#842029",
  dangerLight: "#FCA5A5",
  dangerIcon: "#C41C1C",
  success: "#2E7238",
  successBright: "#4CAF50",
  successLight: "#A8F3AA",
  black: "#122018",
  white: "#FFFEFD",
  overlay: "rgba(18, 32, 24, 0.4)",
} as const;

export const darkColors = {
  background: "#051A1D",
  surface: "#092328",
  surfaceMuted: "#0E3033",
  surfaceSubtle: "#0A292D",
  surfaceAccent: "#0A403A",
  surfaceSuccess: "#0B3D32",
  surfaceDanger: "#3A1D28",
  surfaceImage: "#123A37",
  surfacePlaceholder: "#17373A",
  surfaceNavTranslucent: "rgba(5, 26, 29, 0.94)",
  borderNav: "rgba(138, 245, 208, 0.16)",
  navIconMuted: "#8BAFA9",
  primary: "#00E6A0",
  primaryDark: "#00C88A",
  primaryDeep: "#8AF5D0",
  text: "#E8F5F1",
  textStrong: "#F5FFFB",
  textSecondary: "#B8D2CC",
  textMuted: "#86A9A2",
  textSubtle: "#95BEB5",
  textFaint: "#6E928C",
  border: "#2A5756",
  borderSubtle: "#174144",
  borderMuted: "#1C4A4B",
  borderAccent: "#1D6A5B",
  borderDanger: "#7F4654",
  borderSuccess: "#2F8068",
  danger: "#FF7887",
  dangerDark: "#FFB1B7",
  dangerLight: "#8B4554",
  dangerIcon: "#FF8594",
  success: "#6EF1BE",
  successBright: "#00E5A0",
  successLight: "#A0F7D2",
  black: "#021012",
  white: "#F5FFFB",
  overlay: "rgba(0, 7, 8, 0.72)",
} as const;

export type ThemeColors = typeof lightColors;

// Existing consumers can keep reading `colors.foo`; the proxy resolves the
// current native appearance without requiring every caller to add a hook.
export const colors = new Proxy(lightColors, {
  get(_target, property: keyof ThemeColors) {
    const palette =
      Appearance.getColorScheme() === "dark" ? darkColors : lightColors;
    return palette[property];
  },
}) as ThemeColors;
