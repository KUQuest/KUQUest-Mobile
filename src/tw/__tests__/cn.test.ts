import { cn } from "../cn";

describe("cn", () => {
  it("keeps a font size and a text colour together", () => {
    // Tailwind v4 puts the `--text-ku-*` size scale and the `--color-ku-text-*`
    // colour scale in one `text-` namespace; an unconfigured tailwind-merge
    // treats them as one conflict group and deletes the size.
    expect(cn("font-ku-bold", "text-ku-title", "text-ku-text-strong")).toBe(
      "font-ku-bold text-ku-title text-ku-text-strong"
    );
    expect(cn("text-ku-body", "text-ku-text-secondary")).toBe(
      "text-ku-body text-ku-text-secondary"
    );
    expect(cn("text-ku-text-strong", "text-ku-body-small")).toBe(
      "text-ku-text-strong text-ku-body-small"
    );
    expect(cn("text-ku-caption", "text-ku-danger")).toBe(
      "text-ku-caption text-ku-danger"
    );
  });

  it("resolves a conflict within one scale to the last class", () => {
    expect(cn("text-ku-title", "text-ku-body")).toBe("text-ku-body");
    expect(cn("text-ku-text-strong", "text-ku-text-secondary")).toBe(
      "text-ku-text-secondary"
    );
    expect(cn("p-ku-md", "p-[3px]")).toBe("p-[3px]");
    expect(cn("gap-ku-sm", "gap-ku-md")).toBe("gap-ku-md");
    expect(cn("rounded-ku-pill", "rounded-[20px]")).toBe("rounded-[20px]");
    expect(cn("bg-ku-surface", "bg-ku-primary")).toBe("bg-ku-primary");
  });
});
