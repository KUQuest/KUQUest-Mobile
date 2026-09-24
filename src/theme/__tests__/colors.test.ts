import {
  lightColors,
  darkColors,
  getThemeColors,
  hirerRamp,
  workerRamp,
} from "../colors";

describe("Theme Colors — Organic Editorial Palette", () => {
  describe("Light Palette", () => {
    it("defines the authoritative brand primary tokens", () => {
      expect(lightColors.primary).toBe("#5F7655");
      expect(lightColors.primaryDark).toBe("#465B3E");
      expect(lightColors.primaryDeep).toBe("#34462F");
      expect(lightColors.primarySubtle).toBe("#EDF2EA");
      expect(lightColors.primaryBorder).toBe("#B6C4AF");
      expect(lightColors.onPrimary).toBe("#FFFFFF");
    });

    it("defines the authoritative brand support tokens", () => {
      expect(lightColors.support).toBe("#755570");
      expect(lightColors.supportDark).toBe("#5D4058");
      expect(lightColors.supportDeep).toBe("#463143");
      expect(lightColors.supportSubtle).toBe("#F3ECF2");
      expect(lightColors.supportBorder).toBe("#B79AAF");
      expect(lightColors.onSupport).toBe("#FFFFFF");
    });

    it("defines the authoritative neutral tokens", () => {
      expect(lightColors.background).toBe("#F7F9F8");
      expect(lightColors.surface).toBe("#FFFFFF");
      expect(lightColors.surfaceRaised).toBe("#F0F3F1");
      expect(lightColors.surfaceHigh).toBe("#E7ECE8");
      expect(lightColors.textStrong).toBe("#18201B");
      expect(lightColors.text).toBe("#273029");
      expect(lightColors.textSecondary).toBe("#5F6962");
      expect(lightColors.textMuted).toBe("#737D76");
      expect(lightColors.border).toBe("#D5DDD7");
      expect(lightColors.divider).toBe("#DDE3DF");
    });

    it("defines the authoritative supporting accent tokens", () => {
      expect(lightColors.cream).toBe("#F6EFE6");
      expect(lightColors.gold).toBe("#C8953D");
      expect(lightColors.terracotta).toBe("#9C634D");
      expect(lightColors.rose).toBe("#C88C9B");
    });

    it("defines the authoritative semantic status tokens", () => {
      expect(lightColors.success).toBe("#21864F");
      expect(lightColors.warning).toBe("#B7791F");
      expect(lightColors.danger).toBe("#C13D43");
      expect(lightColors.info).toBe("#356CA5");
    });
  });

  describe("Dark Palette", () => {
    it("defines the authoritative brand primary tokens for dark mode", () => {
      expect(darkColors.primary).toBe("#A9C79E");
      expect(darkColors.primaryDark).toBe("#7FA273");
      expect(darkColors.primaryDeep).toBe("#5F7655");
      expect(darkColors.primarySubtle).toBe("#243128");
      expect(darkColors.primaryBorder).toBe("#526B58");
      expect(darkColors.onPrimary).toBe("#142019");
    });

    it("defines the authoritative brand support tokens for dark mode", () => {
      expect(darkColors.support).toBe("#D8B4D0");
      expect(darkColors.supportDark).toBe("#BE91B5");
      expect(darkColors.supportDeep).toBe("#966B8F");
      expect(darkColors.supportSubtle).toBe("#342832");
      expect(darkColors.supportBorder).toBe("#72556D");
      expect(darkColors.onSupport).toBe("#21171F");
    });

    it("defines the authoritative neutral tokens for dark mode", () => {
      expect(darkColors.background).toBe("#101713");
      expect(darkColors.surface).toBe("#172019");
      expect(darkColors.surfaceRaised).toBe("#1E2A22");
      expect(darkColors.surfaceHigh).toBe("#27342B");
      expect(darkColors.textStrong).toBe("#F2F5F2");
      expect(darkColors.text).toBe("#E3E9E4");
      expect(darkColors.textSecondary).toBe("#B4BDB6");
      expect(darkColors.textMuted).toBe("#919C94");
      expect(darkColors.border).toBe("#3A4940");
      expect(darkColors.divider).toBe("#334039");
    });

    it("defines the authoritative supporting accent tokens for dark mode", () => {
      expect(darkColors.cream).toBe("#302B24");
      expect(darkColors.gold).toBe("#E3BB70");
      expect(darkColors.terracotta).toBe("#DA9A80");
      expect(darkColors.rose).toBe("#DBA7B4");
    });

    it("defines the authoritative semantic status tokens for dark mode", () => {
      expect(darkColors.success).toBe("#62C88B");
      expect(darkColors.warning).toBe("#E4B45A");
      expect(darkColors.danger).toBe("#EF777B");
      expect(darkColors.info).toBe("#75A8DA");
    });
  });

  describe("Ramps and Theme Resolution", () => {
    it("keeps Hirer and Worker ramps distinct", () => {
      expect(hirerRamp.light.primary).toBe("#5F7655");
      expect(workerRamp.light.primary).toBe("#96533F");
      expect(hirerRamp.dark.primary).toBe("#A9C79E");
      expect(workerRamp.dark.primary).toBe("#E1A08C");
    });

    it("resolves the light and dark theme palettes correctly", () => {
      const light = getThemeColors("light");
      const dark = getThemeColors("dark");

      expect(light.primary).toBe("#5F7655");
      expect(light.background).toBe("#F7F9F8");
      expect(dark.primary).toBe("#A9C79E");
      expect(dark.background).toBe("#101713");
    });
  });
});
