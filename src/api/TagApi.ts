import { z } from "zod";
import { ApiClient } from "./ApiClient";

export const tagItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const tagListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(tagItemSchema),
});

export type TagItem = z.infer<typeof tagItemSchema>;

export class TagApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async listTags(): Promise<TagItem[]> {
    const body = await this.client.request<unknown>("/api/v1/tags");
    return tagListResponseSchema.parse(body).data;
  }
}

export const tagApi = new TagApi();
