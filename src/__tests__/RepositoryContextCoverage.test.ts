declare const require: (moduleName: string) => {
  readdirSync(
    path: string,
    options: { withFileTypes: true }
  ): { name: string; isDirectory(): boolean }[];
  readFileSync(path: string, encoding: string): string;
};

declare const __dirname: string;

const { readdirSync, readFileSync } = require("fs");

describe("repository context coverage", () => {
  it("names every src/features slice in docs/agents/repository-context.md", () => {
    const slices = readdirSync(`${__dirname}/../features`, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const doc = readFileSync(
      `${__dirname}/../../docs/agents/repository-context.md`,
      "utf8"
    );

    const missing = slices.filter((slice) => !doc.includes(slice));
    expect(missing).toEqual([]);
  });
});

export {};
