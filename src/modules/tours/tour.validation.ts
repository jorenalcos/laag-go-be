
import { z } from "zod";

const priceBasisValues = [
  "PER_PERSON",
  "PER_GROUP",
  "CUSTOM_QUOTE",
] as const;

const tourStatusValues = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const createTourSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).nullable().optional(),
  currency: z.string().trim().length(3).default("PHP"),
  priceBasis: z.enum(priceBasisValues).default("CUSTOM_QUOTE"),
  basePrice: z.number().nonnegative().max(9999999999.99).nullable().optional(),
  durationDays: z.number().int().min(1).max(365).default(1),
  defaultItineraryTemplateId: z.string().nullable().optional(),
}).strict().superRefine((data, ctx) => {
  if (data.priceBasis === "CUSTOM_QUOTE" && data.basePrice != null) {
    ctx.addIssue({
      code: "custom",
      path: ["basePrice"],
      message: "Custom quote tours should not have a fixed base price",
    });
  }

  if (
    data.priceBasis !== "CUSTOM_QUOTE" &&
    data.basePrice == null
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["basePrice"],
      message: "A base price is required for this pricing basis",
    });
  }
});

export const updateTourSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  priceBasis: z.enum(priceBasisValues).optional(),
  basePrice: z.number().nonnegative().max(9999999999.99).nullable().optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  defaultItineraryTemplateId: z.string().nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const updateTourStatusSchema = z.object({
  status: z.enum(tourStatusValues),
}).strict();

export const tourParamsSchema = z.object({
  id: z.string().min(1),
});

export const listToursQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  status: z.enum(tourStatusValues).optional(),
  priceBasis: z.enum(priceBasisValues).optional(),
});

export const publicToursQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().max(160).optional(),
});

export type CreateTourInput = z.infer<typeof createTourSchema>;
export type UpdateTourInput = z.infer<typeof updateTourSchema>;
export type UpdateTourStatusInput = z.infer<typeof updateTourStatusSchema>;
export type ListToursQuery = z.infer<typeof listToursQuerySchema>;
export type PublicToursQuery = z.infer<typeof publicToursQuerySchema>;
