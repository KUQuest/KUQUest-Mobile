import { formatSize, parseNotes, pickApk, shortSha } from "../release";

const BASE = "https://github.com/KUQuest/KUQUest-Mobile/releases/download";
const SHA = "a".repeat(64);

describe("pickApk", () => {
  it("reads version, build, size and checksum from a staging release", () => {
    const release = {
      assets: [
        {
          name: "KUQuest-Staging-v1.2.3-build.45-abc1234.apk.sha256",
          browser_download_url: `${BASE}/staging-latest/x.sha256`,
        },
        {
          name: "KUQuest-Staging-v1.2.3-build.45-abc1234.apk",
          browser_download_url: `${BASE}/staging-latest/KUQuest-Staging-v1.2.3-build.45-abc1234.apk`,
          size: 64_000_000,
          digest: `sha256:${SHA}`,
        },
      ],
    };

    expect(pickApk(release)).toEqual({
      url: `${BASE}/staging-latest/KUQuest-Staging-v1.2.3-build.45-abc1234.apk`,
      size: 64_000_000,
      version: "1.2.3",
      build: "45",
      sha256: SHA,
    });
  });

  it("has no build number for an untagged APK and tolerates a missing digest", () => {
    const apk = pickApk({
      assets: [
        {
          name: "KUQuest-v1.0.0.apk",
          browser_download_url: `${BASE}/v1.0.0/KUQuest-v1.0.0.apk`,
          size: 1,
        },
      ],
    });

    expect(apk).toMatchObject({ version: "1.0.0", build: null, sha256: null });
  });

  it("refuses a download URL outside this repository's releases", () => {
    expect(
      pickApk({
        assets: [
          {
            name: "KUQuest-v1.0.0.apk",
            browser_download_url: "https://evil.example/KUQuest-v1.0.0.apk",
          },
        ],
      })
    ).toBeNull();
  });

  it("returns null when a release has no APK", () => {
    expect(pickApk({ assets: [] })).toBeNull();
    expect(pickApk(null)).toBeNull();
  });

  it("drops a malformed digest instead of showing it", () => {
    const apk = pickApk({
      assets: [
        {
          name: "KUQuest-v1.0.0.apk",
          browser_download_url: `${BASE}/v1.0.0/KUQuest-v1.0.0.apk`,
          digest: "sha256:not-hex",
        },
      ],
    });

    expect(apk.sha256).toBeNull();
  });
});

describe("shortSha", () => {
  it("shortens a full commit SHA and rejects branch names", () => {
    expect(shortSha("0123456789abcdef0123456789abcdef01234567")).toBe(
      "0123456"
    );
    expect(shortSha("develop")).toBeNull();
    expect(shortSha(undefined)).toBeNull();
  });
});

describe("formatSize", () => {
  it("formats bytes as megabytes", () => {
    expect(formatSize(65_536_000)).toBe("62.5 MB");
  });
});

describe("parseNotes", () => {
  const RUN = "https://github.com/KUQuest/KUQUest-Mobile/actions/runs/123456";

  it("reads the commit subject and build-log link from workflow notes", () => {
    const notes = `Message: feat(x): add y (#12)\r\nCommit: abc\r\nRun: ${RUN}\r\n`;

    expect(parseNotes(notes)).toEqual({
      message: "feat(x): add y (#12)",
      runUrl: RUN,
    });
  });

  it("ignores free text, empty messages and foreign run links", () => {
    expect(
      parseNotes("Latest develop build (abc). Replaced on every push.")
    ).toEqual({
      message: null,
      runUrl: null,
    });
    expect(
      parseNotes("Message: \nRun: https://evil.example/actions/runs/1")
    ).toEqual({
      message: null,
      runUrl: null,
    });
    expect(parseNotes(null)).toEqual({ message: null, runUrl: null });
  });
});
