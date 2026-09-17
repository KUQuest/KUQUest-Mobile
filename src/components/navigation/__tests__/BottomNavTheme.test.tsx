import { darkColors, getThemeColors, lightColors } from "@/theme/colors";

import { getBottomNavigationColors } from "../bottomNavStyles";

describe("BottomNav appearance palette", () => {
  it("returns readable semantic colors for dark and light themes", () => {
    expect(getThemeColors("dark")).toMatchObject({
      textStrong: darkColors.textStrong,
      textSecondary: darkColors.textSecondary,
    });
    expect(getThemeColors("light")).toMatchObject({
      textStrong: lightColors.textStrong,
      textSecondary: lightColors.textSecondary,
    });

    expect(getBottomNavigationColors("dark")).toMatchObject({
      navIconMuted: darkColors.navIconMuted,
      primaryDeep: darkColors.primaryDeep,
      textSecondary: darkColors.textSecondary,
    });
    expect(getBottomNavigationColors("light")).toMatchObject({
      navIconMuted: lightColors.navIconMuted,
      primaryDeep: lightColors.primaryDeep,
      textSecondary: lightColors.textSecondary,
    });
  });
});
