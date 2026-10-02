const REPO = "KUQuest/KUQUest-Mobile";
export const API = `https://api.github.com/repos/${REPO}`;
export const RELEASES_URL = `https://github.com/${REPO}/releases`;
const DOWNLOAD_PREFIX = `${RELEASES_URL}/download/`;

/**
 * The APK of a GitHub release, or null. Only GitHub release-download URLs are
 * trusted, so a malformed or hostile API payload can never inject a link.
 */
export function pickApk(release) {
  const asset = release?.assets?.find(
    (candidate) =>
      candidate.name?.endsWith(".apk") &&
      candidate.browser_download_url?.startsWith(DOWNLOAD_PREFIX)
  );
  if (!asset) return null;
  return {
    url: asset.browser_download_url,
    size: asset.size,
    version: /-v(\d+\.\d+\.\d+)/.exec(asset.name)?.[1] ?? null,
    build: /build\.(\d+)/.exec(asset.name)?.[1] ?? null,
    sha256: /^sha256:([0-9a-f]{64})$/.exec(asset.digest ?? "")?.[1] ?? null,
  };
}

export function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Seven-character commit id when the release targets a full commit SHA. */
export function shortSha(ref) {
  return /^[0-9a-f]{40}$/.test(ref ?? "") ? ref.slice(0, 7) : null;
}
