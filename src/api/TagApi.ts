import { z } from "zod";
import { ApiClient } from "./ApiClient";

export const tagItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const tagListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(tagItemSchema),
    nextCursor: z.string().nullable(),
  }),
});

export type TagPage = z.infer<typeof tagListResponseSchema>["data"];

export interface TagListParams {
  q?: string;
  limit?: number;
  cursor?: string;
}

function buildTagQuery(params: TagListParams): string {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export type TagItem = z.infer<typeof tagItemSchema>;

export class TagApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async listTags(params: TagListParams = {}): Promise<TagPage> {
    const body = await this.client.request<unknown>(
      `/api/v1/tags${buildTagQuery(params)}`
    );
    return tagListResponseSchema.parse(body).data;
  }
}

export const tagApi = new TagApi();
