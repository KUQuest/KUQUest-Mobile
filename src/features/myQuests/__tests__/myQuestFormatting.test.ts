import { formatQuestDate, getCategoryTone } from "../myQuestFormatting";

describe("My Quests formatting", () => {
  describe("formatQuestDate", () => {
    it("formats ISO date strings in English", () => {
      expect(formatQuestDate("2026-10-01T09:00:00Z", "en")).toMatch(/1\s+Oct/i);
    });

    it("formats date-only strings in Thai", () => {
      const formatted = formatQuestDate("2026-10-01", "th");
      expect(formatted).toContain("1");
      expect(formatted).toContain("ต.ค.");
    });

    it("returns a dash for empty or invalid values", () => {
      expect(formatQuestDate(null)).toBe("—");
      expect(formatQuestDate(undefined)).toBe("—");
      expect(formatQuestDate("invalid-date")).toBe("—");
    });
  });

  describe("getCategoryTone", () => {
    it("maps academic tags to blue", () => {
      expect(getCategoryTone("Academic")).toBe("blue");
      expect(getCategoryTone("วิชาการ")).toBe("blue");
      expect(getCategoryTone("Print document")).toBe("blue");
    });

    it("maps event and design tags to purple", () => {
      expect(getCategoryTone("Event")).toBe("purple");
      expect(getCategoryTone("กิจกรรม")).toBe("purple");
      expect(getCategoryTone("Graphic Design")).toBe("purple");
      expect(getCategoryTone("ออกแบบโลโก้")).toBe("purple");
    });

    it("defaults other tags to green", () => {
      expect(getCategoryTone("General")).toBe("green");
      expect(getCategoryTone("Survey")).toBe("green");
      expect(getCategoryTone("")).toBe("green");
    });
  });
});
