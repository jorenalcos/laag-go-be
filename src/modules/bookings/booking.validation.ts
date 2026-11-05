import { z } from "zod";

export const createBookingSchema = z.object({
  quotationId: z.string().min(1, "Quotation ID is required"),

  providerCost: z.coerce
    .number()
    .finite()
    .min(0, "Provider cost cannot be negative"),

  internalNotes: z.string().trim().nullable().optional(),
});

export const updateBookingSchema = z.object({
  internalNotes: z.string().trim().nullable().optional(),
});

export const changeBookingStatusSchema = z.object({
  status: z.enum([
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum([
      "PENDING_CONFIRMATION",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),

  inquiryId: z.string().optional(),
  quotationId: z.string().optional(),
});

export const bookingParamsSchema = z.object({
  id: z.string().min(1, "Booking ID is required"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ChangeBookingStatusInput = z.infer<
  typeof changeBookingStatusSchema
>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;