import { darkColors, getThemeColors, lightColors } from "@/theme/colors";

describe("Theme appearance palette", () => {
  it("returns readable semantic colors for dark and light themes", () => {
    expect(getThemeColors("dark")).toMatchObject({
      textStrong: darkColors.textStrong,
      textSecondary: darkColors.textSecondary,
    });
    expect(getThemeColors("light")).toMatchObject({
      textStrong: lightColors.textStrong,
      textSecondary: lightColors.textSecondary,
    });
  });
});
