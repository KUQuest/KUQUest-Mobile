const {
  findHardcodedLocaleStrings,
} = require("../check-hardcoded-locale-strings");

describe("hardcoded locale string scanner", () => {
  test("finds inline Thai and English copy in a multiline locale ternary", () => {
    const source = `const label = locale === "th"
      ? "ไม่สามารถโหลด Inquiry ได้"
      : "Candidate inquiries could not be loaded.";`;

    expect(findHardcodedLocaleStrings(source, "example.tsx")).toEqual([
      { file: "example.tsx", line: 1 },
    ]);
  });

  test("finds nested branches and localized template literals", () => {
    const source = [
      'const label = locale === "th"',
      '  ? role === "owner" ? "ผู้ว่าจ้าง" : "ผู้สนใจ"',
      '  : role === "owner" ? "Hirer" : "Worker";',
      'const due = locale === "th" ? `ครบกำหนด ${date}` : `Due ${date}`;',
    ].join("\n");

    expect(findHardcodedLocaleStrings(source, "example.ts")).toEqual([
      { file: "example.ts", line: 1 },
      { file: "example.ts", line: 4 },
    ]);
  });

  test("ignores locale identifiers and dictionary lookups", () => {
    const source = `const dateLocale = locale === "th" ? "th-TH" : "en-US";
const message = locale === "th" ? messages.th.failed : messages.en.failed;
const unrelated = language === "th" ? "ข้อความ" : "message";`;

    expect(findHardcodedLocaleStrings(source, "example.ts")).toEqual([]);
  });
});
