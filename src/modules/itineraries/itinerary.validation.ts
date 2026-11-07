
import { z } from "zod";

const itineraryStatusValues = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const createItineraryStopSchema = z.object({
  dayNumber: z.number().int().min(1).max(365).default(1),
  sortOrder: z.number().int().min(0).default(0),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).nullable().optional(),
  location: z.string().trim().max(250).nullable().optional(),
  durationMinutes: z.number().int().positive().max(100000).nullable().optional(),
}).strict();

export const updateItineraryStopSchema = z
  .object({
    dayNumber: z.number().int().min(1).max(365).optional(),
    sortOrder: z.number().int().min(0).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(3000).nullable().optional(),
    location: z.string().trim().max(250).nullable().optional(),
    durationMinutes: z.number().int().positive().max(100000).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one stop field must be provided",
    },
  );

export const createItinerarySchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).nullable().optional(),
  durationDays: z.number().int().min(1).max(365).default(1),
  isFeatured: z.boolean().default(false),
  stops: z.array(createItineraryStopSchema).min(1).max(500),
}).strict().superRefine((data, ctx) => {
  data.stops.forEach((stop, index) => {
    if (stop.dayNumber > data.durationDays) {
      ctx.addIssue({
        code: "custom",
        path: ["stops", index, "dayNumber"],
        message: "Stop day cannot exceed itinerary duration",
      });
    }
  });
});

export const updateItinerarySchema = z.object({
  name: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  isFeatured: z.boolean().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const updateItineraryStatusSchema = z.object({
  status: z.enum(itineraryStatusValues),
}).strict();

export const itineraryParamsSchema = z.object({
  id: z.string().min(1),
});

export const itineraryStopParamsSchema = z.object({
  id: z.string().min(1),
  stopId: z.string().min(1),
});

export const listItinerariesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  status: z.enum(itineraryStatusValues).optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
});

export type CreateItineraryInput = z.infer<
  typeof createItinerarySchema
>;

export type UpdateItineraryInput = z.infer<
  typeof updateItinerarySchema
>;

export type CreateItineraryStopInput = z.infer<
  typeof createItineraryStopSchema
>;

export type UpdateItineraryStopInput = z.infer<
  typeof updateItineraryStopSchema
>;

export type ListItinerariesQuery = z.infer<
  typeof listItinerariesQuerySchema
>;
