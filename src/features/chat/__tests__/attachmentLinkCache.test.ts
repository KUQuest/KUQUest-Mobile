import { AttachmentLinkCache } from "../api/attachmentLinkCache";

describe("AttachmentLinkCache", () => {
  let cache: AttachmentLinkCache;

  beforeEach(() => {
    cache = new AttachmentLinkCache();
    jest.restoreAllMocks();
  });

  it("returns null on cache miss and stores/retrieves cached items", () => {
    expect(cache.get("att-1")).toBeNull();
    expect(cache.has("att-1")).toBe(false);

    const expiresAt = Date.now() + 10 * 60_000;
    cache.set("att-1", "https://example.com/file1.png", expiresAt);

    expect(cache.has("att-1")).toBe(true);
    expect(cache.get("att-1")).toBe("https://example.com/file1.png");
  });

  it("handles ISO string timestamps correctly", () => {
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    cache.set("att-iso", "https://example.com/file-iso.png", expiresAt);

    expect(cache.has("att-iso")).toBe(true);
    expect(cache.get("att-iso")).toBe("https://example.com/file-iso.png");
  });

  it("evicts items when within the 1-minute safety window or expired", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    // Exactly 59 seconds until expiration -> within 60s safety buffer -> treated as expired
    cache.set("att-buffered", "https://example.com/buf.png", now + 59_000);
    expect(cache.get("att-buffered")).toBeNull();
    expect(cache.has("att-buffered")).toBe(false);

    // 61 seconds until expiration -> outside 60s buffer -> valid
    cache.set("att-valid", "https://example.com/valid.png", now + 61_000);
    expect(cache.get("att-valid")).toBe("https://example.com/valid.png");
    expect(cache.has("att-valid")).toBe(true);

    // Expired in past
    cache.set("att-past", "https://example.com/past.png", now - 1000);
    expect(cache.get("att-past")).toBeNull();
  });

  it("clears all cached entries and in-flight states", () => {
    cache.set("att-1", "https://example.com/1.png", Date.now() + 100_000);
    expect(cache.has("att-1")).toBe(true);

    cache.clear();
    expect(cache.has("att-1")).toBe(false);
    expect(cache.get("att-1")).toBeNull();
  });

  it("deduplicates simultaneous in-flight fetch requests for the same attachment", async () => {
    let callCount = 0;
    let finishFetch: (val: {
      url: string;
      expiresAt: number;
    }) => void = () => {};

    const fetcher = jest.fn(() => {
      callCount += 1;
      return new Promise<{ url: string; expiresAt: number }>((resolve) => {
        finishFetch = resolve;
      });
    });

    const p1 = cache.getOrFetch("att-dup", fetcher);
    const p2 = cache.getOrFetch("att-dup", fetcher);

    expect(callCount).toBe(1);

    finishFetch({
      url: "https://example.com/fetched.png",
      expiresAt: Date.now() + 15 * 60_000,
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1).toBe("https://example.com/fetched.png");
    expect(res2).toBe("https://example.com/fetched.png");
    expect(callCount).toBe(1);
    expect(cache.get("att-dup")).toBe("https://example.com/fetched.png");
  });

  it("returns cached URL immediately without calling fetcher if already cached", async () => {
    cache.set(
      "att-cached",
      "https://example.com/cached.png",
      Date.now() + 10 * 60_000
    );
    const fetcher = jest.fn();

    const result = await cache.getOrFetch("att-cached", fetcher);
    expect(result).toBe("https://example.com/cached.png");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("cleans up inFlight map and propagates error if fetch fails", async () => {
    let failFetch: (err: Error) => void = () => {};

    const failingFetcher = jest.fn(() => {
      return new Promise<{ url: string; expiresAt: number }>((_, reject) => {
        failFetch = reject;
      });
    });

    const pendingCall = cache.getOrFetch("att-err", failingFetcher);
    failFetch(new Error("Network error"));

    await expect(pendingCall).rejects.toThrow("Network error");

    // Should be able to retry since inFlight was cleaned up
    const successfulFetcher = jest.fn(async () => ({
      url: "https://example.com/success.png",
      expiresAt: Date.now() + 10 * 60_000,
    }));

    const result = await cache.getOrFetch("att-err", successfulFetcher);
    expect(result).toBe("https://example.com/success.png");
    expect(successfulFetcher).toHaveBeenCalledTimes(1);
  });
});
