import { darkColors } from "../colors";

function luminance(color: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe("dark theme palette", () => {
  it("keeps primary content and controls readable on dark surfaces", () => {
    expect(
      contrastRatio(darkColors.text, darkColors.background)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(darkColors.textSecondary, darkColors.surface)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(darkColors.textMuted, darkColors.surface)
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(darkColors.primary, darkColors.surface)
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps dark-theme text tokens out of the black range", () => {
    const textTokens = [
      darkColors.text,
      darkColors.textStrong,
      darkColors.textSecondary,
      darkColors.textMuted,
      darkColors.textSubtle,
      darkColors.textFaint,
      darkColors.white,
    ];

    expect(textTokens.every((color) => color.toLowerCase() !== "#000000")).toBe(
      true
    );
    expect(textTokens.every((color) => luminance(color) > 0.15)).toBe(true);
  });
});
