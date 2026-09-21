import {
  formatSatangToBaht,
  formatWorkerFallback,
  truncateText,
  getCategoryTone,
} from "../format";

describe("format utils", () => {
  describe("formatSatangToBaht", () => {
    it("formats integer baht amounts without decimals", () => {
      expect(formatSatangToBaht(15000)).toBe("150");
      expect(formatSatangToBaht(100)).toBe("1");
      expect(formatSatangToBaht(0)).toBe("0");
    });

    it("formats fractional baht amounts with 2 decimals", () => {
      expect(formatSatangToBaht(15050)).toBe("150.50");
      expect(formatSatangToBaht(25)).toBe("0.25");
    });
  });

  describe("formatWorkerFallback", () => {
    it("formats worker fallback label with truncated UUID", () => {
      expect(formatWorkerFallback("12345678-abcd-ef01")).toBe(
        "Worker 12345678"
      );
    });

    it("uses short id without truncating if 8 or fewer chars", () => {
      expect(formatWorkerFallback("short")).toBe("Worker short");
    });

    it("supports custom prefix", () => {
      expect(formatWorkerFallback("1234567890", "Candidate")).toBe(
        "Candidate 12345678"
      );
    });
  });

  describe("truncateText", () => {
    it("returns original text if shorter than or equal to maxLength", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
      expect(truncateText("Hello", 5)).toBe("Hello");
    });

    it("truncates text and appends ellipsis if exceeds maxLength", () => {
      expect(truncateText("Hello World", 5)).toBe("Hello…");
    });

    it("handles empty or falsy strings gracefully", () => {
      expect(truncateText("", 5)).toBe("");
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
