
import { z } from "zod";

const itineraryStopSchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(30),
  sortOrder: z.coerce.number().int().min(0).default(0),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(250).nullable().optional(),
  durationMinutes: z.coerce.number().int().positive().nullable().optional(),
}).strict();

const itinerarySchema = z.object({
  type: z.enum(["TEMPLATE", "CUSTOM", "MIXED"]),
  templateId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(2).max(200),
  durationDays: z.coerce.number().int().min(1).max(30),
  notes: z.string().trim().max(3000).nullable().optional(),
  stops: z.array(itineraryStopSchema).max(150).optional(),
}).strict().superRefine((itinerary, ctx) => {
  if (
    itinerary.type === "TEMPLATE" &&
    !itinerary.templateId
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["templateId"],
      message: "A template ID is required for template itineraries",
    });
  }

  if (
    itinerary.type === "CUSTOM" &&
    itinerary.templateId
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["templateId"],
      message: "Custom itineraries cannot reference a template",
    });
  }

  if (
    itinerary.type === "CUSTOM" &&
    (!itinerary.stops || itinerary.stops.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["stops"],
      message: "Custom itineraries must have at least one stop",
    });
  }

  if (
    itinerary.type === "MIXED" &&
    (!itinerary.templateId || !itinerary.stops)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["stops"],
      message: "Mixed itineraries require a template and customized stops",
    });
  }

  itinerary.stops?.forEach((stop, index) => {
    if (stop.dayNumber > itinerary.durationDays) {
      ctx.addIssue({
        code: "custom",
        path: ["stops", index, "dayNumber"],
        message: "Stop day cannot exceed itinerary duration",
      });
    }
  });
});

export const createInquirySchema = z.object({
  tourId: z.string().trim().min(1).nullable().optional(),

  guestName: z.string().trim().min(2).max(160),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().max(40).nullable().optional(),

  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),

  guestCount: z.coerce.number().int().min(1).max(100).default(1),

  pickupLocation: z.string().trim().max(250).nullable().optional(),
  specialRequests: z.string().trim().max(3000).nullable().optional(),

  itinerary: itinerarySchema.optional(),
}).strict().superRefine((inquiry, ctx) => {
  if (
    inquiry.startDate &&
    inquiry.endDate &&
    inquiry.endDate < inquiry.startDate
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date cannot be earlier than start date",
    });
  }
});

export const updateInquirySchema = z.object({
  status: z.enum([
    "NEW",
    "REVIEWING",
    "PROVIDER_ASSIGNED",
    "QUOTED",
    "ACCEPTED",
    "LOST",
    "CANCELLED",
  ]).optional(),

  assignedOrganizationId: z.string().trim().nullable().optional(),
  internalNotes: z.string().trim().max(5000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    "NEW",
    "REVIEWING",
    "PROVIDER_ASSIGNED",
    "QUOTED",
    "ACCEPTED",
    "LOST",
    "CANCELLED",
  ]).optional(),
  search: z.string().trim().max(160).optional(),
});

export const inquiryParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
