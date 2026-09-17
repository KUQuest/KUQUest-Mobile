export interface CachedAttachmentLink {
  url: string;
  expiresAt: number; // timestamp in milliseconds
}

export class AttachmentLinkCache {
  private cache: Map<string, CachedAttachmentLink> = new Map();
  private inFlight: Map<string, Promise<string>> = new Map();

  private parseExpiresAt(expiresAt: string | number): number {
    if (typeof expiresAt === "number") {
      return expiresAt;
    }
    const parsed = Date.parse(expiresAt);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const numeric = Number(expiresAt);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  get(attachmentId: string): string | null {
    const item = this.cache.get(attachmentId);
    if (!item) {
      return null;
    }

    // 1-minute safety window
    if (Date.now() >= item.expiresAt - 60_000) {
      this.cache.delete(attachmentId);
      return null;
    }

    return item.url;
  }

  set(attachmentId: string, url: string, expiresAt: string | number): void {
    const timestamp = this.parseExpiresAt(expiresAt);
    this.cache.set(attachmentId, {
      url,
      expiresAt: timestamp,
    });
  }

  has(attachmentId: string): boolean {
    return this.get(attachmentId) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  async getOrFetch(
    attachmentId: string,
    fetcher: () => Promise<{ url: string; expiresAt: string | number }>
  ): Promise<string> {
    const cachedUrl = this.get(attachmentId);
    if (cachedUrl) {
      return cachedUrl;
    }

    const pendingPromise = this.inFlight.get(attachmentId);
    if (pendingPromise) {
      return pendingPromise;
    }

    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        this.set(attachmentId, result.url, result.expiresAt);
        return result.url;
      } finally {
        this.inFlight.delete(attachmentId);
      }
    })();

    this.inFlight.set(attachmentId, fetchPromise);
    return fetchPromise;
  }
}

export const attachmentLinkCache = new AttachmentLinkCache();
