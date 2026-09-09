import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const tagCatalogResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(tagSchema),
});

export type Tag = z.infer<typeof tagSchema>;
export type TagCatalogResponse = z.infer<typeof tagCatalogResponseSchema>;
