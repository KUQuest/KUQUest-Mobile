import { ApiClient } from "../ApiClient";
import { tagCatalogResponseSchema } from "./tagContracts";
import type { Tag } from "./tagContracts";

let cachedTags: Tag[] | null = null;
let pendingTags: Promise<Tag[]> | null = null;

export class TagApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async listTags(): Promise<Tag[]> {
    if (cachedTags) return cachedTags;
    if (pendingTags) return pendingTags;

    pendingTags = this.client
      .request<unknown>("/api/v1/tags")
      .then((body) => tagCatalogResponseSchema.parse(body).data)
      .then((tags) => {
        cachedTags = tags;
        return tags;
      })
      .finally(() => {
        pendingTags = null;
      });

    return pendingTags;
  }
}

export const tagApi = new TagApi();

export function resetTagApiCache(): void {
  cachedTags = null;
  pendingTags = null;
}
