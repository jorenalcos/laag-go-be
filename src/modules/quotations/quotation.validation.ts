
import { z } from "zod";

const quotationStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

const quotationItemSchema = z.object({
  description: z.string().trim().min(2).max(500),
  quantity: z.coerce.number().positive().max(999999),
  unitPrice: z.coerce.number().min(0).max(9999999999.99),
}).strict();

export const createQuotationSchema = z.object({
  inquiryId: z.string().min(1),

  items: z.array(quotationItemSchema).min(1).max(100),

  currency: z.string().trim().length(3).default("PHP"),

  validUntil: z.coerce.date().nullable().optional(),

  terms: z.string().trim().max(5000).nullable().optional(),
}).strict();

export const updateQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1).max(100).optional(),

  currency: z.string().trim().length(3).optional(),

  validUntil: z.coerce.date().nullable().optional(),

  terms: z.string().trim().max(5000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const changeQuotationStatusSchema = z.object({
  status: z.enum([
    "SENT",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
  ]),
}).strict();

export const quotationParamsSchema = z.object({
  id: z.string().min(1),
});

export const listQuotationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(20),

  status: quotationStatusSchema.optional(),

  inquiryId: z.string().min(1).optional(),
});

export type CreateQuotationInput = z.infer<
  typeof createQuotationSchema
>;

export type UpdateQuotationInput = z.infer<
  typeof updateQuotationSchema
>;

export type ChangeQuotationStatusInput = z.infer<
  typeof changeQuotationStatusSchema
>;

export type ListQuotationsQuery = z.infer<
  typeof listQuotationsQuerySchema
>;
