
import { z } from "zod";

export const mediaFolderSchema = z.enum([
  "products",
  "categories",
  "tours",
  "itineraries",
  "organizations",
  "profiles",
]);

export const uploadMediaSchema = z.object({
  folder: mediaFolderSchema.default("tours"),
});

export type UploadMediaInput = z.infer<
  typeof uploadMediaSchema
>;
